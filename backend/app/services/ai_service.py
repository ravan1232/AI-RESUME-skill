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
                    "You are SkillBridge Placement AI, a distinguished campus recruitment mentor, "
                    "senior software architect, and career advisor. "
                    "Provide clear, deeply structured, actionable, and inspiring guidance for university placement candidates. "
                    "Format answers with Markdown headers, bullet points, and code snippets where appropriate."
                )
                messages = [{"role": "system", "content": system_prompt}]
                if context:
                    messages.append({"role": "system", "content": f"Student Context: {context}"})
                messages.append({"role": "user", "content": message})

                resp = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=800
                )
                return resp.choices[0].message.content.strip()
            except Exception as e:
                logger.warning("Groq chatbot error: %s", e)

        # Advanced Conversational Knowledge Engine (Works 100% offline or without API key)
        msg_l = message.lower().strip()
        student_name = "there"
        if context and "Student name:" in context:
            try:
                student_name = context.split("Student name:")[1].split(".")[0].strip()
            except Exception:
                pass

        # 1. Greetings
        if re.search(r'\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b', msg_l):
            return (
                f"Hello {student_name}! 👋 I am your **SkillBridge Placement AI Advisor**.\n\n"
                "I am here to help you accelerate your campus placement readiness. You can ask me about:\n"
                "- 📄 **Resume & ATS Optimization**: How to format bullet points and beat screening filters.\n"
                "- 🎤 **Technical Interviews**: Core concepts in Python, React, FastAPI, System Design, or SQL.\n"
                "- 🎯 **Mock Interview Practice**: Answering behavioral and architectural questions.\n"
                "- 🧩 **DSA Roadmaps**: High-yield LeetCode patterns for product-based company tests.\n"
                "- 🤝 **Peer Skill Exchange**: Connecting with campus mentors for missing skills.\n\n"
                "What would you like to prepare for today?"
            )

        # 2. Self Introduction / Tell Me About Yourself
        if "tell me about yourself" in msg_l or "introduce myself" in msg_l or "introduction" in msg_l or "self intro" in msg_l:
            return (
                "### 🎯 The Winning 'Tell Me About Yourself' 4-Step Formula:\n\n"
                "Keep your answer between **90 to 120 seconds** using this proven structure:\n\n"
                "1. **Who You Are (Current Role & Education)**:\n"
                "   * *\"I am currently completing my degree in Computer Science with a strong focus on modern full-stack development and backend systems.\"*\n\n"
                "2. **Core Technical Highlights (What you build)**:\n"
                "   * *\"My primary technical stack includes Python, FastAPI, React, and MongoDB. Recently, I built an end-to-end placement readiness platform that processes PDF resumes and coordinates peer skill exchanges in real-time.\"*\n\n"
                "3. **Engineering Achievements (Quantified Impact)**:\n"
                "   * *\"In that project, I implemented asynchronous token bucket rate limiting and optimized MongoDB indexing, which reduced API response latency by 40% under concurrent loads.\"*\n\n"
                "4. **Why You Are Here (The Forward Link)**:\n"
                "   * *\"I’m excited about this opportunity with your engineering team because of your focus on scalable cloud infrastructure, where I can apply my backend engineering depth and grow rapidly.\"*\n\n"
                "💡 **Pro Tip:** Never recite your resume word-for-word. Tell the story behind the technical decisions you made!"
            )

        # 3. Python Core & Placement Concepts
        if "python" in msg_l:
            return (
                "### 🐍 Top Python Technical Placement Concepts & Questions:\n\n"
                "In placement interviews, interviewers frequently probe Python's memory model and concurrency:\n\n"
                "1. **Global Interpreter Lock (GIL)**:\n"
                "   * Python's GIL ensures only one native thread executes Python bytecode at a time in CPython. For I/O-bound tasks, use `asyncio` or `threading`. For CPU-bound tasks, use `multiprocessing` to bypass the GIL.\n\n"
                "2. **Asyncio Event Loop vs Multi-threading**:\n"
                "   * `asyncio` uses single-threaded cooperative multitasking. Avoid synchronous blocking calls (like `time.sleep()` or `requests.get()`) in `async def` functions — always use `asyncio.sleep()` or `httpx.AsyncClient`!\n\n"
                "3. **Generators & Iterators**:\n"
                "   * Generators use `yield` and evaluate lazily, keeping memory at $O(1)$ when streaming millions of records instead of loading full lists into RAM.\n\n"
                "4. **Decorators**:\n"
                "   * Functions that wrap other functions to add cross-cutting behavior (e.g. logging, authentication, caching) using `@functools.wraps`.\n\n"
                "💡 Would you like to practice a mock technical question on Python async architecture?"
            )

        # 4. React & Frontend Architecture
        if "react" in msg_l or "frontend" in msg_l:
            return (
                "### ⚛️ High-Frequency React & Frontend Placement Topics:\n\n"
                "1. **Virtual DOM & Reconciliation (Fiber)**:\n"
                "   * React maintains a lightweight in-memory representation of the DOM. Diffing algorithm operates in $O(n)$ by comparing element types and unique `key` props, applying atomic patches to the real DOM.\n\n"
                "2. **State Management Trade-Offs**:\n"
                "   * **React Context**: Great for static or rarely changing global values (auth, themes). Bad for high-frequency updates because all consuming components re-render.\n"
                "   * **Zustand / Redux Toolkit**: Uses selector-based subscriptions so only the component reading the specific slice of state re-renders.\n\n"
                "3. **Optimization Hooks**:\n"
                "   * `useMemo`: Caches expensive computation results across renders.\n"
                "   * `useCallback`: Maintains referential stability of function definitions passed to memoized children (`React.memo`).\n\n"
                "4. **Common Interview Question**: *\"How do you prevent prop-drilling without adding complex external dependencies?\"* (Answer: Component composition with `children` or focused React Context providers)."
            )

        # 5. FastAPI & Backend Microservices
        if "fastapi" in msg_l or "backend" in msg_l or "api" in msg_l or "rest" in msg_l:
            return (
                "### ⚡ FastAPI & Production Backend Best Practices:\n\n"
                "1. **Lifespan Context Managers (`@asynccontextmanager`)**:\n"
                "   * Replaced `@app.on_event('startup')`. Guarantees clean setup of database connection pools (Motor/PyMongo/SQLAlchemy) on boot and graceful teardown on SIGTERM.\n\n"
                "2. **Dependency Injection (`Depends()`)**:\n"
                "   * Decouples business logic from database sessions, JWT token extraction, and RBAC authorization headers.\n\n"
                "3. **Pydantic V2 Validation**:\n"
                "   * Built on Rust (`pydantic-core`), providing 5-10x faster serialization, automatic OpenAPI Swagger schema generation, and strict type coercions.\n\n"
                "4. **CORS & Security**:\n"
                "   * Always configure `allow_origins`, specify strict HTTP verbs (`allow_methods=['GET', 'POST', ...]`), and protect JWT cookies with `HttpOnly` and `SameSite=Strict` flags in production."
            )

        # 6. Databases: SQL vs NoSQL / MongoDB / Indexing
        if "database" in msg_l or "sql" in msg_l or "nosql" in msg_l or "mongo" in msg_l or "postgres" in msg_l:
            return (
                "### 🗄️ Database Engineering Interview Essentials:\n\n"
                "1. **SQL (PostgreSQL/MySQL) vs NoSQL (MongoDB)**:\n"
                "   * **SQL**: Strong ACID guarantees, strict schemas, optimal for relational data with complex joins (banking, transactions).\n"
                "   * **NoSQL**: Flexible document model, horizontal scaling via sharding, optimal for hierarchical JSON, high-velocity telemetry, and rapidly evolving schemas.\n\n"
                "2. **Indexing Strategies (B-Trees)**:\n"
                "   * Indexes dramatically accelerate queries from $O(n)$ full collection scans (`COLLSCAN`) to $O(\\log n)$ index lookups (`IXSCAN`).\n"
                "   * Follow the **ESR Rule** for compound indexes: **E**quality filters first $\\rightarrow$ **S**ort fields second $\\rightarrow$ **R**ange queries last.\n\n"
                "3. **Transactions in MongoDB**:\n"
                "   * Single document writes are atomic by default. Multi-document ACID transactions are supported across replica sets using client sessions."
            )

        # 7. Data Structures & Algorithms (DSA)
        if "dsa" in msg_l or "leetcode" in msg_l or "algorithm" in msg_l or "binary search" in msg_l or "tree" in msg_l:
            return (
                "### 🧩 High-Yield Placement DSA Patterns (Focus on Patterns, Not 1,000 Problems):\n\n"
                "1. **Two Pointers & Sliding Window**:\n"
                "   * Trapping Rainwater, Longest Substring Without Repeating Characters, 3Sum ($O(n)$ time, $O(1)$ space).\n\n"
                "2. **Fast & Slow Pointers (Floyd's Cycle Detection)**:\n"
                "   * Linked List cycle detection, finding middle of linked list in a single pass.\n\n"
                "3. **BFS & DFS on Graphs/Trees**:\n"
                "   * Level Order Traversal (Queue), Number of Islands (Grid DFS/BFS), Course Schedule (Topological Sort with Kahn's algorithm).\n\n"
                "4. **Dynamic Programming (Memoization to Tabulation)**:\n"
                "   * 0/1 Knapsack, Longest Common Subsequence (LCS), Coin Change ($O(n \\cdot W)$ complexity).\n\n"
                "💡 **Interview Rule:** When coding in an interview, speak your thought process out loud before writing a single line of code! Always state the Time and Space complexity."
            )

        # 8. System Design & Scalability
        if "system design" in msg_l or "scale" in msg_l or "distributed" in msg_l or "microservice" in msg_l:
            return (
                "### 🏗️ 5-Step System Design Interview Framework:\n\n"
                "When asked to design a system (e.g. TinyURL, WhatsApp, Uber, Netflix):\n\n"
                "1. **Step 1: Scope & Functional Requirements (5 mins)**:\n"
                "   * What are the core features? (e.g. read heavy vs write heavy? Latency targets?)\n\n"
                "2. **Step 2: Capacity Estimation (Back-of-the-envelope)**:\n"
                "   * 100M Daily Active Users $\\times$ 10 requests = 1 Billion requests/day $\\approx$ 12,000 QPS (Queries Per Second).\n\n"
                "3. **Step 3: High-Level Architecture**:\n"
                "   * Client $\\rightarrow$ DNS / CDN $\\rightarrow$ Load Balancer (Nginx/ALB) $\\rightarrow$ API Gateway $\\rightarrow$ Stateless Microservices $\\rightarrow$ Cache (Redis) $\\rightarrow$ Primary/Replica DB.\n\n"
                "4. **Step 4: Deep Dive into Core Bottlenecks**:\n"
                "   * Caching strategies (Cache-aside vs Write-through), DB Sharding keys, Message Queues (Kafka/RabbitMQ) for asynchronous worker decoupling.\n\n"
                "5. **Step 5: High Availability & Fault Tolerance**:\n"
                "   * Circuit breakers, database replication lag handling, multi-region failover."
            )

        # 9. Resume & ATS Optimization
        if "resume" in msg_l or "ats" in msg_l or "score" in msg_l:
            return (
                "### 📄 Blueprint for a 90%+ ATS Score Resume:\n\n"
                "1. **The XYZ Bullet Point Formula (Google's Standard)**:\n"
                "   * Write: *\"Accomplished [X] as measured by [Y], by doing [Z].\"*\n"
                "   * ❌ *\"Built a website with React.\"*\n"
                "   * ✅ *\"Architected a responsive dashboard with React & Tailwind, reducing page load latency by 35% across 2,000 monthly active users.\"*\n\n"
                "2. **ATS Formatting Rules**:\n"
                "   * Single-column layout (no tables, multi-column sidebars, or graphic skill meters).\n"
                "   * Use standard section headers: **Education, Experience, Projects, Technical Skills**.\n"
                "   * Export as clean searchable text PDF (not scanned images).\n\n"
                "3. **Keyword Mirroring**:\n"
                "   * Use our **Resume & ATS Score** scanner to extract your skills, then test your target job description in **Job Gap Matcher** to find missing keywords!"
            )

        # 10. Behavioral & HR Rounds (STAR Method)
        if "behavioral" in msg_l or "hr" in msg_l or "star" in msg_l or "weakness" in msg_l or "conflict" in msg_l:
            return (
                "### 🌟 Mastering Behavioral & HR Rounds with STAR:\n\n"
                "Interviewers use behavioral questions to test cultural fit, grit, and communication:\n\n"
                "- **S (Situation)**: Set the context briefly (Who, when, project setting).\n"
                "- **T (Task)**: What was the specific problem or assignment you had to solve?\n"
                "- **A (Action)**: The most important section (60% of your time). What specific technical and interpersonal actions did *you* take?\n"
                "- **R (Result)**: The quantifiable outcome (e.g. *\"Delivered 3 days ahead of schedule, zero production outages, and received peer recognition\"*).\n\n"
                "💡 **How to answer 'What is your greatest weakness?'**:\n"
                "Choose a real technical or process habit (e.g. *\"Early on, I struggled with trying to implement too many features at once\"*), and explain the exact system you built to fix it (e.g. *\"Now I use milestone breakdown and MVP scoping, which has kept my last 3 projects on track\"*)."
            )

        # 11. Generic / Open-Ended Placement Inquiry
        return (
            f"### 🚀 Placement Strategy for {student_name}:\n\n"
            f"You asked: *\"{message}\"*\n\n"
            "Here is the systematic path to crack your target placement rounds:\n\n"
            "1. **Audit Your Profile & Resume**:\n"
            "   * Check the **Resume & ATS Score** hub to analyze keyword extraction and formatting score.\n"
            "2. **Target Your Dream Roles**:\n"
            "   * Paste target job descriptions in **Job Gap Matcher** to calculate your match percentage.\n"
            "3. **Fill Skill Gaps via Campus Mentors**:\n"
            "   * Use **Peer Skill Exchange** to schedule live 1-on-1 sessions with student peers who already know your missing skills.\n"
            "4. **Interactive Simulation**:\n"
            "   * Run real campus technical rounds in **AI Mock Interview** and verify your skills in **Skill Verification**!\n\n"
            "Would you like more details on a specific language, interview question, or placement company?"
        )

    def evaluate_interview_response(self, question: str, answer: str) -> Dict[str, Any]:
        """Evaluate mock interview answer."""
        if self.is_configured():
            try:
                prompt = (
                    f"You are a Senior Principal Engineer and Hiring Committee Evaluator.\n"
                    f"Evaluate this mock interview response:\n"
                    f"Interview Question: {question}\n"
                    f"Candidate Answer: {answer}\n\n"
                    "Return ONLY valid JSON matching this schema:\n"
                    "{\n"
                    "  \"score\": 8,\n"
                    "  \"strengths\": [\"Strength 1\", \"Strength 2\"],\n"
                    "  \"improvements\": [\"Actionable improvement 1\", \"Actionable improvement 2\"],\n"
                    "  \"feedback\": \"Concise, empowering mentor feedback summary\"\n"
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

        # Context-Aware Intelligent Evaluation Engine (Deterministic & Robust)
        words = answer.strip().split()
        length = len(words)
        answer_lower = answer.lower()

        # Check for core engineering terminology
        tech_indicators = [
            "latency", "throughput", "cache", "redis", "database", "index",
            "async", "asyncio", "thread", "concurrency", "lock", "queue",
            "trade-off", "tradeoff", "complexity", "o(1)", "o(n)", "scale",
            "stateless", "load balancer", "kubernetes", "docker", "token bucket",
            "virtual dom", "reconciliation", "memo", "star", "result", "metric"
        ]

        matched_terms = [t for t in tech_indicators if t in answer_lower]
        term_count = len(matched_terms)

        # Calculate dynamic score (1 to 10)
        if length < 15:
            score = 3
        elif length < 35:
            score = 5 if term_count >= 1 else 4
        elif length < 70:
            score = min(8, 6 + (term_count // 2))
        else:
            score = min(10, max(7, 7 + (term_count // 2)))

        strengths = []
        improvements = []

        if term_count > 0:
            strengths.append(f"Demonstrated technical depth by referencing core concepts: {', '.join(matched_terms[:3])}.")
        if length >= 40:
            strengths.append("Provided a thorough, structured explanation of the problem space.")
        else:
            strengths.append("Addressed the interviewer's prompt directly without hesitation.")

        if "star" in answer_lower or ("situation" in answer_lower and "result" in answer_lower):
            strengths.append("Excellent structured delivery utilizing the STAR methodology.")

        # Constructive improvements
        if term_count < 2:
            improvements.append("Incorporate specific technical mechanisms (e.g. caching layer, concurrency model, or algorithmic trade-offs).")
        if "complexity" not in answer_lower and "time" not in answer_lower and "o(" not in answer_lower:
            improvements.append("Explicitly state Time and Space Complexity ($O(1)$, $O(n)$) to show computer science rigor.")
        if "edge" not in answer_lower and "fail" not in answer_lower and "error" not in answer_lower:
            improvements.append("Discuss edge cases and failure modes (e.g. network timeouts, distributed lock expiration, node failure).")
        if length < 30:
            improvements.append("Expand on your reasoning — brief answers can leave the hiring committee wanting more architectural detail.")

        feedback = (
            f"Candidate scored {score}/10. "
            f"{'Strong, technically grounded response with sound engineering rationale.' if score >= 8 else 'Good foundation; elevate your answer by highlighting production trade-offs and complexity analysis.'}"
        )

        return {
            "score": score,
            "strengths": strengths,
            "improvements": improvements[:2],
            "feedback": feedback
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

