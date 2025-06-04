import json
import logging
from fastapi import HTTPException
from ..models.user import User, UserInDB
from ..core.config import USERS_FILE
from ..core.security import verify_password, get_password_hash

logger = logging.getLogger(__name__)

def load_users():
    """Load users from JSON file."""
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

def save_users(users):
    """Save users to JSON file."""
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

def get_user(identifier: str):
    """Get user by username or email."""
    users = load_users()
    
    # First try direct username lookup
    if identifier in users:
        user_dict = users[identifier]
        return UserInDB(**user_dict)
    
    # If not found, try to find by email
    for username, user_data in users.items():
        if user_data.get('email') == identifier:
            return UserInDB(**user_data)
    
    return None

def authenticate_user(identifier: str, password: str):
    """Authenticate user with username/email and password."""
    try:
        user = get_user(identifier)
        if not user:
            logger.info(f"User not found: {identifier}")
            return False
        if not verify_password(password, user.hashed_password):
            logger.info(f"Invalid password for user: {identifier}")
            return False
        logger.info(f"User authenticated successfully: {identifier}")
        return user
    except Exception as e:
        logger.error(f"Error during authentication for {identifier}: {str(e)}")
        return False

def create_user(username: str, password: str, email: str, full_name: str):
    """Create a new user."""
    users = load_users()
    if username in users:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email already exists
    for existing_user in users.values():
        if existing_user.get('email') == email:
            raise HTTPException(status_code=400, detail="Email already registered")
    
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
