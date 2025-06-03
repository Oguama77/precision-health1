from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Dict, Any, List, Optional
from typing_extensions import TypedDict
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import numpy as np
from langgraph.graph import StateGraph
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import Document
from langchain.schema.messages import HumanMessage, SystemMessage
import os
import base64
from dotenv import load_dotenv
import logging
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import json
import pathlib

# Configure logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get the directory where main.py is located
BACKEND_DIR = pathlib.Path(__file__).parent.absolute()
USERS_FILE = BACKEND_DIR / "users.json"

load_dotenv()

# Check for API key
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OpenAI API key not found. Please set OPENAI_API_KEY in your .env file")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://precision-skin-insights.vercel.app",
        "https://precision-health-ai.vercel.app"  # Production Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=3600  # Cache preflight requests for 1 hour
)

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# User model
class User(BaseModel):
    username: str
    email: str
    full_name: str
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Load users from JSON file
def load_users():
    try:
        if not USERS_FILE.exists():
            # Create the file if it doesn't exist
            with open(USERS_FILE, "w") as f:
                json.dump({}, f)
            return {}
            
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading users: {str(e)}")
        return {}

# Save users to JSON file
def save_users(users):
    try:
        # Ensure the directory exists
        USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        # Write the users data
        with open(USERS_FILE, "w") as f:
            json.dump(users, f)
    except Exception as e:
        logger.error(f"Error saving users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while saving user data"
        )

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(username: str):
    users = load_users()
    if username in users:
        user_dict = users[username]
        return UserInDB(**user_dict)
    return None

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Authentication endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        user = authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        logger.info(f"User {form_data.username} logged in successfully")
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Login error for user {form_data.username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during login"
        )

@app.post("/signup")
async def signup(username: str = Form(...), password: str = Form(...), email: str = Form(...), full_name: str = Form(...)):
    try:
        users = load_users()
        if username in users:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        hashed_password = get_password_hash(password)
        user_dict = {
            "username": username,
            "email": email,
            "full_name": full_name,
            "hashed_password": hashed_password,
            "disabled": False
        }
        users[username] = user_dict
        save_users(users)
        logger.info(f"New user registered: {username}")
        return {"message": "User created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during signup for user {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during signup"
        )

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Analysis endpoint
@app.post("/api/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        # Log the analysis request
        logger.info(f"Analysis request received from user: {current_user.username}")
        
        # Read and process the image
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Prepare the image for analysis
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
        ])
        
        image_tensor = transform(pil_image)
        image_tensor = image_tensor.unsqueeze(0)  # Add batch dimension
        
        # Convert the image to base64 for the API
        buffered = io.BytesIO()
        pil_image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Initialize OpenAI client
        llm = ChatOpenAI(
            model="gpt-4-vision-preview",
            max_tokens=1500,
            temperature=0
        )
        
        # Create the messages for the API
        messages = [
            SystemMessage(content=(
                "You are a dermatologist specialized in analyzing skin conditions. "
                "Provide a detailed analysis of the skin image, including potential conditions, "
                "recommendations, and general skin health observations. Be thorough but clear."
            )),
            HumanMessage(content=[
                {
                    "type": "text",
                    "text": "Please analyze this skin image and provide a detailed assessment."
                },
                {
                    "type": "image_url",
                    "image_url": f"data:image/jpeg;base64,{img_str}"
                }
            ])
        ]
        
        # Get the analysis from the API
        response = llm.invoke(messages)
        
        # Log successful analysis
        logger.info(f"Analysis completed successfully for user: {current_user.username}")
        
        # Return the analysis results
        return {
            "analysis": response.content,
            "success": True
        }
        
    except Exception as e:
        # Log the error
        logger.error(f"Error during analysis for user {current_user.username}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")