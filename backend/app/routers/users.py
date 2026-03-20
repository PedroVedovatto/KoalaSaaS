from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User
from ..schemas.users import UserCreate, UserUpdate, UserResponse, UserPasswordChange
from ..services.users import UsersService
from ..services.auth import AuthService

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
def get_users(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users for current user's company (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view all users"
        )
    return UsersService.get_users(db, current_user)

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: Annotated[User, Depends(AuthService.get_current_user)]
):
    """Get current user profile"""
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: Annotated[User, Depends(AuthService.get_current_user)],
    db: Session = Depends(get_db)
):
    """Get a specific user by ID (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view other users"
        )
    return UsersService.get_user(db, user_id, current_user)

@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    current_user: Annotated[User, Depends(AuthService.get_current_user)],
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create users"
        )
    return UsersService.create_user(user_data, current_user, db)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(AuthService.get_current_user)],
    db: Session = Depends(get_db)
):
    """Update an existing user (admin only or self)"""
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    return UsersService.update_user(user_id, user_data, current_user, db)

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: Annotated[User, Depends(AuthService.get_current_user)],
    db: Session = Depends(get_db)
):
    """Delete a user (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete users"
        )
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )
    UsersService.delete_user(user_id, current_user, db)
    return {"message": "User deleted successfully"}

@router.patch("/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    current_user: Annotated[User, Depends(AuthService.get_current_user)],
    db: Session = Depends(get_db)
):
    """Toggle user active status (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can change user status"
        )
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account"
        )
    return UsersService.toggle_user_status(user_id, current_user, db)

@router.patch("/{user_id}/change-password")
def change_password(
    user_id: int,
    password_data: UserPasswordChange,
    current_user: Annotated[User, Depends(AuthService.get_current_user)],
    db: Session = Depends(get_db)
):
    """Change user password (admin only or self)"""
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only change your own password"
        )
    return UsersService.change_password(user_id, password_data, current_user, db)

@router.post("/promote-all-to-admin")
def promote_all_users_to_admin(
    current_user: Annotated[User, Depends(AuthService.get_current_user)],
    db: Session = Depends(get_db)
):
    """Promote all existing users to admin role (super admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can promote users"
        )
    
    promoted_count = UsersService.promote_all_users_to_admin(db)
    return {
        "message": f"Successfully promoted {promoted_count} users to admin role",
        "promoted_count": promoted_count
    }
