import logging
from datetime import datetime, timezone
import uuid
from app.database import (
    get_users_collection,
    get_student_profiles_collection,
    get_skills_collection
)
from app.utils.security import hash_password

logger = logging.getLogger(__name__)

async def seed_initial_data():
    """Seed initial demo accounts and skills catalog if not present."""
    users_col = get_users_collection()
    profiles_col = get_student_profiles_collection()
    skills_col = get_skills_collection()

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Student Demo Account
    student_email = "sarah.connor@university.edu"
    existing_student = await users_col.find_one({"email": student_email})
    if not existing_student:
        student_id = str(uuid.uuid4())
        await users_col.insert_one({
            "_id": student_id,
            "email": student_email,
            "hashed_password": hash_password("SecurePassword123!"),
            "full_name": "Sarah Connor",
            "role": "student",
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso
        })
        await profiles_col.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": student_id,
            "full_name": "Sarah Connor",
            "email": student_email,
            "college": "Institute of Technology",
            "department": "Computer Science & Engineering",
            "graduation_year": 2026,
            "bio": "Enthusiastic computer science student preparing for campus placements. Passionate about Python, backend APIs and distributed systems.",
            "headline": "Lead AI Architect in Training | Python & React",
            "github_url": "https://github.com/sarahconnor",
            "linkedin_url": "https://linkedin.com/in/sarahconnor",
            "skills_can_teach": [
                {
                    "skill_name": "Python & FastAPI",
                    "proficiency": "advanced",
                    "years_of_experience": 2.5,
                    "verified": True,
                    "rating": 5.0
                },
                {
                    "skill_name": "React.js",
                    "proficiency": "intermediate",
                    "years_of_experience": 1.5,
                    "verified": False,
                    "rating": 4.8
                }
            ],
            "skills_want_to_learn": [
                {
                    "skill_name": "Docker & Containers",
                    "target_proficiency": "intermediate",
                    "priority": "high"
                },
                {
                    "skill_name": "Kubernetes",
                    "target_proficiency": "intermediate",
                    "priority": "high"
                }
            ],
            "availability": {
                "days": ["Monday", "Wednesday", "Friday"],
                "time_slots": ["18:00-20:00"],
                "timezone": "UTC+05:30"
            },
            "placement_readiness": {
                "overall_score": 78,
                "ats_score": 82,
                "technical_skill_score": 75,
                "soft_skill_score": 80,
                "mock_interview_score": 72,
                "verified_skills_count": 2,
                "last_updated": now_iso
            },
            "created_at": now_iso,
            "updated_at": now_iso
        })
        logger.info("Demo student seeded: %s", student_email)

    # 2. Peer Mentor 1: Priya Sharma (teaches Docker & Kubernetes)
    priya_email = "priya.sharma@university.edu"
    if not await users_col.find_one({"email": priya_email}):
        priya_id = str(uuid.uuid4())
        await users_col.insert_one({
            "_id": priya_id,
            "email": priya_email,
            "hashed_password": hash_password("Password123!"),
            "full_name": "Priya Sharma",
            "role": "student",
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso
        })
        await profiles_col.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": priya_id,
            "full_name": "Priya Sharma",
            "email": priya_email,
            "college": "Institute of Technology",
            "department": "Information Technology",
            "graduation_year": 2026,
            "bio": "DevOps enthusiast and open source contributor. Love containerization and cloud infrastructure.",
            "headline": "Cloud & DevOps Specialist | Docker, K8s, AWS",
            "skills_can_teach": [
                {
                    "skill_name": "Docker & Containers",
                    "proficiency": "advanced",
                    "years_of_experience": 2.0,
                    "verified": True,
                    "rating": 4.9
                },
                {
                    "skill_name": "Kubernetes",
                    "proficiency": "intermediate",
                    "years_of_experience": 1.5,
                    "verified": True,
                    "rating": 4.8
                }
            ],
            "skills_want_to_learn": [
                {
                    "skill_name": "Python & FastAPI",
                    "target_proficiency": "intermediate",
                    "priority": "high"
                }
            ],
            "availability": {
                "days": ["Tuesday", "Thursday", "Saturday"],
                "time_slots": ["19:00-21:00"],
                "timezone": "UTC+05:30"
            },
            "placement_readiness": {
                "overall_score": 85,
                "ats_score": 88,
                "technical_skill_score": 84,
                "soft_skill_score": 82,
                "mock_interview_score": 80,
                "verified_skills_count": 4,
                "last_updated": now_iso
            },
            "created_at": now_iso,
            "updated_at": now_iso
        })
        logger.info("Demo student seeded: %s", priya_email)

    # 3. Admin Account
    admin_email = "admin@skillbridge.edu"
    if not await users_col.find_one({"email": admin_email}):
        admin_id = str(uuid.uuid4())
        await users_col.insert_one({
            "_id": admin_id,
            "email": admin_email,
            "hashed_password": hash_password("AdminPassword2026!"),
            "full_name": "System Administrator",
            "role": "admin",
            "is_active": True,
            "created_at": now_iso,
            "updated_at": now_iso
        })
        logger.info("Demo admin seeded: %s", admin_email)

