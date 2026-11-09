import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.database import (
    get_exchanges_collection,
    get_sessions_collection,
    get_student_profiles_collection,
    get_users_collection
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/exchange", tags=["Skill Exchange"])

class ExchangeRequestCreate(BaseModel):
    provider_id: str
    skill_offered: str
    skill_requested: str
    notes: Optional[str] = "Hi! I would love to exchange skills with you."

class ExchangeStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(accepted|rejected|completed|cancelled)$")

class SessionScheduleCreate(BaseModel):
    exchange_id: str
    peer_id: str
    skill_topic: str
    scheduled_at: str
    duration_minutes: int = 60
    meeting_link: Optional[str] = "https://meet.skillbridge.ai/room"

class SessionFeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = ""

@router.post("/request", status_code=status.HTTP_201_CREATED)
async def create_exchange_request(
    payload: ExchangeRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    requester_id = str(current_user["_id"])
    if requester_id == payload.provider_id:
        raise HTTPException(status_code=400, detail="Cannot send exchange request to yourself.")

    users_col = get_users_collection()
    exchanges_col = get_exchanges_collection()

    provider = await users_col.find_one({"_id": payload.provider_id})
    if not provider:
        raise HTTPException(status_code=404, detail="Target student peer not found.")

    req_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = {
        "_id": req_id,
        "requester_id": requester_id,
        "requester_name": current_user.get("full_name", "Student"),
        "requester_email": current_user.get("email", ""),
        "provider_id": payload.provider_id,
        "provider_name": provider.get("full_name", "Student Peer"),
        "provider_email": provider.get("email", ""),
        "skill_offered": payload.skill_offered,
        "skill_requested": payload.skill_requested,
        "notes": payload.notes,
        "status": "pending",
        "created_at": now_iso,
        "updated_at": now_iso
    }

    await exchanges_col.insert_one(doc)
    return {"status": "success", "exchange_id": req_id, "message": "Exchange request sent successfully!"}

@router.get("/requests")
async def get_exchange_requests(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    exchanges_col = get_exchanges_collection()

    # Outgoing (where I am requester)
    out_cursor = exchanges_col.find({"requester_id": user_id}).sort("created_at", -1)
    outgoing = await out_cursor.to_list(50)

    # Incoming (where I am provider)
    in_cursor = exchanges_col.find({"provider_id": user_id}).sort("created_at", -1)
    incoming = await in_cursor.to_list(50)

    return {
        "outgoing": [
            {
                "id": str(r["_id"]),
                "peer_name": r.get("provider_name"),
                "peer_id": r.get("provider_id"),
                "skill_offered": r.get("skill_offered"),
                "skill_requested": r.get("skill_requested"),
                "notes": r.get("notes"),
                "status": r.get("status"),
                "created_at": r.get("created_at")
            }
            for r in outgoing
        ],
        "incoming": [
            {
                "id": str(r["_id"]),
                "peer_name": r.get("requester_name"),
                "peer_id": r.get("requester_id"),
                "skill_offered": r.get("skill_offered"),
                "skill_requested": r.get("skill_requested"),
                "notes": r.get("notes"),
                "status": r.get("status"),
                "created_at": r.get("created_at")
            }
            for r in incoming
        ]
    }

@router.put("/requests/{exchange_id}/status")
async def update_request_status(
    exchange_id: str,
    payload: ExchangeStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    exchanges_col = get_exchanges_collection()

    req = await exchanges_col.find_one({"_id": exchange_id})
    if not req:
        raise HTTPException(status_code=404, detail="Exchange request not found.")

    # Only provider or requester can change status
    if req["provider_id"] != user_id and req["requester_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this request.")

    now_iso = datetime.now(timezone.utc).isoformat()
    await exchanges_col.update_one(
        {"_id": exchange_id},
        {"$set": {"status": payload.status, "updated_at": now_iso}}
    )

    return {"status": "success", "new_status": payload.status}

@router.get("/matches")
async def get_peer_matches(current_user: dict = Depends(get_current_user)):
    """Autonomous peer matchmaker: connects student's learning goals to campus mentors."""
    user_id = str(current_user["_id"])
    profiles_col = get_student_profiles_collection()

    my_profile = await profiles_col.find_one({"user_id": user_id})
    want_skills = [w["skill_name"].lower() for w in my_profile.get("skills_want_to_learn", [])] if my_profile else []

    other_cursor = profiles_col.find({"user_id": {"$ne": user_id}})
    others = await other_cursor.to_list(50)

    matches = []
    for other in others:
        teach_list = other.get("skills_can_teach", [])
        matched = []
        for t in teach_list:
            t_name = t.get("skill_name", "")
            if not want_skills or any(w in t_name.lower() or t_name.lower() in w for w in want_skills):
                matched.append({
                    "skill_name": t_name,
                    "proficiency": t.get("proficiency", "intermediate"),
                    "rating": t.get("rating", 4.9),
                    "verified": t.get("verified", True)
                })

        if matched:
            matches.append({
                "peer_id": other["user_id"],
                "peer_name": other.get("full_name", "Student Peer"),
                "headline": other.get("headline", "Peer Tutor"),
                "college": other.get("college", "Institute of Technology"),
                "department": other.get("department", "Computer Science"),
                "skills_they_teach": matched,
                "availability": other.get("availability", {}),
                "rating": 4.9
            })

    return {"matches": matches}

@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def schedule_session(
    payload: SessionScheduleCreate,
    current_user: dict = Depends(get_current_user)
):
    sessions_col = get_sessions_collection()
    session_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = {
        "_id": session_id,
        "exchange_id": payload.exchange_id,
        "mentor_id": payload.peer_id,
        "learner_id": str(current_user["_id"]),
        "skill_topic": payload.skill_topic,
        "scheduled_at": payload.scheduled_at,
        "duration_minutes": payload.duration_minutes,
        "status": "scheduled",
        "meeting_link": f"https://meet.skillbridge.ai/room-{session_id[:8]}",
        "created_at": now_iso
    }

    await sessions_col.insert_one(doc)
    return {"status": "success", "session": doc}

@router.get("/sessions")
async def list_sessions(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    sessions_col = get_sessions_collection()

    cursor = sessions_col.find({
        "$or": [{"mentor_id": user_id}, {"learner_id": user_id}]
    }).sort("scheduled_at", 1)

    sessions = await cursor.to_list(50)
    return {
        "sessions": [
            {
                "id": str(s["_id"]),
                "exchange_id": s.get("exchange_id"),
                "skill_topic": s.get("skill_topic"),
                "scheduled_at": s.get("scheduled_at"),
                "duration_minutes": s.get("duration_minutes", 60),
                "status": s.get("status", "scheduled"),
                "meeting_link": s.get("meeting_link"),
                "feedback": s.get("feedback")
            }
            for s in sessions
        ]
    }

@router.post("/sessions/{session_id}/feedback")
async def submit_session_feedback(
    session_id: str,
    payload: SessionFeedbackCreate,
    current_user: dict = Depends(get_current_user)
):
    sessions_col = get_sessions_collection()
    now_iso = datetime.now(timezone.utc).isoformat()

    await sessions_col.update_one(
        {"_id": session_id},
        {"$set": {
            "status": "completed",
            "feedback": {
                "rating": payload.rating,
                "review": payload.review,
                "submitted_at": now_iso
            }
        }}
    )

    return {"status": "success", "message": "Feedback submitted successfully!"}

