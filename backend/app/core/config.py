from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

DATABASE_PATH = BASE_DIR / "studybuddy.db"
API_PREFIX = "/api"
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
