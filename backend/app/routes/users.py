from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Company
from .auth import get_current_user

router = APIRouter()

@router.get("/me")
def get_user_profile(current_user: User = Depends(get_current_user)):
    company = current_user.company
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "company": {
            "id": company.id,
            "name": company.name,
            "cnpj": company.cnpj
        } if company else None
    }
