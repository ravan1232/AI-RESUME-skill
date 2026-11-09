@echo off
title SkillBridge AI Launcher
echo ==========================================================
echo   Starting SkillBridge AI Integrated Platform
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo ==========================================================
echo.
echo [1/2] Starting Backend API Server...
start "SkillBridge AI - Backend" cmd /k "cd /d "%~dp0backend" && set PYTHONPATH=. && python run.py"

echo [2/2] Waiting 3 seconds for database handshake...
timeout /t 3 /nobreak >nul

echo Starting Frontend Dev Server...
start "SkillBridge AI - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Waiting 2 seconds then opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo Done! Both services are running in separate terminal windows.
echo To stop them, simply close their respective terminal windows.

