import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.database import (
    get_job_analyses_collection,
    get_student_profiles_collection,
    get_resumes_collection
)
from app.dependencies import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/jobs", tags=["Jobs & Gap Analysis"])

class JobAnalyzeRequest(BaseModel):
    job_title: str = Field(..., min_length=2)
    company_name: Optional[str] = "Tech Partner"
    job_description: str = Field(..., min_length=20)

@router.post("/analyze")
async def analyze_job(
    payload: JobAnalyzeRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    profiles_col = get_student_profiles_collection()
    resumes_col = get_resumes_collection()
    jobs_col = get_job_analyses_collection()

    # 1. Fetch student's current skills from profile and latest resume
    profile = await profiles_col.find_one({"user_id": user_id})
    profile_skills = [s["skill_name"] for s in profile.get("skills_can_teach", [])] if profile else []
    
    # Latest resume skills
    res_cursor = resumes_col.find({"user_id": user_id}).sort("created_at", -1).limit(1)
    resumes = await res_cursor.to_list(1)
    resume_skills = resumes[0].get("extracted_skills", []) if resumes else []

    all_student_skills = list(set(profile_skills + resume_skills))

    # 2. Extract skills from JD, compare, compute missing skills & build roadmap
    gap_result = ai_service.analyze_job_description(
        job_title=payload.job_title,
        jd_text=payload.job_description,
        student_skills=all_student_skills
    )

    missing_skills = gap_result["missing_skills"]
    missing_skills_lower = [m.lower() for m in missing_skills]

    # 3. CRITICAL INTEGRATION: Find other students who teach those missing skills
    recommended_partners = []
    if missing_skills_lower:
        # Query MongoDB student_profiles for other students
        other_profiles_cursor = profiles_col.find({"user_id": {"$ne": user_id}})
        other_students = await other_profiles_cursor.to_list(length=50)

        for other in other_students:
            other_teach = other.get("skills_can_teach", [])
            matched_teach_skills = []
            
            for item in other_teach:
                s_name = item.get("skill_name", "")
                if any(m in s_name.lower() or s_name.lower() in m for m in missing_skills_lower):
                    matched_teach_skills.append({
                        "skill_name": s_name,
                        "proficiency": item.get("proficiency", "intermediate"),
                        "rating": item.get("rating", 4.9),
                        "verified": item.get("verified", False)
                    })

            if matched_teach_skills:
                # Calculate match percentage
                compatibility = min(98, 70 + (len(matched_teach_skills) * 10))
                recommended_partners.append({
                    "peer_id": other["user_id"],
                    "peer_name": other.get("full_name", "Student Mentor"),
                    "headline": other.get("headline", "Peer Mentor"),
                    "college": other.get("college", "Institute of Technology"),
                    "department": other.get("department", "Computer Science"),
                    "skills_they_can_teach": matched_teach_skills,
                    "availability": other.get("availability", {}),
                    "compatibility_score": compatibility
                })

        # Sort partners by compatibility score descending
        recommended_partners.sort(key=lambda p: p["compatibility_score"], reverse=True)

    # 4. Save analysis record in MongoDB Atlas
    analysis_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    analysis_doc = {
        "_id": analysis_id,
        "user_id": user_id,
        "job_title": payload.job_title,
        "company_name": payload.company_name,
        "job_description_snippet": payload.job_description[:500],
        "required_skills": gap_result["required_skills"],
        "matched_skills": gap_result["matched_skills"],
        "missing_skills": missing_skills,
        "match_percentage": gap_result["match_percentage"],
        "learning_roadmap": gap_result["learning_roadmap"],
        "recommended_partners": recommended_partners,
        "created_at": now_iso
    }

    await jobs_col.insert_one(analysis_doc)

    # Also automatically sync missing skills to student's "skills_want_to_learn" if not already there
    if profile and missing_skills:
        current_learn = profile.get("skills_want_to_learn", [])
        current_learn_names = {l["skill_name"].lower() for l in current_learn}
        for m in missing_skills[:3]:
            if m.lower() not in current_learn_names:
                current_learn.append({
                    "skill_name": m,
                    "target_proficiency": "intermediate",
                    "priority": "high"
                })
        await profiles_col.update_one(
            {"user_id": user_id},
            {"$set": {"skills_want_to_learn": current_learn, "updated_at": now_iso}}
        )

    return {
        "status": "success",
        "analysis_id": analysis_id,
        "job_title": payload.job_title,
        "company_name": payload.company_name,
        "required_skills": gap_result["required_skills"],
        "matched_skills": gap_result["matched_skills"],
        "missing_skills": missing_skills,
        "match_percentage": gap_result["match_percentage"],
        "learning_roadmap": gap_result["learning_roadmap"],
        "recommended_partners": recommended_partners
    }

@router.get("/latest")
async def get_latest_job_analysis(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    jobs_col = get_job_analyses_collection()

    cursor = jobs_col.find({"user_id": user_id}).sort("created_at", -1).limit(1)
    analyses = await cursor.to_list(1)

    if not analyses:
        return {"has_analysis": False}

    latest = analyses[0]
    return {
        "has_analysis": True,
        "id": str(latest["_id"]),
        "job_title": latest["job_title"],
        "company_name": latest.get("company_name", "Tech Company"),
        "required_skills": latest["required_skills"],
        "matched_skills": latest["matched_skills"],
        "missing_skills": latest["missing_skills"],
        "match_percentage": latest["match_percentage"],
        "learning_roadmap": latest.get("learning_roadmap", []),
        "recommended_partners": latest.get("recommended_partners", []),
        "created_at": latest["created_at"]
    }
