from typing import Optional, List, Dict, Any
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

INTERVIEW_PRESETS: List[Dict[str, Any]] = [
    {
        "id": "q1",
        "domain": "Backend & Systems",
        "role": "Full-Stack Software Engineer",
        "question": "Can you explain how you would design a rate limiter for a high-traffic REST API? What data structures and caching mechanisms (e.g., Redis Token Bucket) would you use?",
        "hints": "Mention the Token Bucket or Sliding Window algorithm and Redis distributed locks."
    },
    {
        "id": "q2",
        "domain": "Backend & Systems",
        "role": "Python / Backend Engineer",
        "question": "In an asynchronous framework like FastAPI, how does the event loop handle concurrent I/O operations without blocking, and how should CPU-bound tasks be offloaded?",
        "hints": "Explain asyncio event loop, thread pool executors (run_in_executor), and avoiding synchronous time.sleep() or requests calls."
    },
    {
        "id": "q3",
        "domain": "Frontend & Architecture",
        "role": "React / Frontend Developer",
        "question": "How does React's Virtual DOM reconciliation work under the hood, and what practical optimizations (e.g., memo, virtualization) prevent unnecessary re-renders in enterprise dashboards?",
        "hints": "Discuss diffing algorithms, key stability, useMemo/useCallback, and windowing techniques."
    },
    {
        "id": "q4",
        "domain": "Frontend & Architecture",
        "role": "Frontend Architect",
        "question": "When designing client-side architecture for a complex SPA, how do you decide between React Context, Zustand, and Redux Toolkit? What are the trade-offs regarding re-render cascade and boilerplate?",
        "hints": "Mention selector-based subscriptions, Context consumer tree re-rendering, and middleware support."
    },
    {
        "id": "q5",
        "domain": "DevOps & Cloud",
        "role": "Cloud / DevOps Engineer",
        "question": "Describe the lifecycle of a request in a Kubernetes cluster from Ingress to Pod. How do Services, Endpoints, and kube-proxy collaborate to balance traffic?",
        "hints": "Explain ingress controllers, iptables/IPVS rules, and pod health checks."
    },
    {
        "id": "q6",
        "domain": "DevOps & Cloud",
        "role": "SRE / Infrastructure Specialist",
        "question": "How do you design a zero-downtime deployment strategy for microservices? Compare Blue-Green deployments with Canary releases and explain how database schema migrations fit in.",
        "hints": "Mention traffic splitting, expand/contract database migration pattern, and automated health metric rollbacks."
    },
    {
        "id": "q7",
        "domain": "Data Structures & Algorithms",
        "role": "Software Development Engineer (SDE)",
        "question": "How would you implement an LRU (Least Recently Used) Cache supporting O(1) get and O(1) put operations? What combined data structures are required?",
        "hints": "Explain Hash Map paired with a Doubly Linked List, updating node position on access."
    },
    {
        "id": "q8",
        "domain": "System Design & Scalability",
        "role": "Distributed Systems Engineer",
        "question": "Walk through the architectural design of a distributed URL shortening service (like Bitly) handling 100 Million daily writes. How do you generate unique short keys and ensure low-latency reads?",
        "hints": "Discuss Base62 encoding, pre-generated ID ranges (ZooKeeper/Snowflake), Redis read-through cache, and database sharding."
    },
    {
        "id": "q9",
        "domain": "Behavioral & HR Round",
        "role": "Campus Placement Candidate",
        "question": "Tell me about a time when you encountered a critical production bug or tight project deadline in your engineering coursework or internships. How did you prioritize and what was the outcome?",
        "hints": "Use the STAR method: Situation, Task, Action, and quantifiable Result."
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
    # Match domain, or role, or rotate questions dynamically
    domain_lower = payload.domain.lower()
    matches = [q for q in INTERVIEW_PRESETS if domain_lower in q["domain"].lower() or payload.role.lower() in q["role"].lower()]
    match = matches[0] if matches else INTERVIEW_PRESETS[0]

    return {
        "status": "active",
        "role": payload.role,
        "domain": match["domain"],
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
