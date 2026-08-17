"""
Backend startup and configuration tests
"""
import pytest
from sqlalchemy import text
from app.config import get_settings
from app.database import SessionLocal, Base, engine


class TestConfiguration:
    """Test configuration and initialization"""

    def test_settings_loaded(self):
        """Test that settings are loaded correctly"""
        settings = get_settings()
        assert settings.app_name == "SwasthyaMitra"
        assert settings.backend_host == "0.0.0.0"
        assert settings.backend_port == 8000

    def test_database_connection(self):
        """Test database connection"""
        db = SessionLocal()
        try:
            # Try to execute a simple query
            result = db.execute(text("SELECT 1"))
            assert result is not None
        finally:
            db.close()

    def test_cors_configuration(self):
        """Test CORS settings"""
        settings = get_settings()
        assert "http://localhost:3000" in settings.cors_origins


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
