import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from app.main import app

async def test_admin_resume_questions_flow():
    print("=================================================================")
    print("  SkillBridge AI: Admin Resume Question Generator Verification   ")
    print("=================================================================")

    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Log in as Admin
        print("\n[STEP 1] Authenticating as Admin (keerthi12@gmail.com)...")
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": "keerthi12@gmail.com",
            "password": "password123"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(" -> Admin authenticated successfully.")

        # 2. Get student resumes list
        print("\n[STEP 2] Fetching Student Resumes for Question Synthesis...")
        resumes_resp = await client.get("/api/v1/admin/student-resumes", headers=headers)
        assert resumes_resp.status_code == 200, f"Failed: {resumes_resp.text}"
        candidates = resumes_resp.json()["candidates"]
        print(f" -> Found {len(candidates)} candidates ready for question synthesis.")

        # 3. Generate resume-based questions for selected candidate
        target_user_id = candidates[0]["user_id"] if candidates else None
        print(f"\n[STEP 3] Generating Questions for Candidate: {candidates[0]['full_name']}...")
        gen_payload = {
            "user_id": target_user_id,
            "difficulty": "mid",
            "count": 4
        }
        gen_resp = await client.post("/api/v1/admin/generate-resume-questions", json=gen_payload, headers=headers)
        assert gen_resp.status_code == 200, f"Generation failed: {gen_resp.text}"
        gen_data = gen_resp.json()
        print(f" -> Generated {gen_data['total_questions']} questions for {gen_data['candidate_name']}.")
        for q in gen_data["questions"]:
            print(f"    * [{q['category']}] {q['question'][:75]}...")

        # 4. Save first question to Platform Question Bank
        first_q = gen_data["questions"][0]
        print(f"\n[STEP 4] Saving Question to Platform Assessment Bank ({first_q['category']})...")
        save_payload = {
            "skill_name": first_q["category"].split()[0],
            "question": first_q["question"],
            "difficulty": first_q["difficulty"],
            "explanation": first_q["ideal_answer_criteria"]
        }
        save_resp = await client.post("/api/v1/admin/add-to-question-bank", json=save_payload, headers=headers)
        assert save_resp.status_code == 200, f"Save to bank failed: {save_resp.text}"
        save_data = save_resp.json()
        print(f" -> {save_data['message']}")

    print("\n>>> ALL ADMIN RESUME QUESTION GENERATOR TESTS PASSED WITH 100% SUCCESS <<<")

if __name__ == "__main__":
    asyncio.run(test_admin_resume_questions_flow())
