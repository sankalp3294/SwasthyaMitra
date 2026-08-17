"""
Backend tests for Auth APIs
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

# Create test database
Base.metadata.create_all(bind=engine)

client = TestClient(app)


class TestAuthAPI:
    """Test authentication endpoints"""

    def test_request_otp(self):
        """Test OTP request"""
        response = client.post(
            "/auth/request-otp",
            json={"phone_number": "9876543210"}
        )
        assert response.status_code == 200
        assert "otp" in response.json()
        assert response.json()["status"] == "success"

    def test_verify_otp_success(self):
        """Test successful OTP verification"""
        # First request OTP
        otp_response = client.post(
            "/auth/request-otp",
            json={"phone_number": "9876543210"}
        )
        otp = otp_response.json()["otp"]

        # Then verify
        response = client.post(
            "/auth/verify-otp",
            json={
                "phone_number": "9876543210",
                "otp_code": otp
            }
        )
        assert response.status_code == 200
        assert "session_token" in response.json()
        assert response.json()["patient_id"] is not None

    def test_verify_otp_invalid(self):
        """Test invalid OTP"""
        # Request OTP first
        client.post(
            "/auth/request-otp",
            json={"phone_number": "9876543211"}
        )

        # Try wrong OTP
        response = client.post(
            "/auth/verify-otp",
            json={
                "phone_number": "9876543211",
                "otp_code": "000000"
            }
        )
        assert response.status_code == 400


class TestPatientAPI:
    """Test patient endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        # Create authenticated session
        otp_response = client.post(
            "/auth/request-otp",
            json={"phone_number": "9999900002"}
        )
        otp = otp_response.json()["otp"]
        auth_response = client.post(
            "/auth/verify-otp",
            json={
                "phone_number": "9999900002",
                "otp_code": otp
            }
        )
        self.session_token = auth_response.json()["session_token"]

    def test_get_patient_profile(self):
        """Test getting patient profile"""
        response = client.get(
            "/patients/me",
            params={"session_token": self.session_token}
        )
        assert response.status_code == 200
        assert "id" in response.json()


class TestCaseAPI:
    """Test case endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        otp_response = client.post(
            "/auth/request-otp",
            json={"phone_number": "9999900003"}
        )
        otp = otp_response.json()["otp"]
        auth_response = client.post(
            "/auth/verify-otp",
            json={
                "phone_number": "9999900003",
                "otp_code": otp
            }
        )
        self.session_token = auth_response.json()["session_token"]
        self.patient_id = auth_response.json()["patient_id"]

    def test_create_case(self):
        """Test creating a case"""
        response = client.post(
            "/cases/",
            json={
                "patient_id": self.patient_id,
                "presenting_complaint": "Fever and cough",
                "symptoms": "High fever, persistent cough",
            },
            params={"session_token": self.session_token}
        )
        assert response.status_code == 200
        assert response.json()["case_status"] == "NEW"

    def test_triage_case(self):
        """Test case triage"""
        # Create case first
        case_response = client.post(
            "/cases/",
            json={
                "patient_id": self.patient_id,
                "presenting_complaint": "Chest pain",
                "symptoms": "Severe chest pain",
            },
            params={"session_token": self.session_token}
        )
        case_id = case_response.json()["id"]

        # Triage
        response = client.post(
            f"/cases/{case_id}/triage",
            json={"case_id": case_id, "symptoms": "Chest pain"},
            params={"session_token": self.session_token}
        )
        assert response.status_code == 200
        assert "triage_level" in response.json()


class TestAppointmentAPI:
    """Test appointment endpoints"""

    def test_health_check(self):
        """Test health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert "name" in response.json()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
