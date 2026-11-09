@echo off
setlocal
cd /d "%~dp0"
title SkillBridge AI Launcher

echo ==========================================================
echo   Starting SkillBridge AI Integrated Platform
echo   Backend API: http://localhost:8000
echo   Frontend UI: http://localhost:5173
echo ==========================================================
echo.

echo [1/2] Starting Backend Server in new window...
start "SkillBridge AI - Backend" "%~dp0start_backend.bat"

echo Waiting 3 seconds for database handshake...
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Dev Server in new window...
start "SkillBridge AI - Frontend" "%~dp0start_frontend.bat"

echo Waiting 2 seconds then opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo ==========================================================
echo   Both services are now running in separate windows!
echo   - Backend window: FastAPI + MongoDB Atlas
echo   - Frontend window: Vite dev server
echo   Keep those two windows open while using SkillBridge.
echo ==========================================================
echo.
pause
