import io
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from PyPDF2 import PdfReader
from app.database import get_resumes_collection, get_student_profiles_collection
from app.dependencies import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/resumes", tags=["Resumes"])

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract text from PDF file bytes using PyPDF2."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_pages = []
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                extracted_pages.append(page_text)
        return "\n\n".join(extracted_pages)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse PDF document: {str(e)}"
        )

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents (.pdf) are supported for resume extraction."
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    # 1. Extract text
    raw_text = extract_text_from_pdf_bytes(file_bytes)
    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from PDF. Ensure the PDF is not an image-only scan."
        )

    # 2. Run ATS Analysis & skill extraction
    analysis = ai_service.analyze_resume_text(raw_text)

    user_id = str(current_user["_id"])
    now_iso = datetime.now(timezone.utc).isoformat()
    resume_id = str(uuid.uuid4())

    resume_doc = {
        "_id": resume_id,
        "user_id": user_id,
        "filename": file.filename,
        "file_size": len(file_bytes),
        "raw_text": raw_text[:4000],  # store text sample
        "extracted_skills": analysis["skills"],
        "ats_score": analysis["ats_score"],
        "word_count": analysis["word_count"],
        "strengths": analysis["strengths"],
        "improvements": analysis["improvements"],
        "created_at": now_iso
    }

    # Save to MongoDB
    resumes_col = get_resumes_collection()
    await resumes_col.insert_one(resume_doc)

    # 3. Update student profile with new ATS score & extracted skills
    profiles_col = get_student_profiles_collection()
    profile = await profiles_col.find_one({"user_id": user_id})
    if profile:
        existing_teach = profile.get("skills_can_teach", [])
        existing_skill_names = {s["skill_name"].lower() for s in existing_teach}

        for new_skill in analysis["skills"][:4]:
            if new_skill.lower() not in existing_skill_names:
                existing_teach.append({
                    "skill_name": new_skill,
                    "proficiency": "intermediate",
                    "years_of_experience": 1.0,
                    "verified": False,
                    "rating": 5.0
                })

        readiness = profile.get("placement_readiness", {})
        readiness["ats_score"] = analysis["ats_score"]
        # Update overall placement score
        readiness["overall_score"] = int(
            (readiness["ats_score"] * 0.4) +
            (readiness.get("technical_skill_score", 70) * 0.3) +
            (readiness.get("mock_interview_score", 65) * 0.3)
        )
        readiness["last_updated"] = now_iso

        await profiles_col.update_one(
            {"user_id": user_id},
            {"$set": {
                "skills_can_teach": existing_teach,
                "placement_readiness": readiness,
                "updated_at": now_iso
            }}
        )

    return {
        "status": "success",
        "resume_id": resume_id,
        "filename": file.filename,
        "ats_score": analysis["ats_score"],
        "extracted_skills": analysis["skills"],
        "word_count": analysis["word_count"],
        "strengths": analysis["strengths"],
        "improvements": analysis["improvements"]
    }

@router.get("/latest")
async def get_latest_resume(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    resumes_col = get_resumes_collection()
    
    # Get the most recent resume
    cursor = resumes_col.find({"user_id": user_id}).sort("created_at", -1).limit(1)
    resumes = await cursor.to_list(length=1)
    
    if not resumes:
        return {
            "has_resume": False,
            "message": "No resume uploaded yet"
        }

    latest = resumes[0]
    return {
        "has_resume": True,
        "id": str(latest["_id"]),
        "filename": latest["filename"],
        "ats_score": latest["ats_score"],
        "extracted_skills": latest["extracted_skills"],
        "word_count": latest.get("word_count", 320),
        "strengths": latest.get("strengths", []),
        "improvements": latest.get("improvements", []),
        "created_at": latest["created_at"]
    }
