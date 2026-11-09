import asyncio
import os
import sys
from datetime import datetime, timezone
import uuid
import certifi
import motor.motor_asyncio
from dotenv import load_dotenv

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
from app.utils.security import hash_password

env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

async def seed_mongodb_atlas():
    mongo_url = os.getenv("MONGODB_URL")
    db_name = os.getenv("DATABASE_NAME", "skillbridge_db")

    print("==================================================")
    print("   SkillBridge AI: Seed Database to MongoDB Atlas ")
    print("==================================================")
    
    if not mongo_url or "cluster0" not in mongo_url:
        print("❌ Error: MongoDB Atlas URL not found in .env")
        return

    # Mask password for display
    masked = mongo_url
    if "@" in mongo_url:
        prefix = mongo_url.split("@")[0].split(":")[0] + ":****@"
        masked = prefix + mongo_url.split("@")[1]
    print(f"Connecting to: {masked}")

    client = motor.motor_asyncio.AsyncIOMotorClient(
        mongo_url,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=10000
    )
    db = client[db_name]

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Platform Skills Catalog
    skills_col = db["skills"]
    catalog_skills = [
        {"name": "Python", "category": "Programming Languages", "description": "Core Python programming & OOP concepts"},
        {"name": "FastAPI", "category": "Web Frameworks", "description": "Modern, high-performance async Python web framework"},
        {"name": "React.js", "category": "Frontend Frameworks", "description": "Component-driven frontend UI library"},
        {"name": "Docker", "category": "DevOps & Cloud", "description": "Containerization platform for modern applications"},
        {"name": "Kubernetes", "category": "DevOps & Cloud", "description": "Container orchestration and cluster management"},
        {"name": "AWS", "category": "Cloud Computing", "description": "Amazon Web Services (S3, EC2, Lambda, IAM)"},
        {"name": "System Design", "category": "Architecture", "description": "Scalable distributed systems, caching, microservices"},
        {"name": "Data Structures & Algorithms", "category": "Core CS", "description": "Binary trees, dynamic programming, graphs"},
        {"name": "PostgreSQL", "category": "Databases", "description": "Relational database management and query optimization"},
        {"name": "MongoDB", "category": "Databases", "description": "NoSQL document database and schema design"},
        {"name": "Tailwind CSS", "category": "Frontend Frameworks", "description": "Utility-first CSS styling framework"}
    ]
    for s in catalog_skills:
        await skills_col.update_one({"name": s["name"]}, {"$set": s}, upsert=True)
    print(f"✅ Skills Catalog: {len(catalog_skills)} skills seeded.")

    # 2. Users & Student Profiles
    users_col = db["users"]
    profiles_col = db["student_profiles"]

    demo_users = [
        {
            "email": "sarah.connor@university.edu",
            "password": "SecurePassword123!",
            "full_name": "Sarah Connor",
            "role": "student",
            "headline": "Lead AI Architect in Training | Python & React",
            "college": "Institute of Technology",
            "department": "Computer Science & Engineering",
            "graduation_year": 2026,
            "bio": "Enthusiastic computer science student preparing for placements. Passionate about Python, backend APIs and distributed systems.",
            "skills_can_teach": [
                {"skill_name": "Python", "proficiency": "advanced", "years_of_experience": 2.5, "verified": True, "rating": 5.0},
                {"skill_name": "React.js", "proficiency": "intermediate", "years_of_experience": 1.5, "verified": False, "rating": 4.8}
            ],
            "skills_want_to_learn": [
                {"skill_name": "Docker", "target_proficiency": "intermediate", "priority": "high"},
                {"skill_name": "Kubernetes", "target_proficiency": "intermediate", "priority": "high"}
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
            }
        },
        {
            "email": "priya.sharma@university.edu",
            "password": "Password123!",
            "full_name": "Priya Sharma",
            "role": "student",
            "headline": "Cloud & DevOps Specialist | Docker, K8s, AWS",
            "college": "Institute of Technology",
            "department": "Information Technology",
            "graduation_year": 2026,
            "bio": "DevOps enthusiast and open source contributor. Love containerization, CI/CD pipelines, and cloud infrastructure.",
            "skills_can_teach": [
                {"skill_name": "Docker", "proficiency": "advanced", "years_of_experience": 2.0, "verified": True, "rating": 4.9},
                {"skill_name": "Kubernetes", "proficiency": "intermediate", "years_of_experience": 1.5, "verified": True, "rating": 4.8},
                {"skill_name": "AWS", "proficiency": "intermediate", "years_of_experience": 1.0, "verified": False, "rating": 4.7}
            ],
            "skills_want_to_learn": [
                {"skill_name": "FastAPI", "target_proficiency": "intermediate", "priority": "high"},
                {"skill_name": "System Design", "target_proficiency": "advanced", "priority": "medium"}
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
            }
        },
        {
            "email": "devon.vance@university.edu",
            "password": "Password123!",
            "full_name": "Devon Vance",
            "role": "student",
            "headline": "Full-Stack UI Engineer | React & Modern CSS",
            "college": "Institute of Technology",
            "department": "Computer Science",
            "graduation_year": 2026,
            "bio": "Frontend specialist obsessed with micro-interactions, responsive design, and component architectures.",
            "skills_can_teach": [
                {"skill_name": "React.js", "proficiency": "advanced", "years_of_experience": 2.5, "verified": True, "rating": 4.9},
                {"skill_name": "Tailwind CSS", "proficiency": "advanced", "years_of_experience": 2.0, "verified": True, "rating": 5.0}
            ],
            "skills_want_to_learn": [
                {"skill_name": "Docker", "target_proficiency": "intermediate", "priority": "high"},
                {"skill_name": "Data Structures & Algorithms", "target_proficiency": "intermediate", "priority": "high"}
            ],
            "availability": {
                "days": ["Monday", "Wednesday", "Saturday"],
                "time_slots": ["17:00-19:00"],
                "timezone": "UTC+05:30"
            },
            "placement_readiness": {
                "overall_score": 74,
                "ats_score": 78,
                "technical_skill_score": 72,
                "soft_skill_score": 76,
                "mock_interview_score": 68,
                "verified_skills_count": 2,
                "last_updated": now_iso
            }
        },
        {
            "email": "marcus.chen@university.edu",
            "password": "Password123!",
            "full_name": "Marcus Chen",
            "role": "student",
            "headline": "Algorithms & Distributed Systems Enthusiast",
            "college": "Institute of Technology",
            "department": "Computer Science",
            "graduation_year": 2026,
            "bio": "Competitive programmer (Knight on LeetCode) and systems builder. Ready to guide peers in technical rounds.",
            "skills_can_teach": [
                {"skill_name": "Data Structures & Algorithms", "proficiency": "advanced", "years_of_experience": 3.0, "verified": True, "rating": 5.0},
                {"skill_name": "System Design", "proficiency": "intermediate", "years_of_experience": 1.5, "verified": True, "rating": 4.9}
            ],
            "skills_want_to_learn": [
                {"skill_name": "React.js", "target_proficiency": "intermediate", "priority": "medium"}
            ],
            "availability": {
                "days": ["Thursday", "Friday", "Sunday"],
                "time_slots": ["18:00-20:00"],
                "timezone": "UTC+05:30"
            },
            "placement_readiness": {
                "overall_score": 90,
                "ats_score": 86,
                "technical_skill_score": 92,
                "soft_skill_score": 88,
                "mock_interview_score": 85,
                "verified_skills_count": 5,
                "last_updated": now_iso
            }
        }
    ]

    for u in demo_users:
        existing = await users_col.find_one({"email": u["email"]})
        if existing:
            user_id = str(existing["_id"])
        else:
            user_id = str(uuid.uuid4())
            await users_col.insert_one({
                "_id": user_id,
                "email": u["email"],
                "hashed_password": hash_password(u["password"]),
                "full_name": u["full_name"],
                "role": u["role"],
                "is_active": True,
                "created_at": now_iso,
                "updated_at": now_iso
            })

        # Update profile
        await profiles_col.update_one(
            {"user_id": user_id},
            {"$set": {
                "user_id": user_id,
                "full_name": u["full_name"],
                "email": u["email"],
                "headline": u["headline"],
                "college": u["college"],
                "department": u["department"],
                "graduation_year": u["graduation_year"],
                "bio": u["bio"],
                "skills_can_teach": u["skills_can_teach"],
                "skills_want_to_learn": u["skills_want_to_learn"],
                "availability": u["availability"],
                "placement_readiness": u["placement_readiness"],
                "updated_at": now_iso
            }},
            upsert=True
        )
        print(f"✅ Student Seeded: {u['full_name']} ({u['email']})")

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
        print(f"✅ Admin Account Seeded: {admin_email}")
    else:
        print(f"✅ Admin Account already active: {admin_email}")

    # 4. Verify Database Statistics
    u_count = await users_col.count_documents({})
    p_count = await profiles_col.count_documents({})
    s_count = await skills_col.count_documents({})

    print("\n==================================================")
    print("  DATABASE SEEDING TO MONGODB ATLAS SUCCESSFUL!   ")
    print(f"  • Total Registered Users:    {u_count}")
    print(f"  • Total Student Profiles:    {p_count}")
    print(f"  • Total Skills in Catalog:   {s_count}")
    print("==================================================")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_mongodb_atlas())
