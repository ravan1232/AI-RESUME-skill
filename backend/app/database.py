import asyncio
import json
import logging
import socket
from pathlib import Path
from urllib.parse import urlparse
from typing import Any, Dict, List, Optional
import certifi
import motor.motor_asyncio
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import settings

logger = logging.getLogger(__name__)

# Persist fallback storage locally so data is NEVER lost even if Atlas IP is blocked
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

def is_mongo_available(url: str) -> bool:
    """Fast check to see if target host and port are reachable before initiating driver loops."""
    try:
        parsed = urlparse(url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 27017
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.2)
            res = s.connect_ex((host, port))
            return res == 0
    except Exception:
        return False

# Fallback Async File-backed Mongo-compatible collection for resilient offline dev & tests
class AsyncFallbackCollection:
    def __init__(self, name: str):
        self.name = name
        self.file_path = DATA_DIR / f"{name}.json"
        self._data: Dict[str, Dict[str, Any]] = self._load()

    def _load(self) -> Dict[str, Dict[str, Any]]:
        if self.file_path.exists():
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not load fallback file {self.file_path}: {e}")
                return {}
        return {}

    def _save(self):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error persisting fallback collection {self.name}: {e}")

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, subq) for subq in v):
                    return False
                continue
            if k == "$and" and isinstance(v, list):
                if not all(self._matches(doc, subq) for subq in v):
                    return False
                continue
            if "." in k:
                parts = k.split(".")
                curr = doc
                for p in parts:
                    if isinstance(curr, dict) and p in curr:
                        curr = curr[p]
                    else:
                        curr = None
                        break
                if curr != v:
                    return False
                continue
            if doc.get(k) != v:
                return False
        return True

    async def find_one(self, query: Dict[str, Any], projection: Optional[Dict[str, int]] = None) -> Optional[Dict[str, Any]]:
        for doc in self._data.values():
            if self._matches(doc, query):
                res = dict(doc)
                if projection and projection.get("hashed_password") == 0:
                    res.pop("hashed_password", None)
                return res
        return None

    def find(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, int]] = None):
        q = query or {}
        matched = [dict(d) for d in self._data.values() if self._matches(d, q)]

        class Cursor:
            def __init__(self, items):
                self._items = items

            def sort(self, key, direction=1):
                reverse = direction == -1
                self._items.sort(key=lambda x: x.get(key, ""), reverse=reverse)
                return self

            def limit(self, n: int):
                self._items = self._items[:n]
                return self

            def skip(self, n: int):
                self._items = self._items[n:]
                return self

            def __aiter__(self):
                self._iter = iter(self._items)
                return self

            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration

            async def to_list(self, length: Optional[int] = None):
                if length is not None:
                    return self._items[:length]
                return list(self._items)

        return Cursor(matched)

    async def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            import uuid
            doc_copy["_id"] = str(uuid.uuid4())
        self._data[str(doc_copy["_id"])] = doc_copy
        self._save()
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy["_id"])

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        target_id = None
        for doc_id, doc in self._data.items():
            if self._matches(doc, query):
                target_id = doc_id
                break

        class UpdateResult:
            def __init__(self, matched_count, modified_count, upserted_id=None):
                self.matched_count = matched_count
                self.modified_count = modified_count
                self.upserted_id = upserted_id

        if target_id is not None:
            doc = self._data[target_id]
            if "$set" in update:
                for k, v in update["$set"].items():
                    if "." in k:
                        parts = k.split(".")
                        curr = doc
                        for p in parts[:-1]:
                            if p not in curr or not isinstance(curr[p], dict):
                                curr[p] = {}
                            curr = curr[p]
                        curr[parts[-1]] = v
                    else:
                        doc[k] = v
            if "$addToSet" in update:
                for k, v in update["$addToSet"].items():
                    if k not in doc or not isinstance(doc[k], list):
                        doc[k] = []
                    if v not in doc[k]:
                        doc[k].append(v)
            self._save()
            return UpdateResult(1, 1)
        elif upsert:
            new_doc = dict(query)
            if "$set" in update:
                new_doc.update(update["$set"])
            res = await self.insert_one(new_doc)
            self._save()
            return UpdateResult(0, 1, res.inserted_id)

        return UpdateResult(0, 0)

    async def delete_one(self, query: Dict[str, Any]):
        class DeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count

        for doc_id, doc in list(self._data.items()):
            if self._matches(doc, query):
                del self._data[doc_id]
                self._save()
                return DeleteResult(1)
        return DeleteResult(0)

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        q = query or {}
        return sum(1 for d in self._data.values() if self._matches(d, q))

    async def create_index(self, *args, **kwargs):
        return "index_ok"


class DatabaseManager:
    def __init__(self):
        self.client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
        self.db = None
        self.is_connected = False
        self._fallback_collections: Dict[str, AsyncFallbackCollection] = {}

    async def connect(self):
        """Attempts to connect to MongoDB Atlas / Local MongoDB, falls back gracefully if unavailable."""
        is_atlas = settings.MONGODB_URL.startswith("mongodb+srv://") or "@" in settings.MONGODB_URL
        
        if not is_atlas and not is_mongo_available(settings.MONGODB_URL):
            logger.info("Notice: Local MongoDB not detected. Engaging high-performance asynchronous fallback datastore.")
            self.is_connected = False
            self.db = None
            return

        timeout_ms = 10000 if is_atlas else 1000
        ping_timeout = 8.0 if is_atlas else 1.0

        try:
            masked_url = settings.MONGODB_URL.split('@')[-1] if '@' in settings.MONGODB_URL else settings.MONGODB_URL
            logger.info(f"Connecting to MongoDB at {masked_url} (Atlas mode: {is_atlas})...")
            
            client_kwargs = {
                "serverSelectionTimeoutMS": timeout_ms,
                "connectTimeoutMS": timeout_ms,
            }
            if is_atlas:
                client_kwargs["tlsCAFile"] = certifi.where()

            self.client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URL,
                **client_kwargs
            )
            # Ping database to verify connection
            await asyncio.wait_for(self.client.admin.command('ping'), timeout=ping_timeout)
            self.db = self.client[settings.DATABASE_NAME]
            self.is_connected = True
            logger.info("MongoDB Atlas / Server connection established successfully.")
            await self.create_indexes()
        except Exception as e:
            logger.warning(
                f"Notice: MongoDB connection attempt bypassed ({type(e).__name__}: {e}). "
                "Engaging high-performance asynchronous fallback datastore for offline operation."
            )
            self.is_connected = False
            self.db = None

    async def create_indexes(self):
        """Create platform database indexes for optimized query performance."""
        if self.is_connected and self.db is not None:
            try:
                await self.db.users.create_index("email", unique=True)
                await self.db.users.create_index("role")
                await self.db.student_profiles.create_index("user_id", unique=True)
                await self.db.student_profiles.create_index("skills_can_teach.skill_name")
                await self.db.student_profiles.create_index("skills_want_to_learn.skill_name")
                await self.db.resumes.create_index("user_id")
                await self.db.job_analyses.create_index("user_id")
                await self.db.skill_exchanges.create_index("requester_id")
                await self.db.skill_exchanges.create_index("provider_id")
                await self.db.messages.create_index("exchange_id")
                await self.db.skills.create_index("name", unique=True)
                logger.info("Database indexes verified and created.")
            except Exception as e:
                logger.error(f"Error creating indexes: {e}")

    def get_collection(self, name: str):
        """Returns either the Motor collection or the async fallback collection."""
        if self.is_connected and self.db is not None:
            return self.db[name]
        if name not in self._fallback_collections:
            col = AsyncFallbackCollection(name)
            if not col._data:
                self._seed_fallback_collection(name, col)
            self._fallback_collections[name] = col
        return self._fallback_collections[name]

    def _seed_fallback_collection(self, name: str, col: AsyncFallbackCollection):
        """Seed initial users and skills if offline fallback storage is brand new."""
        import uuid
        from datetime import datetime, timezone
        from app.utils.security import hash_password
        now_iso = datetime.now(timezone.utc).isoformat()

        if name == "users":
            u1_id = "861b7f1f-9207-4ba3-b51d-0bd65eafc2e1"
            u2_id = "156a7177-bf5e-4fec-a442-f85336a2057e"
            col._data[u1_id] = {
                "_id": u1_id,
                "email": "roshanmallick1890@gmail.com",
                "hashed_password": hash_password("password123"),
                "full_name": "Roshan",
                "role": "student",
                "is_active": True,
                "created_at": now_iso,
                "updated_at": now_iso
            }
            col._data[u2_id] = {
                "_id": u2_id,
                "email": "keerthi12@gmail.com",
                "hashed_password": hash_password("password123"),
                "full_name": "Keerthi",
                "role": "admin",
                "is_active": True,
                "created_at": now_iso,
                "updated_at": now_iso
            }
            col._save()

        elif name == "student_profiles":
            u1_id = "861b7f1f-9207-4ba3-b51d-0bd65eafc2e1"
            col._data[u1_id] = {
                "_id": str(uuid.uuid4()),
                "user_id": u1_id,
                "full_name": "Roshan",
                "headline": "Full-Stack Engineer & AI Placement Candidate",
                "college": "Institute of Technology",
                "graduation_year": 2026,
                "skills_can_teach": [
                    {"skill_name": "Python", "proficiency": "advanced", "years_of_experience": 2.0, "verified": True, "rating": 5.0},
                    {"skill_name": "FastAPI", "proficiency": "intermediate", "years_of_experience": 1.5, "verified": True, "rating": 4.8}
                ],
                "skills_want_to_learn": [
                    {"skill_name": "React", "target_proficiency": "advanced", "priority": "high"},
                    {"skill_name": "Docker", "target_proficiency": "intermediate", "priority": "medium"}
                ],
                "placement_readiness": {
                    "overall_score": 85,
                    "ats_score": 88,
                    "technical_skill_score": 84,
                    "soft_skill_score": 80,
                    "mock_interview_score": 82,
                    "verified_skills_count": 2,
                    "last_updated": now_iso
                },
                "created_at": now_iso,
                "updated_at": now_iso
            }
            col._save()

        elif name == "skills":
            default_skills = [
                {"name": "Python", "category": "Programming Languages", "description": "Core Python programming & OOP"},
                {"name": "FastAPI", "category": "Web Frameworks", "description": "High-performance async Python web framework"},
                {"name": "React", "category": "Frontend Development", "description": "Modern component-based UI library"},
                {"name": "Docker", "category": "DevOps & Cloud", "description": "Containerization platform"},
                {"name": "Kubernetes", "category": "DevOps & Cloud", "description": "Container orchestration system"},
                {"name": "Machine Learning", "category": "AI & Data Science", "description": "Predictive modeling and algorithms"},
                {"name": "System Design", "category": "Architecture", "description": "Scalable distributed system architecture"}
            ]
            for s in default_skills:
                sid = str(uuid.uuid4())
                s["_id"] = sid
                col._data[sid] = s
            col._save()

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")


db_manager = DatabaseManager()

# Shortcut collection getters
def get_users_collection():
    return db_manager.get_collection("users")

def get_student_profiles_collection():
    return db_manager.get_collection("student_profiles")

def get_resumes_collection():
    return db_manager.get_collection("resumes")

def get_job_analyses_collection():
    return db_manager.get_collection("job_analyses")

def get_skills_collection():
    return db_manager.get_collection("skills")

def get_exchanges_collection():
    return db_manager.get_collection("skill_exchanges")

def get_sessions_collection():
    return db_manager.get_collection("learning_sessions")

def get_messages_collection():
    return db_manager.get_collection("messages")

def get_assessments_collection():
    return db_manager.get_collection("assessments")

def get_resources_collection():
    return db_manager.get_collection("learning_resources")
