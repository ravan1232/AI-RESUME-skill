import uuid
from datetime import datetime, timezone
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_assessments_collection, get_student_profiles_collection
from app.dependencies import get_current_user

router = APIRouter(prefix="/assessments", tags=["Skill Assessments"])

# Built-in verified question banks for common platform skills
QUESTION_BANKS = {
    "docker": [
        {
            "id": 1,
            "question": "What is the primary difference between a Docker image and a Docker container?",
            "options": [
                "A container is a read-only template; an image is a running instance.",
                "An image is an immutable template; a container is a running instance of an image.",
                "Images are used for databases; containers are used for frontend apps.",
                "There is no difference; the terms are interchangeable."
            ],
            "correct_answer": 1,
            "explanation": "Docker images are immutable blueprints with code and dependencies, while containers are isolated, executable running instances."
        },
        {
            "id": 2,
            "question": "Which Docker instruction should be preferred to bundle application files into the image?",
            "options": ["ADD", "COPY", "INCLUDE", "INSERT"],
            "correct_answer": 1,
            "explanation": "COPY is preferred over ADD because COPY simply copies local files, whereas ADD has additional behavior like auto-extracting tar archives."
        },
        {
            "id": 3,
            "question": "What happens to data inside a container when the container is removed, if no volume was attached?",
            "options": [
                "It is automatically backed up to host storage.",
                "It persists in the Docker daemon cache forever.",
                "It is permanently lost because the container writable layer is destroyed.",
                "It is pushed to Docker Hub automatically."
            ],
            "correct_answer": 2,
            "explanation": "Containers are ephemeral; without volumes, any data written to the container's writable layer is deleted when the container is removed."
        },
        {
            "id": 4,
            "question": "Which command builds a Docker image from a Dockerfile in the current directory?",
            "options": ["docker create .", "docker build -t myapp .", "docker run -b .", "docker compile ."],
            "correct_answer": 1,
            "explanation": "'docker build -t myapp .' packages the Dockerfile in the current directory into an image tagged 'myapp'."
        },
        {
            "id": 5,
            "question": "In Docker networking, which default network mode allows containers to communicate via IP on the same host?",
            "options": ["none", "host", "bridge", "overlay"],
            "correct_answer": 2,
            "explanation": "The 'bridge' network is the default network driver in Docker for standalone containers on the same host."
        }
    ],
    "python": [
        {
            "id": 1,
            "question": "In Python, which built-in data structure is mutable?",
            "options": ["tuple", "frozenset", "list", "str"],
            "correct_answer": 2,
            "explanation": "Lists in Python are mutable sequences, whereas tuples, strings, and frozensets are immutable."
        },
        {
            "id": 2,
            "question": "What is the time complexity of looking up a key in a standard Python dictionary on average?",
            "options": ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
            "correct_answer": 0,
            "explanation": "Python dictionaries are implemented as hash tables, providing average O(1) time complexity for key lookups."
        },
        {
            "id": 3,
            "question": "What keyword is used to pause a generator function and return an intermediate value in Python?",
            "options": ["return", "yield", "pause", "emit"],
            "correct_answer": 1,
            "explanation": "The 'yield' statement produces a value from a generator and suspends its execution state for the next call."
        },
        {
            "id": 4,
            "question": "Which decorator in Python is used to define a method that operates on the class itself rather than an instance?",
            "options": ["@staticmethod", "@classmethod", "@property", "@abstractmethod"],
            "correct_answer": 1,
            "explanation": "@classmethod receives the class 'cls' as its first parameter rather than instance 'self'."
        },
        {
            "id": 5,
            "question": "In async Python (asyncio), how do you await concurrent execution of multiple coroutines?",
            "options": ["asyncio.gather(*coroutines)", "asyncio.wait_all()", "asyncio.parallel()", "asyncio.join()"],
            "correct_answer": 0,
            "explanation": "asyncio.gather() schedules and runs multiple awaitable objects concurrently."
        }
    ],
    "react": [
        {
            "id": 1,
            "question": "Which React hook is used to manage side effects such as data fetching and DOM subscriptions?",
            "options": ["useState", "useEffect", "useMemo", "useCallback"],
            "correct_answer": 1,
            "explanation": "useEffect lets you perform side effects in functional components."
        },
        {
            "id": 2,
            "question": "Why should keys be provided when rendering a list of elements in React?",
            "options": [
                "Keys are required by CSS for grid layouts.",
                "Keys help React identify which items have changed, been added, or been removed during reconciliation.",
                "Keys encrypt component state for security.",
                "Keys allow items to be shared between different React apps."
            ],
            "correct_answer": 1,
            "explanation": "Keys give elements a stable identity so React's virtual DOM reconciliation algorithm updates only modified nodes."
        },
        {
            "id": 3,
            "question": "What is the purpose of React.useMemo hook?",
            "options": [
                "To memoize expensive computed values across re-renders.",
                "To trigger network requests asynchronously.",
                "To create a persistent global variable.",
                "To prevent child components from rendering permanently."
            ],
            "correct_answer": 0,
            "explanation": "useMemo caches the result of an expensive calculation between re-renders based on dependency changes."
        },
        {
            "id": 4,
            "question": "In React 18, which API is the official entry point for rendering into the DOM?",
            "options": ["ReactDOM.render()", "ReactDOM.createRoot()", "React.mount()", "ReactDOM.init()"],
            "correct_answer": 1,
            "explanation": "ReactDOM.createRoot() is the modern API that enables concurrent features in React 18."
        },
        {
            "id": 5,
            "question": "What happens when you update state in React via the setter function returned by useState?",
            "options": [
                "The browser reloads the entire page.",
                "The component re-renders with the updated state value.",
                "The state is immediately written to localStorage.",
                "All sibling components are forcibly unmounted."
            ],
            "correct_answer": 1,
            "explanation": "Updating state schedules a re-render of the component with the new state."
        }
    ]
}

class AssessmentSubmitRequest(BaseModel):
    skill_name: str
    answers: Dict[str, int]  # map question_id -> chosen option index

@router.get("/skills")
async def get_testable_skills():
    return {
        "skills": [
            {"skill_name": "Docker", "category": "DevOps & Cloud", "question_count": 5},
            {"skill_name": "Python", "category": "Programming Languages", "question_count": 5},
            {"skill_name": "React.js", "category": "Frontend Frameworks", "question_count": 5}
        ]
    }

@router.get("/skill/{skill_name}")
async def get_questions_for_skill(skill_name: str):
    clean = skill_name.lower().replace(".js", "").strip()
    questions = QUESTION_BANKS.get(clean) or QUESTION_BANKS.get("python")
    
    # Return questions without exposing correct_answer
    safe_questions = [
        {
            "id": q["id"],
            "question": q["question"],
            "options": q["options"]
        }
        for q in questions
    ]
    return {
        "skill_name": skill_name,
        "total_questions": len(safe_questions),
        "passing_percentage": 70,
        "questions": safe_questions
    }

@router.post("/submit")
async def submit_assessment(
    payload: AssessmentSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    clean = payload.skill_name.lower().replace(".js", "").strip()
    bank = QUESTION_BANKS.get(clean) or QUESTION_BANKS.get("python")

    correct_count = 0
    feedback = []

    for q in bank:
        q_id = str(q["id"])
        chosen = payload.answers.get(q_id)
        is_correct = chosen == q["correct_answer"]
        if is_correct:
            correct_count += 1

        feedback.append({
            "question_id": q["id"],
            "question": q["question"],
            "chosen_answer": chosen,
            "correct_answer": q["correct_answer"],
            "is_correct": is_correct,
            "explanation": q["explanation"]
        })

    score_pct = int((correct_count / len(bank)) * 100)
    passed = score_pct >= 70

    user_id = str(current_user["_id"])
    now_iso = datetime.now(timezone.utc).isoformat()

    # If passed, verify skill in student's profile & update placement readiness!
    if passed:
        profiles_col = get_student_profiles_collection()
        profile = await profiles_col.find_one({"user_id": user_id})

        if profile:
            skills_teach = profile.get("skills_can_teach", [])
            skill_found = False

            for s in skills_teach:
                if clean in s["skill_name"].lower():
                    s["verified"] = True
                    s["rating"] = min(5.0, s.get("rating", 4.5) + 0.2)
                    skill_found = True

            if not skill_found:
                skills_teach.append({
                    "skill_name": payload.skill_name,
                    "proficiency": "advanced" if score_pct >= 90 else "intermediate",
                    "years_of_experience": 1.0,
                    "verified": True,
                    "rating": 5.0
                })

            readiness = profile.get("placement_readiness", {})
            readiness["verified_skills_count"] = readiness.get("verified_skills_count", 0) + 1
            readiness["technical_skill_score"] = min(98, readiness.get("technical_skill_score", 70) + 6)
            readiness["overall_score"] = min(98, readiness.get("overall_score", 70) + 4)
            readiness["last_updated"] = now_iso

            await profiles_col.update_one(
                {"user_id": user_id},
                {"$set": {
                    "skills_can_teach": skills_teach,
                    "placement_readiness": readiness,
                    "updated_at": now_iso
                }}
            )

    return {
        "status": "success",
        "skill_name": payload.skill_name,
        "score_percentage": score_pct,
        "passed": passed,
        "message": f"Congratulations! You scored {score_pct}% and verified this skill!" if passed else f"You scored {score_pct}%. Passing score is 70%. Try again!",
        "feedback": feedback
    }

