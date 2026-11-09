import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import db_manager

async def test_google_auth_workflow():
    print("================================================================")
    print("  SkillBridge AI: Google Authentication Verification Tests      ")
    print("================================================================")

    await db_manager.connect()
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # TEST 1: Google Login with existing student (roshanmallick1890@gmail.com)
        print("\n[TEST 1] Logging in with Google as Student (roshanmallick1890@gmail.com)...")
        resp1 = await client.post("/api/v1/auth/google", json={
            "credential": "mock_google_roshanmallick1890@gmail.com",
            "role": "student"
        })
        assert resp1.status_code == 200, f"Google login failed: {resp1.text}"
        data1 = resp1.json()
        assert data1["user"]["email"] == "roshanmallick1890@gmail.com"
        assert data1["user"]["role"] == "student"
        assert data1["access_token"]
        print(f" -> SUCCESS: User authenticated as {data1['user']['full_name']} (Role: {data1['user']['role']})")

        # TEST 2: Google Login with existing admin (keerthi12@gmail.com)
        print("\n[TEST 2] Logging in with Google as Admin (keerthi12@gmail.com)...")
        resp2 = await client.post("/api/v1/auth/google", json={
            "credential": "mock_google_keerthi12@gmail.com",
            "role": "admin"
        })
        assert resp2.status_code == 200, f"Google login failed: {resp2.text}"
        data2 = resp2.json()
        assert data2["user"]["email"] == "keerthi12@gmail.com"
        assert data2["user"]["role"] == "admin"
        assert data2["access_token"]
        print(f" -> SUCCESS: User authenticated as {data2['user']['full_name']} (Role: {data2['user']['role']})")

        # TEST 3: Access protected endpoint /api/v1/students/dashboard-stats with Google token
        print("\n[TEST 3] Testing protected student endpoint using Google JWT token...")
        headers = {"Authorization": f"Bearer {data1['access_token']}"}
        stats_resp = await client.get("/api/v1/students/dashboard-stats", headers=headers)
        assert stats_resp.status_code == 200, f"Stats failed: {stats_resp.text}"
        stats = stats_resp.json()
        print(f" -> SUCCESS: Readiness Score: {stats.get('readiness_score')}%, Verified Skills: {stats.get('verified_skills_count')}")

    await db_manager.close()
    print("\n>>> ALL GOOGLE AUTHENTICATION TESTS PASSED WITH 100% SUCCESS <<<")

if __name__ == "__main__":
    asyncio.run(test_google_auth_workflow())
