from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db_manager
from app.routers import auth, students, resumes, jobs, exchange, chat, assessments, ai, admin

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("skillbridge_api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing SkillBridge AI backend services...")
    await db_manager.connect()
    # Seed demo users & initial data
    from app.utils.seed_data import seed_initial_data
    await seed_initial_data()
    yield
    # Shutdown actions
    logger.info("Shutting down SkillBridge AI backend services...")
    await db_manager.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SkillBridge AI: AI-Based Placement Readiness & Peer Skill Exchange Platform API",
    lifespan=lifespan
)

# CORS configuration supporting wildcard regex with credentials for Render & cloud deployment
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All System API Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(students.router, prefix=settings.API_V1_PREFIX)
app.include_router(resumes.router, prefix=settings.API_V1_PREFIX)
app.include_router(jobs.router, prefix=settings.API_V1_PREFIX)
app.include_router(exchange.router, prefix=settings.API_V1_PREFIX)
app.include_router(chat.router, prefix=settings.API_V1_PREFIX)
app.include_router(assessments.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)

@app.get("/", tags=["Health"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "database_connected": db_manager.is_connected
    }

@app.get("/health", tags=["Health"], status_code=status.HTTP_200_OK)
async def health_check():
    return {
        "status": "healthy",
        "database": "connected (Atlas/Server)" if db_manager.is_connected else "fallback (Local/Testing)",
        "groq_configured": bool(settings.GROQ_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

