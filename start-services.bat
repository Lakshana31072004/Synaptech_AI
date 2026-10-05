@echo off
echo ===================================================
echo Starting Synaptech AI Platform (Firebase Serverless)
echo ===================================================

echo [1/2] Starting Python AI Microservice (Port 5000)...
start "Synaptech AI Engine (Port 5000)" cmd /k "cd /d "%~dp0ai-services" && python -m uvicorn app:app --host 0.0.0.0 --port 5000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Frontend (Port 3000)...
start "Synaptech React Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm.cmd start"

echo ===================================================
echo Platform launched successfully!
echo - Frontend UI:        http://localhost:3000
echo - Cloud Database:      Google Cloud Firestore (synaptech-ai)
echo - AI Engine API:      http://localhost:5000/health
echo ===================================================
pause

