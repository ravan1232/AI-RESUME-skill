from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import (
    get_student_profiles_collection,
    get_resumes_collection,
    get_job_analyses_collection,
    get_exchanges_collection,
    get_sessions_collection
)
from app.schemas.student import (
    StudentProfileResponse,
    StudentProfileUpdate,
    DashboardStatsResponse
)
from app.dependencies import get_current_user, require_role

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/profile", response_model=StudentProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    profiles_col = get_student_profiles_collection()
    user_id = str(current_user["_id"])
    
    profile = await profiles_col.find_one({"user_id": user_id})
    if not profile:
        # Create a default profile if not exists
        now_iso = datetime.now(timezone.utc).isoformat()
        profile = {
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "full_name": current_user.get("full_name", "Student"),
            "email": current_user.get("email", ""),
            "college": "Institute of Technology",
            "department": "Computer Science & Engineering",
            "graduation_year": 2026,
            "bio": "Enthusiastic computer science student preparing for placements.",
            "headline": "Student & Aspiring Software Engineer",
            "github_url": "",
            "linkedin_url": "",
            "skills_can_teach": [],
            "skills_want_to_learn": [],
            "availability": {
                "days": ["Monday", "Wednesday", "Friday"],
                "time_slots": ["18:00-20:00"],
                "timezone": "UTC+05:30"
            },
            "placement_readiness": {
                "overall_score": 65,
                "ats_score": 70,
                "technical_skill_score": 65,
                "soft_skill_score": 70,
                "mock_interview_score": 60,
                "verified_skills_count": 0,
                "last_updated": now_iso
            },
            "created_at": now_iso,
            "updated_at": now_iso
        }
        await profiles_col.insert_one(profile)

    return StudentProfileResponse(
        id=str(profile.get("_id", "")),
        user_id=profile["user_id"],
        full_name=profile.get("full_name", current_user.get("full_name", "")),
        email=profile.get("email", current_user.get("email", "")),
        college=profile.get("college"),
        department=profile.get("department"),
        graduation_year=profile.get("graduation_year"),
        bio=profile.get("bio", ""),
        headline=profile.get("headline", ""),
        github_url=profile.get("github_url", ""),
        linkedin_url=profile.get("linkedin_url", ""),
        skills_can_teach=profile.get("skills_can_teach", []),
        skills_want_to_learn=profile.get("skills_want_to_learn", []),
        availability=profile.get("availability", {}),
        placement_readiness=profile.get("placement_readiness", {})
    )

@router.put("/profile", response_model=StudentProfileResponse)
async def update_profile(
    payload: StudentProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    profiles_col = get_student_profiles_collection()
    user_id = str(current_user["_id"])
    
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await profiles_col.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True
    )
    
    # Return refreshed profile
    return await get_profile(current_user=current_user)

@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    profiles_col = get_student_profiles_collection()
    resumes_col = get_resumes_collection()
    jobs_col = get_job_analyses_collection()
    exchanges_col = get_exchanges_collection()
    sessions_col = get_sessions_collection()
    
    profile = await profiles_col.find_one({"user_id": user_id})
    readiness = profile.get("placement_readiness", {}) if profile else {}
    overall_score = readiness.get("overall_score", 72)
    ats_score = readiness.get("ats_score", 75)
    
    # Count latest resume & job analysis stats
    latest_job = await jobs_col.find_one({"user_id": user_id})
    matched_skills = len(latest_job.get("matched_skills", [])) if latest_job else 4
    missing_skills = len(latest_job.get("missing_skills", [])) if latest_job else 3
    
    # Active exchanges count
    active_exchanges = await exchanges_col.count_documents({
        "$or": [{"requester_id": user_id}, {"provider_id": user_id}],
        "status": {"$in": ["pending", "accepted"]}
    })
    
    # Upcoming sessions count
    upcoming_sessions = await sessions_col.count_documents({
        "$or": [{"mentor_id": user_id}, {"learner_id": user_id}],
        "status": "scheduled"
    })
    
    recent_activities = [
        {"id": "act-1", "title": "Platform Profile Initialized", "timestamp": "Just now", "type": "profile"},
        {"id": "act-2", "title": "ATS Readiness Baseline Set", "timestamp": "Today", "type": "readiness"},
    ]
    
    return DashboardStatsResponse(
        placement_readiness_score=overall_score,
        ats_score=ats_score,
        matched_skills_count=matched_skills,
        missing_skills_count=missing_skills,
        active_exchanges_count=active_exchanges,
        upcoming_sessions_count=upcoming_sessions,
        recent_activities=recent_activities
    )

