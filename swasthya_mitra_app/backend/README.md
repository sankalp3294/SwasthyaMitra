# Backend - FastAPI Application

The FastAPI backend for SwasthyaMitra platform.

## Technologies
- Python 3.9+
- FastAPI
- SQLAlchemy ORM
- MySQL Database
- Pydantic for validation

## Project Structure

```
app/
├── main.py              # FastAPI app entry point
├── config.py            # Configuration settings
├── database.py          # Database setup
├── models.py            # SQLAlchemy models
├── schemas.py           # Pydantic schemas
├── api/
│   ├── deps.py          # Dependency injection
│   └── routes/          # API route modules
│       ├── auth.py      # Authentication
│       ├── patients.py  # Patient management
│       ├── cases.py     # Case management
│       ├── appointments.py
│       ├── hospitals.py
│       ├── analytics.py
│       ├── asha.py
│       └── dashboards.py
├── utils/               # Utility functions
│   ├── triage.py        # Triage assessment
│   └── analytics.py     # Analytics & clustering
└── tests/               # Test files
```

## Installation

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Docker

```bash
docker-compose up -d backend
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Initialization

The database is automatically initialized when the Docker container starts using `init.sql` and `seeds.sql`.

For local development:
```bash
mysql -u root -p < database/init.sql
mysql -u root -p swasthya_mitra < database/seeds.sql
```

## Testing

```bash
pytest tests/ -v
```

## Key Features Implemented

### Authentication
- OTP-based login/verification
- Session token management
- Role-based access control

### Patient Management
- Patient registration
- Profile management
- Case creation and tracking
- Appointment booking and management

### Clinical Workflow
- AI-assisted triage (LOW/MODERATE/URGENT)
- Appointment scheduling
- No-show handling and rebooking
- ASHA worker escalation

### Community Health
- Zone-level symptom aggregation
- Anomaly detection and clustering
- Risk signal generation (GREEN/YELLOW/ORANGE/RED)
- Chief Doctor decision support

### Administrative
- Hospital management
- Doctor and department management
- Slot management
- Audit logging

## Deployment

See main [README.md](../README.md) for full deployment instructions.
