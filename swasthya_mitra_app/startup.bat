@echo off
REM SwasthyaMitra - Quick Start Script for Windows

echo.
echo 🏥 SwasthyaMitra - Platform Startup
echo ====================================
echo.

cd /d "%~dp0"

REM Check if Docker is available and running
docker ps >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ℹ️ Docker Desktop is not running or not installed.
    echo 🔄 Switching to Standalone Local Mode (Python + Node.js)...
    echo.
    call run_standalone.bat
    exit /b 0
)

echo ✅ Docker daemon detected
echo.

REM Copy environment file
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env file created (using default values)
) else (
    echo ✅ .env file already exists
)

echo.
echo 🔨 Building Docker images...
docker-compose build

echo.
echo 🚀 Starting services with Docker...
docker-compose up -d

echo.
echo ⏳ Waiting for services to be ready (10 seconds)...
timeout /t 10 /nobreak

echo.
echo 🔍 Checking service status...
docker-compose ps

echo.
echo ✅ All services are running!
echo.
echo 📱 Access Points:
echo   - Frontend: http://localhost:8080
echo   - Backend API: http://localhost:8000
echo   - API Docs: http://localhost:8000/docs
echo   - Database: localhost:3306
echo.
echo 📊 Demo Credentials:
echo   - Phone: 9876543210 (or any 10 digits)
echo.
pause
