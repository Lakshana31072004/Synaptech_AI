@echo off
echo ===================================================
echo Stopping Synaptech Platform Services...
echo ===================================================

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 "') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 "') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8081 "') do taskkill /f /pid %%a 2>nul

echo All services stopped.
pause
