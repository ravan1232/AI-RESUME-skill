@echo off
title SkillBridge AI - Backend API Server
cd /d "%~dp0backend"
echo ==========================================================
echo   SkillBridge AI Backend (FastAPI + MongoDB Atlas)
echo   API Docs: http://localhost:8000/docs
echo ==========================================================
python run.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend server stopped with error code %ERRORLEVEL%.
)
pause
