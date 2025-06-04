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

# Configure logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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
        "https://precision-health-bmudwqvyk-pnerrbbys-projects.vercel.app"  # Add your Vercel domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# User models
class User(BaseModel):
    email: str
    full_name: str
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# User database (replace with a real database in production)
def get_user_db():
    try:
        with open("users.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_user_db(users):
    with open("users.json", "w") as f:
        json.dump(users, f)

# Password functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(email: str):
    users_db = get_user_db()
    if email in users_db:
        user_dict = users_db[email]
        return UserInDB(**user_dict)
    return None

def authenticate_user(email: str, password: str):
    user = get_user(email)
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
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user(email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

# Define state type
class AnalysisState(TypedDict):
    image_data: str
    patient_info: Dict[str, str]
    analysis: List[Dict[str, Any]]

# Initialize the LLM
try:
    llm = ChatOpenAI(
        model="gpt-4o",  # Latest GPT-4 Vision model
        max_tokens=1500,
        temperature=0.7,
    )
except Exception as e:
    print(f"Error initializing LLM: {e}")
    raise

# Define the analysis workflow
def analyze_image(state: AnalysisState) -> AnalysisState:
    """Analyze the skin condition in the image using GPT-4o."""
    image_data = state["image_data"]
    patient_info = state["patient_info"]
    
    # Prepare the message for GPT-4 Vision
    message = [
        SystemMessage(content="""You are a dermatology AI assistant. Analyze the skin condition in the image and provide a detailed assessment. 
        Focus on identifying signs of acne and hyperpigmentation. Structure your response with the following:
        1. Detailed description of the skin condition (e.g. redness, inflammation, etc.)
        2. Severity assessment (mild, moderate, or severe)
        3. Treatment recommendations (e.g. topical creams, oral medications, etc.)"""),
        HumanMessage(content=[
            {
                "type": "text",
                "text": f"Patient Information:\nName: {patient_info['name']}\nDuration of Symptoms: {patient_info['duration']}\nSymptoms Description: {patient_info['symptoms']}\n\nPlease analyze the skin condition in this image."
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": image_data,
                    "detail": "high"
                }
            }
        ])
    ]
    
    # Get analysis from GPT-4 Vision
    response = llm.invoke(message)
    
    # Parse the response into structured format
    analysis = parse_llm_response(response.content)
    state["analysis"] = analysis
    return state

def parse_llm_response(response: str) -> List[Dict[str, Any]]:
    """Parse the LLM response into structured format."""
    conditions = []
    current_condition = {}
    
    lines = response.split('\n')
    for line in lines:
        line = line.strip()
        if line.lower().startswith('assessment') or line.lower().startswith('analysis'):
            if current_condition:
                conditions.append(current_condition)
            current_condition = {
                'description': '',
                'severity': 'Unknown',
                'recommendations': []
            }
        elif 'severity' in line.lower():
            try:
                current_condition['severity'] = line.split(':')[1].strip()
            except IndexError:
                current_condition['severity'] = line.strip()
        elif 'description' in line.lower() or 'assessment' in line.lower():
            try:
                current_condition['description'] = line.split(':')[1].strip()
            except IndexError:
                current_condition['description'] = line.strip()
        elif 'recommendation' in line.lower() or 'treatment' in line.lower():
            if 'recommendations' not in current_condition:
                current_condition['recommendations'] = []
            try:
                rec = line.split(':')[1].strip() if ':' in line else line.strip()
                current_condition['recommendations'].append(rec)
            except IndexError:
                current_condition['recommendations'].append(line.strip())
    
    if current_condition:
        conditions.append(current_condition)
    
    # If no conditions were found, create a default one with the raw response
    if not conditions:
        conditions.append({
            'description': response.strip(),
            'severity': 'Unknown',
            'recommendations': []
        })
    
    return conditions

# Create the workflow graph
workflow = StateGraph(AnalysisState)

# Add the analysis node
workflow.add_node("analyze_image", analyze_image)

# Define the edges
workflow.set_entry_point("analyze_image")
workflow.set_finish_point("analyze_image")  # Set the finish point instead of adding an edge to None

# Compile the graph
chain = workflow.compile()

@app.post("/api/analyze")
async def analyze_skin_condition(
    image: UploadFile = File(...),
    name: str = Form(...),
    duration: str = Form(...),
    symptoms: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Endpoint to analyze skin condition from uploaded image."""
    try:
        logger.info(f"📸 Analysis request from user: {current_user.email}")
        logger.info(f"Processing image upload for patient: {name}")
        
        # Read and process the image
        image_content = await image.read()
        image_base64 = f"data:image/jpeg;base64,{base64.b64encode(image_content).decode()}"
        
        # Prepare the initial state
        initial_state: AnalysisState = {
            "image_data": image_base64,
            "patient_info": {
                "name": name,
                "duration": duration,
                "symptoms": symptoms
            },
            "analysis": []
        }
        
        # Run the analysis workflow
        try:
            logger.info("🔄 Starting analysis workflow")
            result = chain.invoke(initial_state)
            logger.info("✅ Analysis completed successfully")
            return result["analysis"]
        except Exception as e:
            logger.error(f"❌ Analysis error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error during analysis: {str(e)}. Please check your OpenAI API key and try again."
            )
            
    except Exception as e:
        logger.error(f"❌ Request processing error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error processing request. Please try again."
        )

# Add new endpoints for user management
@app.post("/api/signup")
async def signup(
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...)
):
    logger.info(f"📝 Signup attempt for email: {email}")
    users_db = get_user_db()
    
    if email in users_db:
        logger.warning(f"❌ Signup failed: Email already registered - {email}")
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    try:
        hashed_password = get_password_hash(password)
        user_dict = {
            "email": email,
            "full_name": full_name,
            "hashed_password": hashed_password,
            "disabled": False
        }
        
        users_db[email] = user_dict
        save_user_db(users_db)
        logger.info(f"✅ User created successfully: {email}")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email}, expires_delta=access_token_expires
        )
        logger.info(f"🎟️ Access token generated for: {email}")
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"❌ Error during signup: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during signup: {str(e)}"
        )

@app.post("/api/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    logger.info(f"🔐 Login attempt for: {form_data.username}")
    try:
        user = authenticate_user(form_data.username, form_data.password)
        if not user:
            logger.warning(f"❌ Login failed: Invalid credentials for {form_data.username}")
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        logger.info(f"✅ Login successful for: {form_data.username}")
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"❌ Error during login: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during login: {str(e)}"
        )

@app.get("/api/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    logger.info(f"👤 User profile accessed: {current_user.email}")
    return current_user

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info") 