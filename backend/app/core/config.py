import os
from dotenv import load_dotenv
import pathlib

load_dotenv()

# Get the directory where the backend is located
BACKEND_DIR = pathlib.Path(__file__).parent.parent.parent.absolute()
USERS_FILE = BACKEND_DIR / "users.json"

# Check for API key
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OpenAI API key not found. Please set OPENAI_API_KEY in your .env file")

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# CORS origins
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080", 
    "http://127.0.0.1:8080",
    "https://precision-skin-insights.vercel.app",
    "https://precision-health-ai.vercel.app/"  # Production Vercel URL
]
