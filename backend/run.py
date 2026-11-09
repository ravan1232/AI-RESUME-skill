import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import uvicorn
from app.config import settings
from app.main import app

if __name__ == "__main__":
    host = settings.HOST if settings.HOST != "0.0.0.0" else "127.0.0.1"
    print(f"===========================================================")
    print(f"  Starting SkillBridge AI Backend API Server")
    print(f"  Target: http://{host}:{settings.PORT}")
    print(f"  Docs:   http://{host}:{settings.PORT}/docs")
    print(f"===========================================================")
    uvicorn.run(
        app,
        host=host,
        port=settings.PORT,
        log_level="info"
    )
