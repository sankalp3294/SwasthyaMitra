# Development Guide

## Prerequisites

- Docker & Docker Compose
- Git
- Node.js 16+ (for frontend development)
- Python 3.9+ (for backend development)
- MySQL Client (optional)

## Quick Start with Docker

### 1. Clone and Setup

```bash
cd swasthya_mitra_app
cp .env.example .env
```

### 2. Start Services

```bash
docker-compose up -d
```

### 3. Initialize Database

```bash
docker-compose exec backend python -m alembic upgrade head
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MySQL: localhost:3306

## Local Development

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp ../.env.example .env

# Start server with auto-reload
uvicorn app.main:app --reload --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Database Management

### Access MySQL

```bash
docker-compose exec mysql mysql -u swasthya_user -pswasthya_password swasthya_mitra
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
pytest tests/test_api.py -v -s
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Code Quality

### Backend Linting

```bash
cd backend
flake8 app/
black app/ --check
isort app/ --check
mypy app/
```

### Frontend Linting

```bash
cd frontend
npm run lint  # If configured
```

## Common Issues

### Database Connection Error

**Problem**: "Can't connect to MySQL server"

**Solution**:
```bash
# Make sure MySQL is running
docker-compose ps mysql

# Check logs
docker-compose logs mysql

# Restart service
docker-compose restart mysql
```

### Port Already in Use

**Problem**: "Address already in use"

**Solution**:
1. Kill existing process on port
2. Or change port in `docker-compose.yml` and `.env`

### Frontend Can't Connect to Backend

**Problem**: API requests fail

**Solution**:
1. Check `.env` file has correct `REACT_APP_API_URL`
2. Ensure backend is running: `docker-compose ps backend`
3. Check CORS configuration in backend

## Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/feature-name
```

### 2. Make Changes

- Backend: Modify API in `backend/app/api/routes/`
- Frontend: Add components in `frontend/src/pages/`

### 3. Test Changes

```bash
# Backend
pytest backend/tests/

# Frontend
npm test
```

### 4. Commit

```bash
git add .
git commit -m "Add feature description"
```

### 5. Push

```bash
git push origin feature/feature-name
```

## Database Migrations

### Create Migration

```bash
cd backend
alembic revision --autogenerate -m "Add new table"
```

### Apply Migrations

```bash
alembic upgrade head
```

### Rollback

```bash
alembic downgrade -1
```

## Performance Monitoring

### Database Queries

Check slow queries:
```sql
SET GLOBAL slow_query_log = 'ON';
SELECT * FROM mysql.slow_log;
```

### API Performance

Use the `/docs` endpoint to test APIs and check response times.

## Security Checklist

- [ ] Update `SECRET_KEY` in `.env`
- [ ] Use strong database password
- [ ] Enable HTTPS in production
- [ ] Validate all user inputs
- [ ] Keep dependencies updated
- [ ] Review audit logs regularly
- [ ] Test RBAC implementation

## Deployment Checklist

- [ ] Update all environment variables
- [ ] Run database migrations
- [ ] Build Docker images
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL certificates
- [ ] Configure backups
- [ ] Set up monitoring and logging
- [ ] Test failover procedures

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f service-name`
2. Review `.env` configuration
3. Check API documentation at `/docs`
4. Consult team documentation
