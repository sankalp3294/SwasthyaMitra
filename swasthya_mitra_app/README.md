# SwasthyaMitra - AI-Driven Public Health Platform

A closed-loop healthcare-access and community-health intelligence platform built as a hackathon MVP.

## Project Overview

SwasthyaMitra is an upgrade of the original SIH AI chatbot that combines:
- **Individual Care Coordination**: Patient intake → AI triage → Hospital booking → Appointment management → ASHA follow-up
- **Community Health Intelligence**: Aggregated symptom analysis → Zone-level cluster detection → Chief Doctor review → Authorized interventions

## Tech Stack

- **Frontend**: React + React Router + Axios
- **Backend**: Python FastAPI + SQLAlchemy + Pydantic
- **Database**: SQLite for zero-setup local development; MySQL for Docker/production deployments
- **Containerization**: Docker + Docker Compose
- **Testing**: pytest, Jest
- **Authentication**: OTP/Session (hackathon phase)

## Project Structure

```
swasthya_mitra_app/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py            # App entry point
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # Database connection
│   │   ├── api/
│   │   │   ├── routes/        # API endpoints by module
│   │   │   └── deps.py        # Dependencies
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   └── core/              # Core utilities (auth, security)
│   ├── tests/                 # Test files
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   # React application
│   ├── public/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── hooks/             # Custom hooks
│   │   ├── context/           # Context API
│   │   ├── styles/            # CSS/SCSS
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
│
├── database/
│   ├── init.sql               # Database schema
│   └── seeds.sql              # Seeded data (hospitals, doctors, etc.)
│
├── docker-compose.yml         # Docker orchestration
├── .env.example               # Environment template
└── docs/                      # Documentation

```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 16+ (for local frontend development)
- Python 3.9+ (for local backend development)

### Using Docker Compose (Recommended)

```bash
# Copy environment file
cp .env.example .env

# Build and start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend alembic upgrade head

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# With no DATABASE_URL set, a local SQLite database and demo appointment slots
# are created automatically on first start.
python -m uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Key Features (MVP)

### Patient Interface
- [x] OTP-based session verification
- [x] Multilingual chat interface
- [x] Symptom reporting
- [x] Appointment booking
- [x] Appointment status tracking

### AI/NLP Engine
- [x] Intent classification
- [x] Symptom extraction
- [x] Structured case creation
- [x] Basic triage (LOW/MODERATE/URGENT)

### Hospital Management
- [x] Hospital/PHC selection
- [x] Doctor assignment
- [x] Appointment slot management
- [x] Check-in verification
- [x] No-show tracking

### ASHA Workflow
- [x] Automatic escalation on 2nd no-show
- [x] Follow-up form submission
- [x] Outcome tracking

### Community Analytics
- [x] Zone-level symptom aggregation
- [x] Cluster detection
- [x] Risk signal generation (Green/Yellow/Orange/Red)

### Chief Doctor Dashboard
- [x] Signal review
- [x] Intervention decision recording
- [x] Health camp management

## Database Schema

See `database/init.sql` for the complete schema.

### Main Tables
- `patients` - Patient profiles
- `cases` - Patient cases/visits
- `appointments` - Appointment records
- `hospitals` - Government hospitals
- `departments` - Hospital departments
- `slots` - Available appointment slots
- `asha_assignments` - ASHA worker assignments
- `community_signals` - Analytics signals
- `interventions` - Chief Doctor interventions
- `audit_logs` - Activity audit trail

## Security & Privacy

- Role-based access control (RBAC)
- OTP/session-based authentication
- Aggregated community data (no PII on public views)
- HTTPS enforcement
- Server-side validation
- Audit logging for sensitive operations

## Testing

```bash
# Backend tests
cd backend
pytest tests/

# Frontend tests
cd frontend
npm test
```

## Deployment

### Docker Deployment
```bash
docker-compose -f docker-compose.yml up -d
```

### Cloud Deployment (e.g., AWS, GCP, Azure)
1. Build images: `docker build`
2. Push to registry
3. Deploy using orchestration (K8s, ECS, etc.)

## Development Workflow

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes
3. Run tests: `pytest` & `npm test`
4. Commit: `git commit -m "message"`
5. Push: `git push origin feature/feature-name`
6. Create Pull Request

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running: `docker-compose ps mysql`
- Check credentials in `.env`
- Verify network: `docker network ls`

### Frontend/Backend API Issues
- Check CORS configuration
- Verify API endpoint in frontend config
- Check backend logs: `docker-compose logs backend`

### Port Conflicts
- Modify ports in `docker-compose.yml` and `.env`
- Check running services: `docker ps`

## Documentation

- Product Requirements: See `SwasthyaMitra_Markdown/01_SwasthyaMitra_PRD.md`
- System Architecture: See `SwasthyaMitra_Markdown/03_SwasthyaMitra_Architecture_TDD.md`
- Requirements Spec: See `SwasthyaMitra_Markdown/02_SwasthyaMitra_SRS.md`

## Team & Roles

See `SwasthyaMitra_Markdown/07_SwasthyaMitra_5_Person_Work_Division.md`

## License

Hackathon Project - Internal Use

## Contact

For questions or issues, contact the team lead.
