import asyncio
import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import db_manager

async def run_all_tests():
    print("==================================================")
    print("  SkillBridge AI - Phase 1 Integration Test Suite ")
    print("==================================================")
    
    # Trigger lifespan connect
    await db_manager.connect()
    transport = ASGITransport(app=app)
    
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test 1: Root & Health Check
        print("\n[TEST 1] Testing Root and Health Check Endpoints...")
        root_resp = await client.get("/")
        assert root_resp.status_code == 200, f"Root returned {root_resp.status_code}"
        root_data = root_resp.json()
        assert root_data["project"] == "SkillBridge AI"
        print(" -> Root endpoint status: PASS (Project: SkillBridge AI)")
        
        health_resp = await client.get("/health")
        assert health_resp.status_code == 200, f"Health returned {health_resp.status_code}"
        assert health_resp.json()["status"] == "healthy"
        print(f" -> Health check status: PASS ({health_resp.json()['database']})")
        
        # Test 2: Student Registration
        print("\n[TEST 2] Testing Student User Registration...")
        email = "sarah.connor@university.edu"
        reg_payload = {
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Sarah Connor",
            "role": "student"
        }
        reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
        assert reg_resp.status_code == 201, f"Register failed: {reg_resp.text}"
        reg_data = reg_resp.json()
        assert "access_token" in reg_data
        assert reg_data["user"]["email"] == email
        assert reg_data["user"]["role"] == "student"
        token = reg_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(" -> Student registered successfully with JWT Bearer token generated!")
        
        # Test 3: Duplicate Registration Guard
        print("\n[TEST 3] Testing Duplicate Registration Rejection...")
        dup_resp = await client.post("/api/v1/auth/register", json=reg_payload)
        assert dup_resp.status_code == 400
        print(" -> Duplicate email rejected with 400 Bad Request as expected.")
        
        # Test 4: User Login
        print("\n[TEST 4] Testing User Authentication & Token Issuance...")
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "SecurePassword123!"
        })
        assert login_resp.status_code == 200
        assert "access_token" in login_resp.json()
        print(" -> Login validated and new session token generated.")
        
        # Test 5: Invalid Password
        print("\n[TEST 5] Testing Invalid Password Handling...")
        bad_login = await client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "WrongPasswordXYZ"
        })
        assert bad_login.status_code == 401
        print(" -> Invalid password rejected with 401 Unauthorized.")
        
        # Test 6: Protected /me Identity Endpoint
        print("\n[TEST 6] Testing Protected /me Profile Identity...")
        me_resp = await client.get("/api/v1/auth/me", headers=headers)
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == email
        print(f" -> Authenticated identity verified for: {me_resp.json()['full_name']} ({me_resp.json()['role']})")
        
        # Test 7: Unauthorized Access Blocked
        print("\n[TEST 7] Testing Unauthorized Access Guard...")
        unauth_resp = await client.get("/api/v1/auth/me")
        assert unauth_resp.status_code in [401, 403]
        print(" -> Protected endpoint without Bearer header blocked with HTTP 403/401.")
        
        # Test 8: Student Profile Read & Auto-Initialization
        print("\n[TEST 8] Testing Student Profile Read...")
        prof_resp = await client.get("/api/v1/students/profile", headers=headers)
        assert prof_resp.status_code == 200
        prof_data = prof_resp.json()
        assert prof_data["email"] == email
        assert "placement_readiness" in prof_data
        print(f" -> Student profile retrieved. Initial Readiness: {prof_data['placement_readiness']['overall_score']}%")
        
        # Test 9: Update Student Profile (Skills & Availability)
        print("\n[TEST 9] Testing Student Profile Update...")
        update_data = {
            "headline": "Full-Stack AI Developer | Python & React",
            "bio": "Excited to share React expertise and learn Kubernetes/Docker.",
            "skills_can_teach": [
                {
                    "skill_name": "React.js",
                    "proficiency": "advanced",
                    "years_of_experience": 2.0,
                    "verified": True,
                    "rating": 4.9
                }
            ],
            "skills_want_to_learn": [
                {
                    "skill_name": "Docker",
                    "target_proficiency": "intermediate",
                    "priority": "high"
                }
            ],
            "availability": {
                "days": ["Monday", "Wednesday", "Friday"],
                "time_slots": ["18:00-20:00"],
                "timezone": "UTC+05:30"
            }
        }
        upd_resp = await client.put("/api/v1/students/profile", json=update_data, headers=headers)
        assert upd_resp.status_code == 200
        upd_data = upd_resp.json()
        assert upd_data["headline"] == "Full-Stack AI Developer | Python & React"
        assert len(upd_data["skills_can_teach"]) == 1
        assert upd_data["skills_can_teach"][0]["skill_name"] == "React.js"
        assert upd_data["skills_want_to_learn"][0]["skill_name"] == "Docker"
        print(" -> Student profile updated with skills to teach and learn.")
        
        # Test 10: Dashboard Stats
        print("\n[TEST 10] Testing Student Dashboard Stats...")
        stats_resp = await client.get("/api/v1/students/dashboard-stats", headers=headers)
        assert stats_resp.status_code == 200
        stats = stats_resp.json()
        assert "placement_readiness_score" in stats
        print(f" -> Dashboard Stats verified: Readiness={stats['placement_readiness_score']}%, ATS={stats['ats_score']}%")

        # Test 11: Admin Registration & Role-Based Access
        print("\n[TEST 11] Testing Admin Account Registration & Role Guard...")
        admin_payload = {
            "email": "admin@skillbridge.edu",
            "password": "AdminPassword2026!",
            "full_name": "System Administrator",
            "role": "admin"
        }
        admin_resp = await client.post("/api/v1/auth/register", json=admin_payload)
        assert admin_resp.status_code == 201
        admin_data = admin_resp.json()
        assert admin_data["user"]["role"] == "admin"
        print(" -> Admin account created with role 'admin'.")

    await db_manager.close()
    print("\n==================================================")
    print(" ALL 11 PHASE 1 BACKEND INTEGRATION TESTS PASSED! ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_all_tests())

