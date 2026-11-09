import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.database import (
    get_users_collection,
    get_student_profiles_collection,
    get_skills_collection,
    get_exchanges_collection
)
from app.dependencies import get_current_admin
from app.routers.assessments import QUESTION_BANKS

router = APIRouter(prefix="/admin", tags=["Admin Management"])

class SkillCreateRequest(BaseModel):
    name: str
    category: str = "Web Frameworks"
    description: Optional[str] = ""

class UserStatusUpdateRequest(BaseModel):
    is_active: bool

@router.get("/overview")
async def get_admin_overview(admin: dict = Depends(get_current_admin)):
    users_col = get_users_collection()
    profiles_col = get_student_profiles_collection()
    skills_col = get_skills_collection()
    exchanges_col = get_exchanges_collection()

    total_users = await users_col.count_documents({})
    total_students = await users_col.count_documents({"role": "student"})
    total_skills = await skills_col.count_documents({})
    total_exchanges = await exchanges_col.count_documents({})
    completed_exchanges = await exchanges_col.count_documents({"status": "completed"})

    # Compute average readiness across student profiles
    cursor = profiles_col.find({})
    profiles = await cursor.to_list(100)
    scores = [p.get("placement_readiness", {}).get("overall_score", 70) for p in profiles if p.get("placement_readiness")]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 75.0

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_skills": total_skills,
        "total_exchanges": total_exchanges,
        "completed_exchanges": completed_exchanges,
        "average_readiness_score": avg_score
    }

@router.get("/users")
async def get_all_users(admin: dict = Depends(get_current_admin)):
    users_col = get_users_collection()
    profiles_col = get_student_profiles_collection()

    user_cursor = users_col.find({}).sort("created_at", -1)
    users = await user_cursor.to_list(100)

    results = []
    for u in users:
        u_id = str(u["_id"])
        profile = await profiles_col.find_one({"user_id": u_id})
        readiness = profile.get("placement_readiness", {}) if profile else {}
        teach = [t.get("skill_name") for t in profile.get("skills_can_teach", [])] if profile else []

        results.append({
            "id": u_id,
            "full_name": u.get("full_name", "User"),
            "email": u.get("email"),
            "role": u.get("role", "student"),
            "is_active": u.get("is_active", True),
            "created_at": u.get("created_at"),
            "readiness_score": readiness.get("overall_score", 70),
            "ats_score": readiness.get("ats_score", 75),
            "skills_offered": teach,
            "college": profile.get("college", "Institute of Technology") if profile else "N/A"
        })

    return {"users": results}

@router.put("/users/{user_id}/status")
async def toggle_user_status(
    user_id: str,
    payload: UserStatusUpdateRequest,
    admin: dict = Depends(get_current_admin)
):
    users_col = get_users_collection()
    res = await users_col.update_one(
        {"_id": user_id},
        {"$set": {"is_active": payload.is_active, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")

    return {"status": "success", "is_active": payload.is_active}

@router.get("/skills")
async def list_skills(admin: dict = Depends(get_current_admin)):
    skills_col = get_skills_collection()
    cursor = skills_col.find({}).sort("name", 1)
    skills = await cursor.to_list(100)

    return {
        "skills": [
            {
                "id": str(s.get("_id", s.get("name"))),
                "name": s["name"],
                "category": s.get("category", "General"),
                "description": s.get("description", "")
            }
            for s in skills
        ]
    }

@router.post("/skills", status_code=status.HTTP_201_CREATED)
async def create_skill(
    payload: SkillCreateRequest,
    admin: dict = Depends(get_current_admin)
):
    skills_col = get_skills_collection()
    clean_name = payload.name.strip()

    doc = {
        "_id": str(uuid.uuid4()),
        "name": clean_name,
        "category": payload.category,
        "description": payload.description
    }

    await skills_col.update_one({"name": clean_name}, {"$set": doc}, upsert=True)
    return {"status": "success", "skill": doc}

@router.delete("/skills/{skill_name}")
async def delete_skill(
    skill_name: str,
    admin: dict = Depends(get_current_admin)
):
    skills_col = get_skills_collection()
    await skills_col.delete_one({"name": skill_name})
    return {"status": "success", "message": f"Skill '{skill_name}' removed from catalog."}

@router.get("/assessments")
async def get_admin_assessments(admin: dict = Depends(get_current_admin)):
    return {"question_bank": QUESTION_BANKS}
