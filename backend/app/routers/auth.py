from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, HTTPException, status, Depends
from app.database import get_users_collection, get_student_profiles_collection
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from app.utils.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    users_col = get_users_collection()
    profiles_col = get_student_profiles_collection()
    
    email_clean = payload.email.lower().strip()
    
    # Check if user already exists
    existing = await users_col.find_one({"email": email_clean})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )
        
    role = payload.role.lower().strip()
    if role not in ["student", "admin"]:
        role = "student"
        
    user_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "_id": user_id,
        "email": email_clean,
        "hashed_password": hash_password(payload.password),
        "full_name": payload.full_name.strip(),
        "role": role,
        "is_active": True,
        "created_at": now_iso,
        "updated_at": now_iso
    }
    
    await users_col.insert_one(user_doc)
    
    # If student, initialize default profile
    if role == "student":
        profile_doc = {
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "full_name": payload.full_name.strip(),
            "email": email_clean,
            "college": "Institute of Technology",
            "department": "Computer Science & Engineering",
            "graduation_year": 2026,
            "bio": "Enthusiastic computer science student preparing for placements and eager to collaborate.",
            "headline": "Student & Aspiring Software Engineer",
            "github_url": "",
            "linkedin_url": "",
            "skills_can_teach": [
                {
                    "skill_name": "Python",
                    "proficiency": "intermediate",
                    "years_of_experience": 1.5,
                    "verified": False,
                    "rating": 5.0
                }
            ],
            "skills_want_to_learn": [
                {
                    "skill_name": "System Design",
                    "target_proficiency": "intermediate",
                    "priority": "high"
                }
            ],
            "availability": {
                "days": ["Monday", "Wednesday", "Friday"],
                "time_slots": ["18:00-20:00"],
                "timezone": "UTC+05:30"
            },
            "placement_readiness": {
                "overall_score": 68,
                "ats_score": 72,
                "technical_skill_score": 70,
                "soft_skill_score": 75,
                "mock_interview_score": 60,
                "verified_skills_count": 0,
                "last_updated": now_iso
            },
            "created_at": now_iso,
            "updated_at": now_iso
        }
        await profiles_col.insert_one(profile_doc)
        
    # Generate token
    token = create_access_token({"sub": user_id, "email": email_clean, "role": role})
    
    user_resp = UserResponse(
        id=user_id,
        email=email_clean,
        full_name=payload.full_name.strip(),
        role=role,
        is_active=True,
        created_at=now_iso
    )
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_resp
    )

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    users_col = get_users_collection()
    email_clean = payload.email.lower().strip()
    
    user = await users_col.find_one({"email": email_clean})
    if not user or not verify_password(payload.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended or deactivated. Contact support.",
        )
        
    user_id = str(user["_id"])
    role = user.get("role", "student")
    token = create_access_token({"sub": user_id, "email": email_clean, "role": role})
    
    user_resp = UserResponse(
        id=user_id,
        email=email_clean,
        full_name=user.get("full_name", ""),
        role=role,
        is_active=user.get("is_active", True),
        created_at=user.get("created_at")
    )
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_resp
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user.get("email"),
        full_name=current_user.get("full_name"),
        role=current_user.get("role", "student"),
        is_active=current_user.get("is_active", True),
        created_at=current_user.get("created_at")
    )

