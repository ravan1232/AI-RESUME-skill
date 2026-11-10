import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.database import (
    get_users_collection,
    get_student_profiles_collection,
    get_skills_collection,
    get_exchanges_collection,
    get_resumes_collection,
    get_assessments_collection
)
from app.dependencies import get_current_admin
from app.routers.assessments import QUESTION_BANKS
from app.services.ai_service import ai_service

router = APIRouter(prefix="/admin", tags=["Admin Management"])

class SkillCreateRequest(BaseModel):
    name: str
    category: str = "Web Frameworks"
    description: Optional[str] = ""

class UserStatusUpdateRequest(BaseModel):
    is_active: bool

class GenerateResumeQuestionsRequest(BaseModel):
    user_id: Optional[str] = None
    resume_text: Optional[str] = None
    candidate_name: Optional[str] = None
    difficulty: str = "mid"
    count: int = 5

class AddQuestionToBankRequest(BaseModel):
    skill_name: str
    question: str
    options: Optional[List[str]] = None
    correct_index: Optional[int] = 0
    explanation: Optional[str] = ""
    difficulty: str = "Intermediate"

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

@router.get("/student-resumes")
async def get_student_resumes(admin: dict = Depends(get_current_admin)):
    """Fetch all students with their latest uploaded resumes and extracted skills."""
    users_col = get_users_collection()
    resumes_col = get_resumes_collection()
    profiles_col = get_student_profiles_collection()

    users_cursor = users_col.find({"role": "student"}).sort("created_at", -1)
    students = await users_cursor.to_list(100)

    results = []
    for s in students:
        s_id = str(s["_id"])
        profile = await profiles_col.find_one({"user_id": s_id})
        # Find latest resume
        resume_cursor = resumes_col.find({"user_id": s_id}).sort("created_at", -1).limit(1)
        resumes = await resume_cursor.to_list(1)
        resume = resumes[0] if resumes else None

        teach_skills = [t.get("skill_name") for t in profile.get("skills_can_teach", [])] if profile else []
        extracted_skills = resume.get("extracted_skills", []) if resume else []
        all_skills = list(dict.fromkeys(extracted_skills + teach_skills))

        results.append({
            "user_id": s_id,
            "full_name": s.get("full_name", "Student"),
            "email": s.get("email"),
            "has_resume": resume is not None,
            "filename": resume.get("filename") if resume else None,
            "ats_score": resume.get("ats_score", 75) if resume else (profile.get("placement_readiness", {}).get("ats_score", 75) if profile else 75),
            "skills": all_skills if all_skills else ["Python", "FastAPI"],
            "raw_text_preview": (resume.get("raw_text")[:300] + "...") if resume and resume.get("raw_text") else "",
            "raw_text": resume.get("raw_text", "") if resume else "",
            "created_at": resume.get("created_at") if resume else s.get("created_at")
        })

    return {"candidates": results}

@router.post("/generate-resume-questions")
async def generate_resume_questions(
    payload: GenerateResumeQuestionsRequest,
    admin: dict = Depends(get_current_admin)
):
    """Automatically formulate tailored interview and assessment questions from user resume."""
    resume_text = payload.resume_text or ""
    candidate_name = payload.candidate_name or "Candidate"
    skills = []

    if payload.user_id:
        users_col = get_users_collection()
        user = await users_col.find_one({"_id": payload.user_id})
        if user:
            candidate_name = user.get("full_name", candidate_name)

        # Look up resume
        resumes_col = get_resumes_collection()
        resume_cursor = resumes_col.find({"user_id": payload.user_id}).sort("created_at", -1).limit(1)
        resumes = await resume_cursor.to_list(1)
        if resumes:
            resume_text = resumes[0].get("raw_text", "")
            skills = resumes[0].get("extracted_skills", [])

        # Also grab skills from student profile
        profiles_col = get_student_profiles_collection()
        profile = await profiles_col.find_one({"user_id": payload.user_id})
        if profile:
            teach_skills = [t.get("skill_name") for t in profile.get("skills_can_teach", [])]
            skills = list(dict.fromkeys(skills + teach_skills))

    if not resume_text and not skills:
        # If no resume uploaded, construct contextual text from candidate skills or default
        resume_text = f"Candidate Profile for {candidate_name}. Skills: Python, FastAPI, React, REST APIs, Database Design, System Architecture."

    # Call AI generation service
    questions = ai_service.generate_questions_from_resume(
        resume_text=resume_text,
        skills=skills,
        difficulty=payload.difficulty,
        count=payload.count
    )

    return {
        "candidate_name": candidate_name,
        "difficulty": payload.difficulty,
        "skills_detected": skills if skills else ["Python", "FastAPI", "React"],
        "total_questions": len(questions),
        "questions": questions
    }

@router.post("/add-to-question-bank")
async def add_to_question_bank(
    payload: AddQuestionToBankRequest,
    admin: dict = Depends(get_current_admin)
):
    """Save an automated resume-generated question into the platform assessment question bank."""
    skill_key = payload.skill_name.lower().replace(".js", "").replace(" ", "")

    # Default options if not provided (multiple choice format)
    options = payload.options or [
        "Optimal implementation meeting all architectural criteria",
        "Sub-optimal approach with potential resource bottlenecks",
        "Legacy approach ignoring asynchronous I/O standards",
        "Syntactically invalid pattern resulting in runtime exceptions"
    ]

    new_q = {
        "id": f"gen_{uuid.uuid4().hex[:6]}",
        "question": payload.question,
        "options": options,
        "correct_index": payload.correct_index,
        "explanation": payload.explanation or "Verified candidate assessment question generated from industry resume standards.",
        "difficulty": payload.difficulty
    }

    # Add to in-memory question bank
    if skill_key not in QUESTION_BANKS:
        QUESTION_BANKS[skill_key] = []
    QUESTION_BANKS[skill_key].append(new_q)

    # Also persist to database assessments collection
    assessments_col = get_assessments_collection()
    await assessments_col.update_one(
        {"skill_name": payload.skill_name},
        {"$push": {"questions": new_q}},
        upsert=True
    )

    return {
        "status": "success",
        "message": f"Question successfully added to '{payload.skill_name}' Question Bank!",
        "question": new_q
    }

