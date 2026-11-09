import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import db_manager

async def run_e2e_workflow_tests():
    print("================================================================")
    print("  SkillBridge AI: Complete Critical Workflow Integration Tests  ")
    print("================================================================")

    await db_manager.connect()
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # STEP 1: Student Authentication
        print("\n[STEP 1] Authenticating Student (Sarah Connor)...")
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": "sarah.connor@university.edu",
            "password": "SecurePassword123!"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        student_token = login_resp.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        print(" -> Student authenticated. JWT bearer token generated.")

        # STEP 2: Job Description Analysis & Autonomous Peer Match
        print("\n[STEP 2] Running Job Description Gap & Autonomous Matching...")
        jd_payload = {
            "job_title": "Full-Stack Cloud Engineer",
            "company_name": "Acme Tech Solutions",
            "job_description": (
                "Seeking an engineer skilled in Python, FastAPI, Docker containers, Kubernetes, "
                "PostgreSQL, and Git version control. Experience with microservices required."
            )
        }
        job_resp = await client.post("/api/v1/jobs/analyze", json=jd_payload, headers=student_headers)
        assert job_resp.status_code == 200, f"Job analysis failed: {job_resp.text}"
        job_data = job_resp.json()
        print(f" -> Job Match Percentage: {job_data['match_percentage']}%")
        print(f" -> Matched Skills: {job_data['matched_skills']}")
        print(f" -> Missing Skills (Gaps): {job_data['missing_skills']}")
        assert len(job_data["learning_roadmap"]) > 0, "Roadmap must not be empty"
        print(f" -> Generated {len(job_data['learning_roadmap'])} Roadmap Learning Milestones.")

        # Verify Autonomous Peer Recommendations
        assert len(job_data["recommended_partners"]) > 0, "Autonomous peer matching must recommend campus mentors"
        top_partner = job_data["recommended_partners"][0]
        print(f" -> Autonomous Peer Match Found: {top_partner['peer_name']} (Compatibility: {top_partner['compatibility_score']}%)")
        print(f" -> Can teach missing skill: {[s['skill_name'] for s in top_partner['skills_they_can_teach']]}")

        # STEP 3: Peer Skill Exchange Request
        print("\n[STEP 3] Sending Peer Skill Exchange Request...")
        req_payload = {
            "provider_id": top_partner["peer_id"],
            "skill_offered": "React.js",
            "skill_requested": top_partner["skills_they_can_teach"][0]["skill_name"],
            "notes": "Hi Priya, let's exchange skills for placement readiness!"
        }
        exchange_resp = await client.post("/api/v1/exchange/request", json=req_payload, headers=student_headers)
        assert exchange_resp.status_code == 201, f"Exchange request failed: {exchange_resp.text}"
        exchange_id = exchange_resp.json()["exchange_id"]
        print(f" -> Exchange request created with ID: {exchange_id}")

        # STEP 4: Peer Updates Status to Accepted
        print("\n[STEP 4] Updating Request Status to 'accepted'...")
        # Authenticate peer (Priya) to accept request
        priya_login = await client.post("/api/v1/auth/login", json={
            "email": "priya.sharma@university.edu",
            "password": "Password123!"
        })
        assert priya_login.status_code == 200
        priya_headers = {"Authorization": f"Bearer {priya_login.json()['access_token']}"}

        status_resp = await client.put(
            f"/api/v1/exchange/requests/{exchange_id}/status",
            json={"status": "accepted"},
            headers=priya_headers
        )
        assert status_resp.status_code == 200
        print(" -> Request accepted! Exchange partnership activated.")

        # STEP 5: Real-time Peer Messaging
        print("\n[STEP 5] Testing Real-time Exchange Chat...")
        msg_resp = await client.post(
            "/api/v1/chat/send",
            json={"exchange_id": exchange_id, "content": "Hi! Excited to start our peer sessions."},
            headers=student_headers
        )
        assert msg_resp.status_code == 200
        hist_resp = await client.get(f"/api/v1/chat/history/{exchange_id}", headers=student_headers)
        assert hist_resp.status_code == 200
        assert len(hist_resp.json()["messages"]) >= 1
        print(" -> Chat message sent and message history verified.")

        # STEP 6: Skill Verification Assessment & Readiness Boost
        print("\n[STEP 6] Testing Skill Verification Assessment...")
        assess_resp = await client.post("/api/v1/assessments/submit", json={
            "skill_name": "Docker",
            "answers": {"1": 1, "2": 1, "3": 2, "4": 1, "5": 2}  # All 5 correct answers
        }, headers=student_headers)
        assert assess_resp.status_code == 200
        assess_data = assess_resp.json()
        assert assess_data["passed"] is True, f"Assessment should pass: {assess_data}"
        print(f" -> Assessment Score: {assess_data['score_percentage']}% (Passed: {assess_data['passed']})")

        # Verify profile updated with verified skill and boosted score
        prof_resp = await client.get("/api/v1/students/profile", headers=student_headers)
        assert prof_resp.status_code == 200
        prof_data = prof_resp.json()
        verified_skills = [s for s in prof_data["skills_can_teach"] if s.get("verified")]
        assert len(verified_skills) > 0, "Student must have verified skills"
        print(f" -> Verified Skills count: {len(verified_skills)}")
        print(f" -> Updated Placement Readiness Score: {prof_data['placement_readiness']['overall_score']}%")

        # STEP 7: Admin Console Workflow
        print("\n[STEP 7] Testing Administrator Management Console...")
        admin_login = await client.post("/api/v1/auth/login", json={
            "email": "admin@skillbridge.edu",
            "password": "AdminPassword2026!"
        })
        assert admin_login.status_code == 200
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

        # Check Admin Overview
        ov_resp = await client.get("/api/v1/admin/overview", headers=admin_headers)
        assert ov_resp.status_code == 200
        print(f" -> Admin KPI Overview: Total Users={ov_resp.json()['total_users']}, Avg Score={ov_resp.json()['average_readiness_score']}%")

        # Check Admin Users List
        users_resp = await client.get("/api/v1/admin/users", headers=admin_headers)
        assert users_resp.status_code == 200
        assert len(users_resp.json()["users"]) >= 4
        print(f" -> Admin User Directory: {len(users_resp.json()['users'])} synchronized student records.")

        # Add Skill to Catalog
        new_skill = await client.post("/api/v1/admin/skills", json={
            "name": "GraphQL APIs",
            "category": "Web Frameworks",
            "description": "Schema-driven query language for APIs"
        }, headers=admin_headers)
        assert new_skill.status_code == 201
        print(" -> New skill 'GraphQL APIs' added to MongoDB catalog by admin.")

    await db_manager.close()
    print("\n================================================================")
    print(" ALL 7 CRITICAL WORKFLOW INTEGRATION TESTS PASSED SUCCESSFULLY! ")
    print("================================================================\n")

if __name__ == "__main__":
    asyncio.run(run_e2e_workflow_tests())
