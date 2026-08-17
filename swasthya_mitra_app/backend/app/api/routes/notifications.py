"""
Notifications & SMS Gateway API routes
"""
from fastapi import APIRouter, Depends
from typing import List, Dict
from app.services.sms_service import SMSService
from app.models import User
from app.api.deps import require_roles

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/sms-logs")
async def get_sms_logs(
    _staff: User = Depends(require_roles("admin", "chief_doctor", "doctor", "asha")),
) -> Dict:
    """
    Get audit history of all dispatched SMS notifications (Twilio, Fast2SMS, or Simulator)
    """
    logs = SMSService.get_audit_logs()
    return {
        "status": "success",
        "total_sms_sent": len(logs),
        "sms_logs": logs
    }
