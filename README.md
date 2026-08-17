# 🏥 SwasthyaMitra (स्वास्थ्य मित्र)

> **AI-Driven Closed-Loop Healthcare Access & Community Health Intelligence Platform**

SwasthyaMitra is an end-to-end digital health platform designed to transform public healthcare delivery by connecting patient triage, hospital booking, ASHA community follow-up, and real-time disease outbreak detection for healthcare administrators.

---

## 🌟 Key Features

### 👤 Patient & Triage Portal
- **Multilingual AI Chatbot Interface**: Supports symptom reporting, triage classification (LOW / MODERATE / URGENT), and automated slot booking.
- **OTP Session Verification**: Passwordless authentication via mobile SMS/OTP gateway integration.
- **Appointment Lifecycle Tracking**: Real-time status tracking from check-in to consultation and prescription issuance.

### 👩‍⚕️ Hospital & Slot Management
- **PHC & Hospital Directory**: Geographical radius search and facility capacity tracking.
- **Doctor Schedule Management**: Dynamic slot generation and queue optimization.
- **No-Show Tracking & Escalation**: Automatic trigger to ASHA workers when patients miss consecutive appointments.

### 🩺 ASHA Worker Workflow
- **Field Task Queue**: Automated notification of high-risk or missed-appointment patients requiring home visits.
- **Follow-up Reporting**: Field update forms capturing patient health progress and referral recommendations.

### 📊 Community Health Intelligence & Outbreak Detection
- **Zone-Level Symptom Clustering**: Statistical signal generation for potential disease outbreaks (Green / Yellow / Orange / Red alert levels).
- **Chief Medical Officer Dashboard**: Administrative review of automated health alerts and emergency response authorization (e.g., dispatching mobile medical units or holding health camps).

---

## 🏗️ Repository Architecture

```
SwasthyaMitra/
├── swasthya_mitra_app/               # Core Application Source Code
│   ├── backend/                      # Python FastAPI application
│   │   ├── app/                      # Models, Routes, Schemas, Services
│   │   ├── tests/                    # Backend test suite (pytest)
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── frontend/                     # React application
│   │   ├── src/                      # Components, Pages, Services, Context
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── database/                     # SQL schemas and seed scripts
│   ├── docker-compose.yml            # Docker orchestration configuration
│   ├── startup.bat / startup.sh      # Environment startup scripts
│   └── run_standalone.bat            # Quick execution batch script
│
├── SwasthyaMitra_Markdown/           # Project Specification & Documentation (Markdown)
│   ├── 01_SwasthyaMitra_PRD.md       # Product Requirements Document
│   ├── 02_SwasthyaMitra_SRS.md       # Software Requirements Specification
│   ├── 03_SwasthyaMitra_Architecture_TDD.md # Technical Architecture & TDD
│   ├── 04_SwasthyaMitra_AI_Safety_Spec.md    # AI Safety & Medical Disclaimer Guidelines
│   ├── 05_SwasthyaMitra_QA_Test_Plan.md      # Comprehensive QA & Test Strategy
│   ├── 06_SwasthyaMitra_MVP_Roadmap.md       # Implementation Roadmap
│   └── 07_SwasthyaMitra_5_Person_Work_Division.md # Team Role Division
│
└── SwasthyaMitra_Complete_Project_Documentation/ # Master DOCX Documentation Suite
```

---

## ⚡ Tech Stack

- **Frontend**: React, React Router, Axios, CSS3
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Pydantic, Uvicorn
- **Database**: SQLite (Local Dev Zero-Setup) / MySQL 8.0 (Production / Docker)
- **Containerization**: Docker, Docker Compose
- **SMS Gateway Integration**: Simulator, Fast2SMS (India), Twilio (Global)
- **Testing**: pytest (Backend), Jest (Frontend)

---

## 🚀 Quick Start & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Python](https://www.python.org/) (v3.9+)
- [Docker & Docker Compose](https://www.docker.com/) (Optional for containerized run)

---

### Option 1: Docker Compose (Recommended)

```bash
# Navigate to application folder
cd swasthya_mitra_app

# Copy sample environment configuration
cp .env.example .env

# Build and start all container services
docker-compose up -d --build
```
* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:8000`
* **API Documentation (Swagger)**: `http://localhost:8000/docs`

---

### Option 2: Local Development

#### 1. Backend Setup
```bash
cd swasthya_mitra_app/backend

# Create & activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy backend environment template
cp .env.example .env

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd swasthya_mitra_app/frontend

# Install dependencies
npm install

# Start React dev server
npm start
```
Access the application UI at `http://localhost:8080` or `http://localhost:3000`.

---

## 🧪 Running Tests

### Backend Unit & Integration Tests
```bash
cd swasthya_mitra_app/backend
pytest
```

### Frontend Tests
```bash
cd swasthya_mitra_app/frontend
npm test
```

---

## 📄 Documentation

For deep technical specifications, design documents, and AI safety protocols, refer to:
- [`SwasthyaMitra_Markdown/`](./SwasthyaMitra_Markdown)
- [`swasthya_mitra_app/README.md`](./swasthya_mitra_app/README.md)

---

## 🔒 Security & AI Safety

- **PII Protection**: Aggregated community analytics redact personally identifiable patient information.
- **Medical AI Safety**: AI triage suggestions include disclaimers and route urgent cases directly to healthcare professionals.
- **Credential Hygiene**: Secret keys, DB passwords, and API credentials are kept strictly out of source control using `.env` environment isolation.

---

## 📄 License

This repository is created for hackathons and internal development. All rights reserved.
