"""
SwasthyaMitra External SMS & Notification Service Module
Supports Production SMS Gateways (Twilio, Fast2SMS) and Local SMS Simulator mode.
"""
import logging
import urllib.parse
import urllib.request
import base64
import json
from datetime import datetime
from typing import List, Dict, Optional
from app.config import get_settings

logger = logging.getLogger("swasthya_mitra.sms")

# In-memory SMS Audit Log Buffer for verification & reporting
SMS_AUDIT_LOGS: List[Dict] = []


class SMSService:
    """External SMS Gateway Handler"""

    @staticmethod
    def send_sms(phone_number: str, message: str, template_type: str = "GENERAL") -> Dict:
        """
        Send SMS notification via configured provider (Twilio, Fast2SMS, or Simulator)
        """
        settings = get_settings()
        clean_phone = phone_number.replace(" ", "").replace("-", "")
        if not clean_phone.startswith("+") and len(clean_phone) == 10:
            clean_phone = f"+91{clean_phone}"

        timestamp = datetime.utcnow().isoformat()
        log_entry = {
            "id": len(SMS_AUDIT_LOGS) + 1,
            "recipient": clean_phone,
            "message": message,
            "template": template_type,
            "status": "SENT",
            "provider": settings.sms_provider,
            "timestamp": timestamp
        }

        # Provider 1: Twilio SMS Gateway
        if settings.sms_provider.lower() == "twilio" and settings.twilio_account_sid and settings.twilio_auth_token:
            try:
                account_sid = settings.twilio_account_sid
                auth_token = settings.twilio_auth_token
                from_phone = settings.twilio_phone_number or "+15005550006"

                url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
                data = urllib.parse.urlencode({
                    "From": from_phone,
                    "To": clean_phone,
                    "Body": message
                }).encode("utf-8")

                auth_header = base64.b64encode(f"{account_sid}:{auth_token}".encode()).decode()
                req = urllib.request.Request(url, data=data, method="POST")
                req.add_header("Authorization", f"Basic {auth_header}")

                with urllib.request.urlopen(req) as response:
                    res_body = json.loads(response.read().decode())
                    log_entry["provider_sid"] = res_body.get("sid")
                    log_entry["status"] = "DELIVERED"
                    logger.info(f"📱 [Twilio SMS Delivered] To: {clean_phone} | SID: {res_body.get('sid')}")
            except Exception as e:
                logger.error(f"❌ [Twilio SMS Error]: {e}")
                log_entry["status"] = f"FAILED: {str(e)}"
                log_entry["provider"] = "simulator_fallback"

        # Provider 2: Fast2SMS (Indian Gateway)
        elif settings.sms_provider.lower() == "fast2sms" and settings.fast2sms_api_key and settings.fast2sms_api_key != "your_fast2sms_api_key_here":
            try:
                raw_digits = clean_phone.replace("+91", "").replace("+", "").strip()
                params = urllib.parse.urlencode({
                    "authorization": settings.fast2sms_api_key.strip(),
                    "route": "q",
                    "message": message,
                    "language": "english",
                    "flash": "0",
                    "numbers": raw_digits
                })
                url = f"https://www.fast2sms.com/dev/bulkV2?{params}"
                req = urllib.request.Request(url, method="GET")
                req.add_header("User-Agent", "Mozilla/5.0")

                with urllib.request.urlopen(req) as response:
                    res_body = json.loads(response.read().decode())
                    if res_body.get("return"):
                        log_entry["status"] = "DELIVERED"
                        log_entry["fast2sms_msg"] = res_body.get("message")
                        logger.info(f"📱 [Fast2SMS Delivered] To: {clean_phone}")
                    else:
                        log_entry["status"] = f"FAST2SMS_NOTICE: {res_body.get('message')}"
                        logger.warning(f"⚠️ [Fast2SMS Warning]: {res_body}")
            except urllib.error.HTTPError as e:
                try:
                    err_json = json.loads(e.read().decode())
                    msg = err_json.get("message") or str(err_json)
                except Exception:
                    msg = f"HTTP {e.code} Error"
                logger.error(f"❌ [Fast2SMS Account Notice]: {msg}")
                log_entry["status"] = f"FAST2SMS NOTICE: {msg}"
            except Exception as e:
                logger.error(f"❌ [Fast2SMS Error]: {e}")
                log_entry["status"] = f"FAILED: {str(e)}"

        # Default / Simulator Mode (Log formatted SMS message)
        else:
            log_entry["status"] = "DELIVERED (SIMULATED)"
            logger.info(
                f"\n===================================================\n"
                f"📱 [SMS SIMULATOR DISPATCH]\n"
                f"Recipient: {clean_phone}\n"
                f"Template:  {template_type}\n"
                f"Message:   {message}\n"
                f"Timestamp: {timestamp}\n"
                f"==================================================="
            )

        SMS_AUDIT_LOGS.append(log_entry)
        return log_entry

    @classmethod
    def send_otp_sms(cls, phone_number: str, otp_code: str) -> Dict:
        """Send OTP verification code via SMS"""
        msg = f"[SwasthyaMitra] Your health portal verification OTP is: {otp_code}. Valid for 5 minutes. Do not share with anyone."
        return cls.send_sms(phone_number, msg, template_type="OTP_VERIFICATION")

    @classmethod
    def send_appointment_sms(cls, phone_number: str, hospital_name: str, appt_date: str, appt_time: str) -> Dict:
        """Send appointment confirmation SMS"""
        msg = f"[SwasthyaMitra] Your OPD doctor appointment at {hospital_name} is CONFIRMED for {appt_date} at {appt_time}. Please arrive 15 mins early."
        return cls.send_sms(phone_number, msg, template_type="APPOINTMENT_CONFIRMED")

    @classmethod
    def send_rebook_sms(cls, phone_number: str, new_date: str, new_time: str) -> Dict:
        """Send appointment rebooking SMS"""
        msg = f"[SwasthyaMitra] Your missed appointment has been REBOOKED for {new_date} at {new_time}. Contact PHC if you need to reschedule."
        return cls.send_sms(phone_number, msg, template_type="APPOINTMENT_REBOOKED")

    @classmethod
    def send_asha_dispatch_sms(cls, asha_phone: str, asha_name: str, patient_ref: str, instructions: str) -> Dict:
        """Send urgent field visit dispatch SMS to ASHA worker"""
        msg = f"[SwasthyaMitra Urgent Dispatch] Hello {asha_name}, Doctor assigned a household visit for Patient #{patient_ref}. Orders: {instructions[:100]}."
        return cls.send_sms(asha_phone, msg, template_type="ASHA_DISPATCH_ALERT")

    @staticmethod
    def get_audit_logs() -> List[Dict]:
        """Return history of all sent SMS notifications"""
        return SMS_AUDIT_LOGS
