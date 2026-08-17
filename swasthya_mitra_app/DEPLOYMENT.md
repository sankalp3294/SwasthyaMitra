# Deployment Guide

## Prerequisites

- Docker & Docker Compose installed
- Git
- Domain name (for production)
- SSL certificates (for production)
- Cloud provider account (AWS, GCP, Azure, or self-hosted)

## Docker Deployment (Recommended)

### 1. Prepare Environment

```bash
# Clone repository
git clone <repo-url> swasthya_mitra_app
cd swasthya_mitra_app

# Copy and configure environment
cp .env.example .env

# Edit .env with your settings
nano .env
```

### 2. Build Images

```bash
# Build all services
docker-compose build

# Or build specific service
docker-compose build backend
docker-compose build frontend
```

### 3. Start Services

```bash
# Start in background
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose exec backend python -m alembic upgrade head

# Seed data (if needed)
docker-compose exec mysql mysql -u swasthya_user -pswasthya_password swasthya_mitra < database/seeds.sql
```

### 5. Verify Deployment

```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:8000/health

# API Docs
curl http://localhost:8000/docs
```

## AWS Deployment

### Option 1: ECS with CloudFormation

```bash
# Create ECR repositories
aws ecr create-repository --repository-name swasthya-backend
aws ecr create-repository --repository-name swasthya-frontend

# Push images
docker tag swasthya_mitra_backend:latest YOUR_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/swasthya-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/swasthya-backend:latest
```

### Option 2: EC2 + Docker

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Docker
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo systemctl start docker

# Clone repository
git clone <repo-url>
cd swasthya_mitra_app

# Configure environment
cp .env.example .env
# Edit .env with production values

# Start services
docker-compose up -d
```

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl create namespace swasthya
```

### 2. Create Secrets

```bash
kubectl create secret generic db-credentials \
  --from-literal=password=YOUR_DB_PASSWORD \
  -n swasthya

kubectl create secret generic api-keys \
  --from-literal=secret-key=YOUR_SECRET_KEY \
  -n swasthya
```

### 3. Deploy Services

```bash
# Create deployment files and apply
kubectl apply -f k8s/
```

## Production Configuration

### 1. Environment Variables

Update `.env` for production:

```env
# Security
DEBUG=false
SECRET_KEY=your-production-secret-key-min-32-chars

# Database
DATABASE_URL=mysql+pymysql://user:password@prod-db-host:3306/swasthya_mitra
MYSQL_HOST=prod-db-host
MYSQL_PORT=3306

# API
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com

# Logging
LOG_LEVEL=INFO

# Features
ANALYTICS_ENABLED=true
CLUSTER_DETECTION_ENABLED=true

# Email/SMS (if implemented)
SMS_PROVIDER_API_KEY=your-api-key
NOTIFICATION_SERVICE_URL=https://notification-service.com
```

### 2. SSL/TLS Configuration

#### Using Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

#### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Database Backup

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/mysql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mysqldump -u root -p$MYSQL_PASSWORD swasthya_mitra | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /scripts/backup.sh
```

### 4. Monitoring & Logging

#### Application Monitoring

```bash
# Install monitoring agent (e.g., Datadog, New Relic)
# Or use open-source stack: Prometheus + Grafana
```

#### Log Aggregation

```bash
# Using ELK Stack or similar
# Configure in docker-compose.yml
```

## Health Checks

### Backend Health

```bash
curl https://api.yourdomain.com/health
```

Should return:
```json
{
  "status": "healthy",
  "app": "SwasthyaMitra",
  "version": "0.1.0"
}
```

### Database Connection

```bash
docker-compose exec backend python -c "from app.database import SessionLocal; db = SessionLocal(); print('OK')"
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs service_name

# Check port availability
lsof -i :8000
lsof -i :3000
lsof -i :3306

# Restart service
docker-compose restart service_name
```

### Database Connection Issues

```bash
# Verify MySQL
docker-compose exec mysql mysql -u root -p -e "SELECT 1"

# Check network
docker network ls
docker network inspect swasthya_network
```

### Memory Issues

```bash
# Limit container memory in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

## Performance Optimization

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_patient_status ON cases(patient_id, case_status);
CREATE INDEX idx_appointment_date ON appointments(appointment_date);

-- Optimize queries
ANALYZE TABLE patients;
ANALYZE TABLE cases;
```

### Caching

```python
# Add Redis caching in production
from functools import lru_cache
import redis

redis_client = redis.Redis(host='redis', port=6379, db=0)
```

### Load Balancing

```nginx
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }
}
```

## Scaling

### Horizontal Scaling

1. Run multiple backend instances
2. Use load balancer (Nginx, HAProxy)
3. Use managed database (AWS RDS, etc.)
4. Use CDN for static files

### Vertical Scaling

1. Increase container memory/CPU limits
2. Optimize database queries
3. Add caching layer (Redis)

## Rollback Procedure

```bash
# Backup current version
docker-compose down
tar -czf backup_$(date +%s).tar.gz data/

# Restore previous version
git checkout <previous-version>
docker-compose up -d
```

## Maintenance

### Regular Updates

```bash
# Weekly: Update dependencies
docker-compose down
git pull origin main
docker-compose build
docker-compose up -d
```

### Database Maintenance

```bash
# Monthly: Optimize tables
docker-compose exec mysql mysqlcheck -u root -p -A -o

# Remove old audit logs
DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

## Security Checklist

- [ ] Change default passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up VPN for admin access
- [ ] Enable database encryption
- [ ] Configure backup retention
- [ ] Set up monitoring alerts
- [ ] Review and update security headers
- [ ] Enable audit logging
- [ ] Regular security scanning

## Support & Documentation

- API Documentation: `/docs` endpoint
- Development Guide: [DEVELOPMENT.md](DEVELOPMENT.md)
- Project Structure: [README.md](README.md)
