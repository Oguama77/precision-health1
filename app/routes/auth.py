from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.security import OAuth2PasswordRequestForm
import logging

from ..models.user import Token, User
from ..schemas.user import UserSignupResponse
from ..services.user_service import authenticate_user, create_user
from ..core.security import create_access_token, get_current_user
from ..core.config import ACCESS_TOKEN_EXPIRE_MINUTES

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint to get access token."""
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

@router.post("/signup", response_model=UserSignupResponse)
async def signup(
    username: str = Form(...), 
    password: str = Form(...), 
    email: str = Form(...), 
    full_name: str = Form(...)
):
    """Signup endpoint to create new user."""
    try:
        result = create_user(username, password, email, full_name)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during signup for user {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during signup"
        )

@router.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user 