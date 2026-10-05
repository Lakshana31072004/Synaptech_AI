@echo off
echo ===================================================
echo Starting Synaptech AI Platform Services
echo ===================================================

echo [1/3] Starting Python AI Microservice (Port 5000)...
start "Synaptech AI Engine (Port 5000)" cmd /k "cd /d "%~dp0ai-services" && python -m uvicorn app:app --host 0.0.0.0 --port 5000"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Spring Boot Backend (Port 8081)...
start "Synaptech Backend (Port 8081)" cmd /k "cd /d "%~dp0" && java -jar target\snaptech-backend-0.0.1-SNAPSHOT.jar"

timeout /t 5 /nobreak >nul

echo [3/3] Starting React Frontend (Port 3000)...
start "Synaptech React Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm.cmd start"

echo ===================================================
echo All services launched!
echo - Frontend UI:          http://localhost:3000
echo - Spring Boot Backend:  http://localhost:8081/actuator/health
echo - H2 Database Console:  http://localhost:8081/h2-console
echo - AI Engine API:        http://localhost:5000/health
echo ===================================================
pause

