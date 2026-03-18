from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Annotated

from ..database import get_db
from ..models import User
from ..schemas.auth import UserRegister, UserLogin, UserResponse, TokenResponse
from ..services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current authenticated user"""
    return AuthService.get_current_user(credentials.credentials, db)

@router.post("/register", response_model=TokenResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user and company"""
    return AuthService.register(user_data, db)

@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    return AuthService.login(user_data, db)

@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Get current user information"""
    return UserResponse.model_validate(current_user)
