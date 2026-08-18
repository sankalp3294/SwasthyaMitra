@echo off
REM SwasthyaMitra - Standalone Local Start Script (No Docker Required)

echo.
echo ===================================================
echo 🏥 SwasthyaMitra - Local Development Launcher
echo ===================================================
echo.

cd /d "%~dp0"

REM 1. Verify Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python is not installed or not in PATH.
    pause
    exit /b 1
)
echo ✅ Python found

REM 2. Verify Node / npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js / npm is not installed or not in PATH.
    pause
    exit /b 1
)
echo ✅ Node / npm found

echo.
echo 📦 Initializing database...
python -c "import sys; sys.path.insert(0, './backend'); from app.database import engine, Base, SessionLocal; from app.seed import seed_demo_data; Base.metadata.create_all(bind=engine); db = SessionLocal(); seed_demo_data(db); db.close(); print('SQLite Database ready!')"

echo.
echo 🚀 Launching Backend API Server (FastAPI on port 8000)...
start "SwasthyaMitra Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --port 8000 --reload"

echo.
echo 🚀 Launching Frontend UI (React on port 8080)...
start "SwasthyaMitra Frontend" cmd /k "cd /d %~dp0frontend && python -m http.server 8080 --directory build"

echo.
echo ===================================================
echo 🎉 SwasthyaMitra is starting up!
echo ===================================================
echo   - Frontend UI:  http://localhost:8080
echo   - Backend API:  http://localhost:8000
echo   - API Docs:     http://localhost:8000/docs
echo.
echo   Demo Login Phone: 9876543210 (or any 10 digits)
echo ===================================================
echo.
pause
