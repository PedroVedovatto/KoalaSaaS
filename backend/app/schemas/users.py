from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from ..models import UserRoleEnum

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: UserRoleEnum
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRoleEnum] = None
    is_active: Optional[bool] = None

class UserPasswordChange(BaseModel):
    current_password: Optional[str] = None  # Required for self password change
    new_password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: UserRoleEnum
    is_active: bool
    company_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: UserRoleEnum
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
