import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import db_manager

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.mark.asyncio
async def test_health_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test Root
        resp = await client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["project"] == "SkillBridge AI"
        assert data["status"] == "operational"
        
        # Test Health
        resp_health = await client.get("/health")
        assert resp_health.status_code == 200
        assert resp_health.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_auth_and_profile_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register a student user
        reg_payload = {
            "email": "test_student@skillbridge.edu",
            "password": "Password123!",
            "full_name": "Sarah Connor",
            "role": "student"
        }
        reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
        assert reg_resp.status_code == 201, f"Register failed: {reg_resp.text}"
        reg_data = reg_resp.json()
        assert "access_token" in reg_data
        assert reg_data["user"]["email"] == "test_student@skillbridge.edu"
        assert reg_data["user"]["role"] == "student"
        
        token = reg_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Duplicate registration should fail
        dup_resp = await client.post("/api/v1/auth/register", json=reg_payload)
        assert dup_resp.status_code == 400
        
        # 3. Login with credentials
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": "test_student@skillbridge.edu",
            "password": "Password123!"
        })
        assert login_resp.status_code == 200
        assert "access_token" in login_resp.json()
        
        # 4. Login with incorrect password
        bad_login = await client.post("/api/v1/auth/login", json={
            "email": "test_student@skillbridge.edu",
            "password": "WrongPassword!"
        })
        assert bad_login.status_code == 401
        
        # 5. Access protected /me endpoint
        me_resp = await client.get("/api/v1/auth/me", headers=headers)
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == "test_student@skillbridge.edu"
        
        # 6. Access /me without auth should fail
        unauth_resp = await client.get("/api/v1/auth/me")
        assert unauth_resp.status_code == 403 or unauth_resp.status_code == 401
        
        # 7. Get Student Profile
        prof_resp = await client.get("/api/v1/students/profile", headers=headers)
        assert prof_resp.status_code == 200
        prof_data = prof_resp.json()
        assert prof_data["email"] == "test_student@skillbridge.edu"
        assert "placement_readiness" in prof_data
        
        # 8. Update Student Profile
        update_payload = {
            "headline": "Lead AI Architect in Training",
            "bio": "Building scalable platforms with FastAPI and React.",
            "skills_can_teach": [
                {
                    "skill_name": "Python & FastAPI",
                    "proficiency": "advanced",
                    "years_of_experience": 2.5,
                    "verified": True,
                    "rating": 5.0
                }
            ],
            "skills_want_to_learn": [
                {
                    "skill_name": "Kubernetes",
                    "target_proficiency": "intermediate",
                    "priority": "high"
                }
            ]
        }
        update_resp = await client.put("/api/v1/students/profile", json=update_payload, headers=headers)
        assert update_resp.status_code == 200
        updated = update_resp.json()
        assert updated["headline"] == "Lead AI Architect in Training"
        assert len(updated["skills_can_teach"]) == 1
        assert updated["skills_can_teach"][0]["skill_name"] == "Python & FastAPI"
        
        # 9. Get Dashboard Stats
        stats_resp = await client.get("/api/v1/students/dashboard-stats", headers=headers)
        assert stats_resp.status_code == 200
        stats = stats_resp.json()
        assert "placement_readiness_score" in stats
        assert "ats_score" in stats

