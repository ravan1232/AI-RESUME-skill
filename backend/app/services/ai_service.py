import os
import json
import logging
import re
from typing import Dict, List, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        self.model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        self.client = None
        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
                logger.info("Groq AI Client initialized successfully with model %s.", self.model)
            except Exception as e:
                logger.warning("Could not initialize Groq client: %s", e)

    def is_configured(self) -> bool:
        return self.client is not None

    def analyze_resume_text(self, text: str) -> Dict[str, Any]:
        """Extract structured resume sections and skills."""
        # 1. Deterministic extraction
        text_lower = text.lower()
        common_skills = [
            "python", "javascript", "typescript", "react", "react.js", "node.js", "fastapi", "django",
            "docker", "kubernetes", "aws", "azure", "gcp", "postgresql", "mysql", "mongodb",
            "git", "github", "linux", "html", "css", "tailwind", "tailwind css", "rest api",
            "graphql", "redis", "ci/cd", "machine learning", "data structures", "algorithms",
            "system design", "c++", "java", "sql", "pandas", "numpy"
        ]

        found_skills = []
        for s in common_skills:
            pattern = r'\b' + re.escape(s) + r'\b'
            if re.search(pattern, text_lower):
                # Clean name capitalization
                found_skills.append(s.title().replace(".Js", ".js"))

        # Calculate deterministic ATS Score
        # Factors: Skill density (max 40), Section structure (max 30), Word count / length (max 30)
        word_count = len(text.split())
        length_score = min(30, max(10, int((word_count / 300) * 30))) if word_count < 700 else 28

        sections = ["education", "experience", "skills", "projects", "certifications"]
        section_score = sum(6 for sec in sections if sec in text_lower)

        skill_score = min(40, len(found_skills) * 4)
        ats_score = min(98, max(50, length_score + section_score + skill_score))

        strengths = [
            f"Detected {len(found_skills)} technical core skills in document body.",
            "Clear technical competencies and role keyword alignment."
        ]
        if "project" in text_lower or "projects" in text_lower:
            strengths.append("Contains project experience demonstrating practical application.")

        improvements = []
        if len(found_skills) < 5:
            improvements.append("Expand skills section to include specific frameworks and cloud tooling.")
        if "certifications" not in text_lower:
            improvements.append("Add verified certifications or accredited coursework to boost ATS indexing.")
        if word_count < 250:
            improvements.append("Resume length is brief. Add quantifiable metrics and project outcomes.")
        if not improvements:
            improvements.append("Ensure consistent date formatting and bullet point action verbs.")

        # Try Groq for advanced enhancement if available
        if self.is_configured():
            try:
                prompt = (
                    "You are an expert ATS (Applicant Tracking System) parser and technical recruiter.\n"
                    f"Analyze this resume:\n\"\"\"{text[:2500]}\"\"\"\n"
                    "Return ONLY valid JSON matching this structure without Markdown backticks:\n"
                    "{\n"
                    "  \"skills\": [\"skill1\", \"skill2\"],\n"
                    "  \"ats_score\": 82,\n"
                    "  \"strengths\": [\"strength1\", \"strength2\"],\n"
                    "  \"improvements\": [\"improvement1\", \"improvement2\"],\n"
                    "  \"summary\": \"Brief professional overview\"\n"
                    "}"
                )
                resp = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    response_format={"type": "json_object"}
                )
                content = resp.choices[0].message.content
                ai_data = json.loads(content)
                if isinstance(ai_data.get("skills"), list) and len(ai_data["skills"]) > 0:
                    found_skills = list(set(found_skills + ai_data["skills"]))
                if "ats_score" in ai_data and isinstance(ai_data["ats_score"], int):
                    ats_score = ai_data["ats_score"]
                if ai_data.get("strengths"):
                    strengths = ai_data["strengths"]
                if ai_data.get("improvements"):
                    improvements = ai_data["improvements"]
            except Exception as e:
                logger.warning("Groq resume analysis fallback to deterministic parser: %s", e)

        return {
            "skills": found_skills,
            "ats_score": ats_score,
            "word_count": word_count,
            "strengths": strengths,
            "improvements": improvements
        }

    def analyze_job_description(self, job_title: str, jd_text: str, student_skills: List[str]) -> Dict[str, Any]:
        """Compare Job Description with student skills, compute gaps and generate roadmap."""
        text_lower = jd_text.lower()
        catalog = [
            "python", "fastapi", "django", "react", "react.js", "javascript", "typescript",
            "node.js", "docker", "kubernetes", "aws", "azure", "gcp", "postgresql", "mongodb",
            "redis", "system design", "data structures", "algorithms", "rest api", "graphql",
            "git", "ci/cd", "linux", "tailwind css", "microservices"
        ]

        # Extract required skills from JD
        required_skills = []
        for s in catalog:
            pattern = r'\b' + re.escape(s) + r'\b'
            if re.search(pattern, text_lower):
                required_skills.append(s.title().replace(".Js", ".js"))

        if not required_skills:
            required_skills = ["Python", "FastAPI", "Docker", "SQL", "Git"]

        # Normalize student skills for comparison
        student_skills_clean = [s.strip().lower() for s in student_skills]

        matched = []
        missing = []
        for req in required_skills:
            req_clean = req.lower()
            if any(req_clean == s or req_clean in s or s in req_clean for s in student_skills_clean):
                matched.append(req)
            else:
                missing.append(req)

        match_pct = round((len(matched) / len(required_skills)) * 100, 1) if required_skills else 50.0

        # Build personalized roadmap for missing skills
        roadmap = []
        for idx, skill in enumerate(missing, start=1):
            priority = "Critical" if idx <= 2 else "High" if idx <= 4 else "Medium"
            hours = 12 if priority == "Critical" else 8
            milestones = [
                f"Core fundamentals and terminology of {skill}",
                f"Hands-on architectural patterns & real-world projects with {skill}",
                f"Interview questions & performance benchmarks in {skill}"
            ]
            roadmap.append({
                "step": idx,
                "skill": skill,
                "priority": priority,
                "estimated_hours": hours,
                "milestones": milestones,
                "recommended_resources": [
                    f"Official {skill} Documentation",
                    f"Production {skill} Masterclass"
                ]
            })

        # Try Groq enhancement if configured
        if self.is_configured():
            try:
                prompt = (
                    f"Analyze this Job Description for '{job_title}':\n\"\"\"{jd_text[:2000]}\"\"\"\n"
                    f"Student currently has skills: {json.dumps(student_skills)}\n"
                    "Return ONLY valid JSON matching this schema:\n"
                    "{\n"
                    "  \"required_skills\": [\"skill1\", \"skill2\"],\n"
                    "  \"matched_skills\": [\"skill1\"],\n"
                    "  \"missing_skills\": [\"skill2\"],\n"
                    "  \"match_percentage\": 75.0,\n"
                    "  \"summary\": \"Executive summary of match\"\n"
                    "}"
                )
                resp = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    response_format={"type": "json_object"}
                )
                ai_data = json.loads(resp.choices[0].message.content)
                if ai_data.get("required_skills"):
                    required_skills = ai_data["required_skills"]
                if ai_data.get("matched_skills"):
                    matched = ai_data["matched_skills"]
                if ai_data.get("missing_skills"):
                    missing = ai_data["missing_skills"]
                if "match_percentage" in ai_data:
                    match_pct = float(ai_data["match_percentage"])
            except Exception as e:
                logger.warning("Groq JD gap analysis fallback: %s", e)

        return {
            "required_skills": required_skills,
            "matched_skills": matched,
            "missing_skills": missing,
            "match_percentage": match_pct,
            "learning_roadmap": roadmap
        }

    def chat_placement_assistant(self, message: str, context: Optional[str] = None) -> str:
        """Handle conversational queries about placement readiness, ATS, and interview advice."""
        if self.is_configured():
            try:
                system_prompt = (
                    "You are SkillBridge AI, an expert placement mentor and career architect. "
                    "Help university students optimize their resumes, crack campus interviews, "
                    "and find peer tutors for missing skills. Keep your answers concise, practical, and inspiring."
                )
                messages = [{"role": "system", "content": system_prompt}]
                if context:
                    messages.append({"role": "system", "content": f"Student context: {context}"})
                messages.append({"role": "user", "content": message})

                resp = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=600
                )
                return resp.choices[0].message.content.strip()
            except Exception as e:
                logger.warning("Groq chatbot error: %s", e)

        # Fallback intelligent responder
        msg_l = message.lower()
        if "resume" in msg_l or "ats" in msg_l:
            return (
                "To optimize your resume for ATS systems:\n"
                "1. Use standard headings (Experience, Education, Skills, Projects).\n"
                "2. Include quantifiable outcomes (e.g. 'Improved API response latency by 35%').\n"
                "3. Ensure the exact technical keywords from the job description appear naturally.\n"
                "4. Stick to single-column, cleanly parsed formatting."
            )
        elif "interview" in msg_l or "mock" in msg_l:
            return (
                "For technical placement interviews, focus on the STAR method (Situation, Task, Action, Result).\n"
                "Structure your code explanations by discussing time and space complexity upfront, "
                "handling edge cases, and walking through your test strategy."
            )
        elif "peer" in msg_l or "exchange" in msg_l:
            return (
                "SkillBridge connects you with student peers who have already mastered your missing placement skills! "
                "Check the 'Job Gap Matcher' to see automatic peer mentor recommendations based on your target role."
            )
        else:
            return (
                "SkillBridge AI is here to guide your career placement journey. "
                "You can upload your resume in the 'Resume & ATS Score' hub, compare it against target Job Descriptions, "
                "and find campus peer mentors to teach you missing skills!"
            )

    def evaluate_interview_response(self, question: str, answer: str) -> Dict[str, Any]:
        """Evaluate mock interview answer."""
        if self.is_configured():
            try:
                prompt = (
                    f"Evaluate this mock interview question and answer:\n"
                    f"Question: {question}\n"
                    f"Candidate Answer: {answer}\n\n"
                    "Return ONLY valid JSON matching this structure:\n"
                    "{\n"
                    "  \"score\": 8,\n"
                    "  \"strengths\": [\"clear explanation\", \"good structure\"],\n"
                    "  \"improvements\": [\"mention edge cases\", \"quantify metrics\"],\n"
                    "  \"feedback\": \"Constructive mentor feedback summary\"\n"
                    "}"
                )
                resp = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
                return json.loads(resp.choices[0].message.content)
            except Exception as e:
                logger.warning("Groq interview evaluation fallback: %s", e)

        # Deterministic evaluation fallback
        length = len(answer.split())
        score = min(9, max(4, int(length / 20) + 4))
        return {
            "score": score,
            "strengths": [
                "Direct address of the interviewer's prompt",
                "Logical progression of problem-solving steps"
            ],
            "improvements": [
                "Consider diving deeper into trade-offs and alternative approaches",
                "Include a concrete example from your past projects or internships"
            ],
            "feedback": f"Solid response scoring {score}/10. Practice framing answers using the STAR method for maximum impact."
        }

    def generate_questions_from_resume(
        self,
        resume_text: str,
        skills: Optional[List[str]] = None,
        difficulty: str = "mid",
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """Generate tailored technical and architectural interview questions from candidate resume."""
        if not skills:
            analysis = self.analyze_resume_text(resume_text)
            skills = analysis.get("skills", ["Python", "FastAPI", "React"])

        # Try Groq AI if available
        if self.is_configured():
            try:
                prompt = (
                    "You are a Principal Engineering Recruiter and Technical Hiring Manager.\n"
                    f"Analyze this candidate resume:\n\"\"\"{resume_text[:3000]}\"\"\"\n"
                    f"Candidate verified skills: {json.dumps(skills)}\n"
                    f"Target interview difficulty: {difficulty} (entry, mid, or senior).\n"
                    f"Generate exactly {count} tailored, in-depth technical and project-focused interview questions "
                    "strictly based on what this candidate claims on their resume.\n"
                    "Return ONLY valid JSON matching this schema:\n"
                    "{\n"
                    "  \"questions\": [\n"
                    "    {\n"
                    "      \"id\": \"q1\",\n"
                    "      \"category\": \"Category name (e.g. FastAPI Architecture, Distributed Systems)\",\n"
                    "      \"question\": \"The exact interview question\",\n"
                    "      \"ideal_answer_criteria\": \"Key technical points, edge cases, or trade-offs the interviewer should evaluate\",\n"
                    "      \"difficulty\": \"Intermediate\",\n"
                    "      \"resume_context\": \"Specific skill or project bullet point in the resume that prompted this question\"\n"
                    "    }\n"
                    "  ]\n"
                    "}"
                )
                resp = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
                data = json.loads(resp.choices[0].message.content)
                questions = data.get("questions", [])
                if isinstance(questions, list) and len(questions) > 0:
                    return questions[:count]
            except Exception as e:
                logger.warning(f"Groq resume question generation fallback: {e}")

        # Intelligent deterministic fallback generator mapped to detected skills & projects
        SKILL_QUESTION_TEMPLATES = {
            "python": [
                {
                    "category": "Python Architecture & Concurrency",
                    "question": "Your resume highlights Python development. How do you distinguish between asyncio event loops and multithreading, and how do you prevent CPU-bound tasks from blocking the event loop in high-throughput services?",
                    "ideal_answer_criteria": "Candidate should discuss GIL (Global Interpreter Lock), run_in_executor with ProcessPoolExecutor for CPU tasks, non-blocking I/O, and event loop thread-safety.",
                    "difficulty": "Intermediate",
                    "resume_context": "Prompted by Python proficiency and asynchronous backend services."
                },
                {
                    "category": "Python Memory & Performance",
                    "question": "Can you explain memory management in Python, specifically how reference counting, cyclic garbage collection, and generators with lazy evaluation optimize footprint for large datasets?",
                    "ideal_answer_criteria": "Candidate should explain sys.getrefcount, gc module thresholds, weakref, and generator iterators vs list comprehension memory consumption.",
                    "difficulty": "Senior",
                    "resume_context": "Evaluates Python data engineering depth and production optimization."
                }
            ],
            "fastapi": [
                {
                    "category": "FastAPI & Microservices",
                    "question": "In your FastAPI projects, how do you architect dependency injection with lifespan context managers to maintain persistent database connection pooling across asynchronous endpoints?",
                    "ideal_answer_criteria": "Candidate should describe @asynccontextmanager lifespan handler, yielding client session, Depends() yield generators, and cleanly closing connection pools on SIGTERM.",
                    "difficulty": "Intermediate",
                    "resume_context": "Derived from FastAPI REST API development listed on resume."
                }
            ],
            "react": [
                {
                    "category": "React State & Performance",
                    "question": "You list React on your resume. How do you debug and resolve unnecessary component re-renders in complex dashboards, and when should you choose Zustand/Redux vs React Context?",
                    "ideal_answer_criteria": "Candidate should cover React.memo, useMemo/useCallback dependency arrays, Context re-rendering consumer tree issues, and selector-based state subscriptions.",
                    "difficulty": "Intermediate",
                    "resume_context": "Prompted by modern frontend React development listed in skills."
                }
            ],
            "docker": [
                {
                    "category": "DevOps & Containers",
                    "question": "Based on the Docker experience in your profile, how do you structure multi-stage Dockerfiles to minimize final image footprint, separate build dependencies from runtime, and enforce non-root security?",
                    "ideal_answer_criteria": "Candidate should discuss FROM ... AS builder, copying only built artifacts to distroless or alpine runner image, USER appuser, and layer caching optimization.",
                    "difficulty": "Intermediate",
                    "resume_context": "Prompted by containerization tooling listed on resume."
                }
            ],
            "mongodb": [
                {
                    "category": "Database Engineering",
                    "question": "Your resume includes MongoDB. How do you analyze slow queries using explain('executionStats'), avoid in-memory sorting limitations, and design compound indexes for multi-field filtering?",
                    "ideal_answer_criteria": "Candidate should explain ESR (Equality, Sort, Range) rule, covered queries, avoiding COLLSCAN, and working within 100MB RAM sort limits.",
                    "difficulty": "Intermediate",
                    "resume_context": "Derived from MongoDB Atlas database management listed in project stack."
                }
            ],
            "kubernetes": [
                {
                    "category": "Cloud Infrastructure",
                    "question": "How do you configure readiness and liveness probes in Kubernetes to avoid cascading service failure during traffic spikes, and how does HPA determine scaling thresholds?",
                    "ideal_answer_criteria": "Candidate should distinguish liveness (restart pod) vs readiness (traffic routing), startupProbe for slow initializers, and metrics-server CPU/memory thresholds.",
                    "difficulty": "Senior",
                    "resume_context": "Derived from cloud orchestration competencies."
                }
            ],
            "general_project": [
                {
                    "category": "System Architecture & Trade-offs",
                    "question": "Walk us through the most technically challenging project on your resume. What key trade-offs did you make between latency, consistency, and implementation velocity, and how did you measure success?",
                    "ideal_answer_criteria": "Candidate should articulate clear problem statement, technical stack rationale, specific engineering hurdles overcome, and quantifiable production metrics.",
                    "difficulty": "Intermediate",
                    "resume_context": "Synthesized from projects and practical engineering achievements in resume."
                },
                {
                    "category": "Production Reliability & Incident Response",
                    "question": "Imagine a core API in one of your featured resume projects starts experiencing sudden 500 errors and high p99 latency under production load. What is your systematic step-by-step diagnostic process?",
                    "ideal_answer_criteria": "Candidate should detail structured triage: check error logs/APM, inspect database connection saturation, monitor CPU/memory spikes, isolate recent commits, and deploy rollback or circuit-breaker.",
                    "difficulty": "Intermediate",
                    "resume_context": "Evaluates practical debugging and engineering maturity."
                }
            ]
        }

        generated: List[Dict[str, Any]] = []
        normalized_skills = [s.lower().replace(".js", "").replace(" ", "") for s in skills]

        # Gather relevant questions
        for key, q_list in SKILL_QUESTION_TEMPLATES.items():
            if any(key in ns for ns in normalized_skills) or key == "general_project":
                for q in q_list:
                    if len(generated) < count:
                        item = dict(q)
                        item["id"] = f"q{len(generated) + 1}"
                        generated.append(item)

        # Fill if needed
        while len(generated) < count:
            idx = len(generated) + 1
            generated.append({
                "id": f"q{idx}",
                "category": "Software Engineering Best Practices",
                "question": f"In your software development workflow, how do you incorporate automated unit testing, CI/CD pipelines, and code reviews to guarantee zero-regression releases?",
                "ideal_answer_criteria": "Candidate should cover pytest/Jest test coverage, GitHub Actions/GitLab CI linting, staging environments, and atomic commit reviews.",
                "difficulty": "Intermediate",
                "resume_context": "Based on overall professional engineering standards in resume."
            })

        return generated[:count]

ai_service = AIService()

