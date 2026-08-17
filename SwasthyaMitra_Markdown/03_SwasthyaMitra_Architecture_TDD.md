SwasthyaMitra — System Architecture & Technical Design

Architecture + TDD | How the system is built

# 1. High-Level Architecture

Patient Web/App → API Gateway/Backend → Auth + Case Workflow + AI/NLP + Appointment + Notification + Community Analytics → MySQL/Analytics Store → Role-based dashboards.

# 2. Recommended Stack

Frontend: React or the team's strongest existing web stack; responsive CSS.

Backend: Python FastAPI (recommended) or Flask.

Database: MySQL.

Cache/queue: Redis optional.

AI/NLP: existing SIH AI foundation + LLM/NLP service + deterministic workflow rules.

Analytics: Python/pandas/scikit-learn for prototype cluster/anomaly logic.

Maps: Leaflet/OpenStreetMap or seeded hospital coordinates for prototype.

Authentication: OTP/session mock for hackathon.

Deployment: Docker + cloud VM/container or local LAN.

Version control: Git/GitHub.

Testing: pytest + API tests + frontend smoke tests.

# 3. Services

Auth Service

Conversation/AI Service

Case Management Service

Triage Service

Hospital/Slot Service

Appointment Service

ASHA Follow-up Service

Community Analytics Service

Chief Doctor Intervention Service

Notification Service

Audit Service

# 4. Data Flow

Patient message enters chat API.

AI classifies intent and extracts structured fields.

Case service stores the case and event.

Triage service returns priority.

Workflow service decides next state.

Hospital/slot service returns suitable facilities and slots.

Appointment service confirms/checks attendance.

No-show state triggers rebooking or ASHA assignment.

ASHA submits follow-up.

Community analytics consumes only authorized aggregated signals.

Chief Doctor reviews signals and records intervention.

# 5. Security Architecture

JWT/session or secure session tokens

RBAC by role

HTTPS

Server-side validation

Secrets in environment variables

Audit logging

Minimum necessary data

Separate public vs protected zone views

# 6. Failure Handling

AI unavailable → structured fallback form

Hospital slots unavailable → alternate hospital/slot message

Notification failure → dashboard remains source of truth

Analytics unavailable → no intervention generated automatically

Database failure → error state and retry; never silently create duplicate appointment
