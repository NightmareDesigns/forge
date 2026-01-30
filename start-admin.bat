@echo off
REM CraftForge Admin License System - Windows Startup

echo Starting CraftForge Admin License System...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Check for express and cors
npm list express > nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    call npm install express cors
)

echo.
echo Starting Admin Server on http://localhost:5000
echo Dashboard: http://localhost:5000/dashboard.html
echo.
echo Admin Token: admin-master-key-2026
echo (Change this in production!)
echo.

node src\admin\AdminServer.js

pause
