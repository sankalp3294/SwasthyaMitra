import json
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # App
    app_name: str = "SwasthyaMitra"
    app_version: str = "0.1.0"
    debug: bool = True
    secret_key: str = "your-super-secret-key-change-in-production"
    
    # Database
    # SQLite makes the project usable immediately after checkout. Production
    # deployments should set DATABASE_URL to a managed MySQL/PostgreSQL URL.
    database_url: str = "sqlite:///./swasthya_mitra.db"
    
    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_reload: bool = True
    
    # Redis
    redis_url: Optional[str] = "redis://localhost:6379/0"
    
    # CORS
    cors_origins: str = "http://localhost:8080,http://localhost:3000,http://localhost:8000"
    
    # Logging
    log_level: str = "INFO"
    
    # OTP
    otp_expiry_minutes: int = 5
    max_otp_attempts: int = 3
    
    # AI/NLP
    ai_service_timeout: int = 30
    intent_classification_threshold: float = 0.7
    
    # Analytics
    analytics_enabled: bool = True
    cluster_detection_enabled: bool = True
    zone_baseline_period_days: int = 30
    
    # Hospital
    default_hospital_search_radius_km: float = 10
    
    # ASHA
    asha_escalation_after_no_show: int = 2

    # SMS Gateway & Notifications
    sms_enabled: bool = True
    sms_provider: str = "simulator"  # "simulator", "twilio", or "fast2sms"
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    fast2sms_api_key: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings"""
    return Settings()
