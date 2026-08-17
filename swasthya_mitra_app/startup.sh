#!/bin/bash
# SwasthyaMitra - Quick Start Script

set -e

echo "🏥 SwasthyaMitra - Platform Startup"
echo "===================================="
echo ""

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created (using default values)"
    echo "   Edit .env if you need to customize settings"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔨 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ All services are running!"
echo ""
echo "📱 Access Points:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - Database: localhost:3306"
echo ""
echo "📖 Documentation:"
echo "  - README.md - Project overview"
echo "  - API_REFERENCE.md - API documentation"
echo "  - DEVELOPMENT.md - Development guide"
echo "  - DEPLOYMENT.md - Deployment guide"
echo ""
echo "📊 Demo Credentials:"
echo "  - Phone: 9876543210 (or any 10 digits)"
echo "  - OTP: Check the response from /auth/request-otp endpoint"
echo ""
echo "💡 Next Steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Click 'Get Started' and enter a phone number"
echo "  3. Copy the demo OTP from terminal/logs and verify"
echo "  4. Explore the patient dashboard"
echo ""
echo "🛑 To stop services: docker-compose down"
echo "📋 To view logs: docker-compose logs -f"
echo ""
