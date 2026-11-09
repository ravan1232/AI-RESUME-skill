from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["AI Placement Assistant"])

class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None

class MockInterviewStart(BaseModel):
    role: str = "Full-Stack Software Engineer"
    domain: str = "Backend & Systems"
    difficulty: str = "intermediate"

class MockInterviewSubmit(BaseModel):
    question: str
    answer: str

INTERVIEW_PRESETS = [
    {
        "id": "q1",
        "domain": "Backend & Systems",
        "role": "Full-Stack Software Engineer",
        "question": "Can you explain how you would design a rate limiter for a high-traffic REST API? What data structures and caching mechanisms (e.g., Redis Token Bucket) would you use?",
        "hints": "Mention the Token Bucket or Sliding Window algorithm and Redis distributed locks."
    },
    {
        "id": "q2",
        "domain": "Frontend & Architecture",
        "role": "React / Frontend Developer",
        "question": "How does React's Virtual DOM reconciliation work under the hood, and what practical optimizations (e.g., memo, virtualization) prevent unnecessary re-renders in enterprise dashboards?",
        "hints": "Discuss diffing algorithms, key stability, and windowing techniques."
    },
    {
        "id": "q3",
        "domain": "DevOps & Cloud",
        "role": "Cloud / DevOps Engineer",
        "question": "Describe the lifecycle of a request in a Kubernetes cluster from Ingress to Pod. How do Services, Endpoints, and kube-proxy collaborate to balance traffic?",
        "hints": "Explain ingress controllers, iptables/IPVS rules, and pod health checks."
    }
]

@router.post("/chat")
async def chat_with_ai(
    payload: ChatMessage,
    current_user: dict = Depends(get_current_user)
):
    user_name = current_user.get("full_name", "Student")
    context = f"Student name: {user_name}. {payload.context or ''}"
    reply = ai_service.chat_placement_assistant(payload.message, context=context)
    return {"reply": reply}

@router.post("/mock-interview/start")
async def start_mock_interview(
    payload: MockInterviewStart,
    current_user: dict = Depends(get_current_user)
):
    # Select question matching role or fallback to preset
    match = next((q for q in INTERVIEW_PRESETS if payload.domain.lower() in q["domain"].lower()), INTERVIEW_PRESETS[0])
    return {
        "status": "active",
        "role": payload.role,
        "question": match["question"],
        "hints": match["hints"]
    }

@router.post("/mock-interview/submit")
async def evaluate_mock_answer(
    payload: MockInterviewSubmit,
    current_user: dict = Depends(get_current_user)
):
    evaluation = ai_service.evaluate_interview_response(payload.question, payload.answer)
    return {
        "status": "evaluated",
        "score": evaluation.get("score", 8),
        "strengths": evaluation.get("strengths", []),
        "improvements": evaluation.get("improvements", []),
        "feedback": evaluation.get("feedback", "Good effort!")
    }
