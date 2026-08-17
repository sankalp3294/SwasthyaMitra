# API Endpoints Documentation

## Base URL
- Local: `http://localhost:8000`
- Docker: `http://backend:8000`

## Authentication Endpoints

### Request OTP
```
POST /auth/request-otp
Content-Type: application/json

{
  "phone_number": "9876543210"
}

Response:
{
  "status": "success",
  "message": "OTP sent successfully",
  "otp": "123456",  # Demo only, remove in production
  "expires_in_minutes": 5
}
```

### Verify OTP
```
POST /auth/verify-otp
Content-Type: application/json

{
  "phone_number": "9876543210",
  "otp_code": "123456"
}

Response:
{
  "session_token": "token_string",
  "expires_at": "2024-01-15T12:00:00",
  "patient_id": 1
}
```

### Logout
```
POST /auth/logout?session_token=token_string
```

## Patient Endpoints

### Get Current Patient Profile
```
GET /patients/me?session_token=token_string

Response:
{
  "id": 1,
  "name": "Patient Name",
  "age": 45,
  "gender": "M",
  "language_preference": "en",
  "location": "Central",
  "phone_number": "9876543210",
  "created_at": "2024-01-01T00:00:00"
}
```

### Update Patient Profile
```
PUT /patients/me?session_token=token_string
Content-Type: application/json

{
  "name": "Updated Name",
  "age": 46,
  "language_preference": "hi"
}
```

## Case Management Endpoints

### Create Case
```
POST /cases/?session_token=token_string
Content-Type: application/json

{
  "patient_id": 1,
  "presenting_complaint": "Fever and cough",
  "symptoms": "High fever, persistent cough",
  "duration": "3 days",
  "severity": "moderate"
}

Response:
{
  "id": 1,
  "patient_id": 1,
  "case_status": "NEW",
  "triage_level": null,
  "created_at": "2024-01-15T10:00:00"
}
```

### Get Case Details
```
GET /cases/{case_id}?session_token=token_string
```

### Get All Patient Cases
```
GET /cases/patient/all?session_token=token_string
```

### Perform Triage
```
POST /cases/{case_id}/triage
Content-Type: application/json

{
  "case_id": 1,
  "symptoms": "Chest pain, difficulty breathing"
}

Response:
{
  "triage_level": "URGENT",
  "reasoning": "Potentially serious warning signs detected",
  "recommendations": [
    "Seek immediate medical attention",
    "Call ambulance if necessary",
    "Go to emergency department"
  ]
}
```

## Hospital Endpoints

### List All Hospitals
```
GET /hospitals/
```

### Search Hospitals by Location
```
POST /hospitals/search
Content-Type: application/json

{
  "latitude": 28.7041,
  "longitude": 77.1025,
  "radius_km": 10,
  "triage_level": "URGENT"
}

Response:
{
  "hospitals": [...],
  "nearest_distance_km": 2.5
}
```

### Get Hospital Details
```
GET /hospitals/{hospital_id}
```

### Get Available Slots
```
GET /hospitals/{hospital_id}/slots?date=2024-01-20

Response:
{
  "hospital_id": 1,
  "slots": [
    {
      "id": 1,
      "date": "2024-01-20",
      "start_time": "09:00",
      "end_time": "10:00",
      "available_count": 5
    }
  ]
}
```

## Appointment Endpoints

### Create Appointment
```
POST /appointments/?session_token=token_string
Content-Type: application/json

{
  "case_id": 1,
  "patient_id": 1,
  "hospital_id": 1,
  "slot_id": 1
}

Response:
{
  "id": 1,
  "appointment_status": "REQUESTED",
  "appointment_date": "2024-01-20",
  "appointment_time": "09:00",
  "no_show_count": 0
}
```

### Confirm Appointment
```
POST /appointments/{appointment_id}/confirm
```

### Check-In
```
POST /appointments/{appointment_id}/check-in
```

### Mark No-Show
```
POST /appointments/{appointment_id}/no-show
```

### Rebook After No-Show
```
POST /appointments/{appointment_id}/rebook
Content-Type: application/json

{
  "new_slot_id": 2
}
```

## Analytics Endpoints

### Get All Zones
```
GET /analytics/zones

Response:
{
  "zones": ["Central", "North", "South", "East", "West"]
}
```

### Get Zone Signals
```
GET /analytics/zones/{zone}/signals

Response:
{
  "zone": "Central",
  "signals": [...],
  "critical_count": 2
}
```

### Get Zone Analytics
```
GET /analytics/zones/{zone}/analytics

Response:
{
  "zone": "Central",
  "total_cases": 15,
  "critical_signals": [...],
  "overall_risk": "ORANGE"
}
```

### Run Anomaly Detection
```
POST /analytics/signals/detect

Response:
{
  "status": "success",
  "signals_created": 3,
  "message": "Detected anomalies and created 3 signals"
}
```

## ASHA Endpoints

### Get ASHA Assignments
```
GET /asha/assignments
```

### Submit Follow-up
```
POST /asha/assignments/{assignment_id}/submit-followup
Content-Type: application/json

{
  "notes": "Patient visited, status is improving",
  "outcome": "VISITED"
}
```

## Dashboard Endpoints

### Get System Statistics
```
GET /dashboards/stats

Response:
{
  "total_patients": 25,
  "total_cases": 30,
  "pending_appointments": 5,
  "attended_appointments": 20,
  "critical_cases": 2,
  "asha_assignments_pending": 3
}
```

### Get Hospital Dashboard
```
GET /dashboards/hospital/{hospital_id}

Response:
{
  "cases_queue": [...],
  "today_appointments": [...],
  "asha_assignments": [...],
  "stats": {...}
}
```

### Get Chief Doctor Dashboard
```
GET /dashboards/chief-doctor

Response:
{
  "critical_signals": [...],
  "zones_at_risk": {...},
  "pending_interventions": [...],
  "total_zones_monitoring": 3
}
```

## Health & Status

### Health Check
```
GET /health

Response:
{
  "status": "healthy",
  "app": "SwasthyaMitra",
  "version": "0.1.0"
}
```

### Root Endpoint
```
GET /

Response:
{
  "name": "SwasthyaMitra",
  "version": "0.1.0",
  "status": "running",
  "docs": "/docs",
  "redoc": "/redoc"
}
```

## Error Responses

All errors follow this format:

```
{
  "detail": "Error message",
  "error": "error_code"
}
```

Common Status Codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Example Workflow

### 1. Patient Registration & Login
```bash
# Request OTP
curl -X POST http://localhost:8000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "9876543210"}'

# Verify OTP (use OTP from response)
curl -X POST http://localhost:8000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "9876543210", "otp_code": "123456"}'
```

### 2. Create Health Case
```bash
curl -X POST "http://localhost:8000/cases/?session_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "presenting_complaint": "Fever",
    "symptoms": "High fever"
  }'
```

### 3. Perform Triage
```bash
curl -X POST http://localhost:8000/cases/1/triage \
  -H "Content-Type: application/json" \
  -d '{"case_id": 1, "symptoms": "High fever"}'
```

### 4. Find and Book Hospital
```bash
# Search hospitals
curl -X POST http://localhost:8000/hospitals/search \
  -H "Content-Type: application/json" \
  -d '{"latitude": 28.7041, "longitude": 77.1025, "radius_km": 10}'

# Get slots
curl http://localhost:8000/hospitals/1/slots

# Book appointment
curl -X POST "http://localhost:8000/appointments/?session_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": 1,
    "patient_id": 1,
    "hospital_id": 1,
    "slot_id": 1
  }'
```

## Rate Limiting

Currently not implemented. Should be added for production.

## Authentication

All endpoints requiring authentication use query parameter:
```
?session_token=YOUR_SESSION_TOKEN
```

Alternatively, implement Bearer token header:
```
Authorization: Bearer YOUR_SESSION_TOKEN
```
