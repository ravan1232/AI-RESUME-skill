@echo off
title SkillBridge AI - Backend API Server
cd /d "%~dp0backend"
echo ===================================================
echo   SkillBridge AI Backend (FastAPI + MongoDB Atlas)
echo ===================================================
set PYTHONPATH=.
python run.py
pause

