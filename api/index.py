import os
import sys

# Add swasthya_mitra_app/backend to python path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "swasthya_mitra_app", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Handle Vercel serverless environment (read-only filesystem, use /tmp for sqlite DB)
if os.environ.get("VERCEL") and not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:////tmp/swasthya_mitra.db"

from app.main import app
from app.database import engine, Base, SessionLocal
from app.seed import seed_demo_data

# Ensure tables and demo data exist on initialization
Base.metadata.create_all(bind=engine)
try:
    db = SessionLocal()
    seed_demo_data(db)
    db.close()
except Exception as e:
    print("Database initialization info:", e)
