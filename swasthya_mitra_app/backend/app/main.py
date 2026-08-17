"""
Main FastAPI application
"""
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.database import engine, Base
from app.database import SessionLocal
from app.seed import seed_demo_data
from app.api.routes import auth, patients, cases, appointments, hospitals, analytics, asha, dashboards, medications, notifications


def parse_cors_origins(raw_value):
    if raw_value is None or raw_value == "":
        return ["http://localhost:3000", "http://localhost:8080", "http://localhost:8000"]

    if isinstance(raw_value, list):
        return raw_value

    if isinstance(raw_value, str):
        value = raw_value.strip()
        if not value:
            return ["http://localhost:3000", "http://localhost:8080", "http://localhost:8000"]
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
        except (TypeError, ValueError):
            pass
        return [item.strip() for item in value.split(",") if item.strip()]

    return [str(raw_value)]

settings = get_settings()
# Keep imports and test clients usable without requiring an ASGI lifespan run.
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    print(f"Starting {settings.app_name} v{settings.app_version}")
    yield
    print(f"Shutting down {settings.app_name}")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-Driven Public Health Healthcare Access & Community Health Intelligence Platform",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Trusted Host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.localhost", "testserver"]
)


# Include routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(cases.router)
app.include_router(appointments.router)
app.include_router(hospitals.router)
app.include_router(analytics.router)
app.include_router(asha.router)
app.include_router(dashboards.router)
app.include_router(medications.router)
app.include_router(notifications.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.backend_host, port=settings.backend_port)
