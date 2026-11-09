from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class TeachSkillItem(BaseModel):
    skill_name: str
    proficiency: str = "intermediate"  # beginner, intermediate, advanced
    years_of_experience: float = 1.0
    verified: bool = False
    rating: float = 5.0

class LearnSkillItem(BaseModel):
    skill_name: str
    target_proficiency: str = "intermediate"
    priority: str = "high"  # high, medium, low

class AvailabilitySchema(BaseModel):
    days: List[str] = Field(default_factory=lambda: ["Monday", "Wednesday", "Friday"])
    time_slots: List[str] = Field(default_factory=lambda: ["17:00-19:00", "19:00-21:00"])
    timezone: str = "UTC+05:30"

class PlacementReadinessScores(BaseModel):
    overall_score: int = 70
    ats_score: int = 75
    technical_skill_score: int = 70
    soft_skill_score: int = 75
    mock_interview_score: int = 65
    verified_skills_count: int = 0
    last_updated: Optional[str] = None

class StudentProfileResponse(BaseModel):
    id: Optional[str] = None
    user_id: str
    full_name: str
    email: str
    college: Optional[str] = "Institute of Technology"
    department: Optional[str] = "Computer Science"
    graduation_year: Optional[int] = 2026
    bio: Optional[str] = ""
    headline: Optional[str] = "Aspiring Software Engineer"
    github_url: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    skills_can_teach: List[TeachSkillItem] = Field(default_factory=list)
    skills_want_to_learn: List[LearnSkillItem] = Field(default_factory=list)
    availability: AvailabilitySchema = Field(default_factory=AvailabilitySchema)
    placement_readiness: PlacementReadinessScores = Field(default_factory=PlacementReadinessScores)

class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    graduation_year: Optional[int] = None
    bio: Optional[str] = None
    headline: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    skills_can_teach: Optional[List[TeachSkillItem]] = None
    skills_want_to_learn: Optional[List[LearnSkillItem]] = None
    availability: Optional[AvailabilitySchema] = None

class DashboardStatsResponse(BaseModel):
    placement_readiness_score: int
    ats_score: int
    matched_skills_count: int
    missing_skills_count: int
    active_exchanges_count: int
    upcoming_sessions_count: int
    recent_activities: List[dict] = Field(default_factory=list)

