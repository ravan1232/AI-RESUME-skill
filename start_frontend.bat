@echo off
title SkillBridge AI - Frontend Dev Server
cd /d "%~dp0frontend"
echo ==========================================================
echo   SkillBridge AI Frontend (Vite + React)
echo   Local URL: http://localhost:5173
echo ==========================================================
call npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Frontend dev server stopped with error code %ERRORLEVEL%.
)
pause
