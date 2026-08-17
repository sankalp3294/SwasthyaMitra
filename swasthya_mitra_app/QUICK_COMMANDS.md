# SwasthyaMitra - Quick Command Reference

## 🚀 Startup Commands

### Windows
```bash
startup.bat
```

### Linux/Mac
```bash
chmod +x startup.sh
./startup.sh
```

### Manual Docker
```bash
docker-compose up -d
```

---

## 🛑 Stop Commands

```bash
# Stop all services
docker-compose down

# Stop with volume cleanup (WARNING: deletes data)
docker-compose down -v

# Stop specific service
docker-compose stop service_name
```

---

## 📋 Service Management

```bash
# Check status
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Restart service
docker-compose restart backend

# Rebuild service
docker-compose build backend
docker-compose up -d backend
```

---

## 💾 Database Commands

```bash
# Access MySQL CLI
docker-compose exec mysql mysql -u root -p

# Execute SQL file
docker-compose exec mysql mysql -u root -p < database/init.sql

# Backup database
docker-compose exec mysql mysqldump -u root -p swasthya_mitra > backup.sql

# Restore database
docker-compose exec mysql mysql -u root -p swasthya_mitra < backup.sql

# View all tables
docker-compose exec mysql mysql -u root -p -e "USE swasthya_mitra; SHOW TABLES;"
```

---

## 🧪 Testing Commands

### Backend Tests
```bash
# Run all tests
docker-compose exec backend pytest tests/ -v

# Run specific test file
docker-compose exec backend pytest tests/test_api.py -v

# Run with coverage
docker-compose exec backend pytest --cov=app tests/

# Run specific test
docker-compose exec backend pytest tests/test_api.py::TestAuthAPI::test_request_otp -v
```

### Frontend Tests
```bash
# Run tests
docker-compose exec frontend npm test

# Run with coverage
docker-compose exec frontend npm test -- --coverage
```

---

## 📚 Code Quality

### Backend Linting
```bash
docker-compose exec backend flake8 app/

docker-compose exec backend black app/

docker-compose exec backend mypy app/
```

### Frontend Linting
```bash
docker-compose exec frontend npm run lint
```

---

## 🔍 Development/Debug

### Access Backend Shell
```bash
docker-compose exec backend python
# Or bash
docker-compose exec backend bash
```

### Access Frontend Shell
```bash
docker-compose exec frontend sh
```

### Access MySQL Shell
```bash
docker-compose exec mysql bash
```

### Interactive Python with Backend Context
```bash
docker-compose exec backend python
>>> from app.database import SessionLocal
>>> from app.models import User
>>> db = SessionLocal()
>>> users = db.query(User).all()
>>> print(users)
```

---

## 🏗️ Build & Deployment

### Build Images
```bash
# Build all
docker-compose build

# Build specific
docker-compose build backend
docker-compose build frontend

# Build without cache
docker-compose build --no-cache
```

### Push to Registry (AWS ECR example)
```bash
# Tag images
docker tag swasthya_mitra_backend:latest YOUR_ECR_URL/swasthya-backend:latest

# Push
docker push YOUR_ECR_URL/swasthya-backend:latest
```

---

## 📊 Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Backend API root
curl http://localhost:8000/

# API documentation
curl http://localhost:8000/docs

# Database connectivity
docker-compose exec backend python -c "from app.database import SessionLocal; db = SessionLocal(); print('✅ Database connected')"
```

---

## 🔧 Configuration

### View Configuration
```bash
# Show current env variables
docker-compose exec backend env | grep -E "DATABASE|SECRET|CORS"

# View .env file
cat .env
```

### Update Configuration
```bash
# Edit .env
nano .env
# or
vi .env

# Restart services for changes to take effect
docker-compose restart backend
docker-compose restart frontend
```

---

## 📦 Dependency Management

### Backend
```bash
# Add package
docker-compose exec backend pip install new-package

# Update requirements.txt
docker-compose exec backend pip freeze > backend/requirements.txt

# Install from requirements
docker-compose exec backend pip install -r requirements.txt
```

### Frontend
```bash
# Add package
docker-compose exec frontend npm install new-package

# Update packages
docker-compose exec frontend npm update

# View packages
docker-compose exec frontend npm list
```

---

## 🐛 Troubleshooting

### Clear Docker Cache & Rebuild
```bash
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### View Detailed Error Logs
```bash
docker-compose logs --timestamps service_name | tail -50
```

### Check Port Availability
```bash
# Windows
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000
```

### Inspect Container
```bash
docker-compose exec service_name ps aux
docker-compose exec service_name df -h
docker-compose exec service_name free -m
```

---

## 🔄 Useful Aliases (add to .bashrc or .zshrc)

```bash
alias swasthya-start="docker-compose up -d"
alias swasthya-stop="docker-compose down"
alias swasthya-logs="docker-compose logs -f"
alias swasthya-backend="docker-compose exec backend bash"
alias swasthya-frontend="docker-compose exec frontend sh"
alias swasthya-db="docker-compose exec mysql mysql -u root -p"
alias swasthya-test="docker-compose exec backend pytest tests/ -v"
alias swasthya-status="docker-compose ps"
```

Then use:
```bash
swasthya-start
swasthya-logs
swasthya-status
```

---

## 📋 Workflow Examples

### Add a New Backend Dependency
```bash
docker-compose exec backend pip install requests
docker-compose exec backend pip freeze > backend/requirements.txt
docker-compose down
docker-compose build backend
docker-compose up -d backend
```

### Make Frontend Changes
```bash
# Frontend has hot-reload, changes auto-apply
# Just edit frontend/src/pages/OTPLogin.js
# Changes visible at http://localhost:3000

# If needed, rebuild
docker-compose build frontend
docker-compose restart frontend
```

### Add New Database Table
```bash
# 1. Update database/init.sql
# 2. Update backend/app/models.py
# 3. Run migrations or restart

docker-compose down
docker-compose up -d
```

---

## 💾 Backup & Restore

### Backup Everything
```bash
# Backup database
docker-compose exec mysql mysqldump -u root -p swasthya_mitra > backup_$(date +%s).sql

# Backup docker volumes
docker run --rm -v mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data
```

### Restore Database
```bash
docker-compose exec mysql mysql -u root -p swasthya_mitra < backup.sql
```

---

## 🚀 Performance Monitoring

```bash
# Container stats
docker stats

# Memory usage
docker-compose exec backend free -h

# Disk usage
docker-compose exec backend df -h

# Database size
docker-compose exec mysql mysql -u root -p -e "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb FROM information_schema.TABLES WHERE table_schema = 'swasthya_mitra';"
```

---

## 📖 Documentation Links

- **00_START_HERE.md** - Main entry point
- **README.md** - Project overview
- **API_REFERENCE.md** - API documentation
- **DEVELOPMENT.md** - Development guide
- **DEPLOYMENT.md** - Deployment guide
- **FILE_INDEX.md** - File reference

---

## ⚡ One-Line Quick Commands

```bash
# Start and check status
docker-compose up -d && sleep 5 && docker-compose ps

# Test everything is working
curl http://localhost:8000/health && echo "✅ Backend OK" && curl http://localhost:3000 > /dev/null && echo "✅ Frontend OK"

# View backend logs live
docker-compose logs -f backend

# Run all tests
docker-compose exec backend pytest tests/ -v && docker-compose exec frontend npm test

# Clear everything and start fresh
docker-compose down -v && docker-compose build && docker-compose up -d
```

---

## 🆘 Emergency Commands

```bash
# Force stop all containers
docker-compose kill

# Remove all SwasthyaMitra containers
docker-compose down --remove-orphans

# Clean up disk space
docker system prune -a

# Check if port is open
telnet localhost 8000
telnet localhost:3306
```

---

**Save this file for quick reference during development!**

For detailed information, see the main documentation files.
