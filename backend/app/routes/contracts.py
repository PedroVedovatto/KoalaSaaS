from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime, date, timedelta
import os
import uuid
from ..database import get_db
from ..models import Contract, User
from .auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/")
def get_contracts(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    contract_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Contract).filter(Contract.company_id == current_user.company_id)
    
    if search:
        query = query.filter(
            or_(
                Contract.name.ilike(f"%{search}%"),
                Contract.description.ilike(f"%{search}%")
            )
        )
    
    if status:
        query = query.filter(Contract.status == status)
    
    if contract_type:
        query = query.filter(Contract.contract_type == contract_type)
    
    contracts = query.offset(skip).limit(limit).all()
    
    # Add alerts for expiring contracts
    result = []
    for contract in contracts:
        contract_data = {
            "id": contract.id,
            "name": contract.name,
            "contract_type": contract.contract_type,
            "description": contract.description,
            "value": contract.value,
            "start_date": contract.start_date,
            "end_date": contract.end_date,
            "status": contract.status,
            "auto_renew": contract.auto_renew,
            "file_path": contract.file_path,
            "created_at": contract.created_at,
            "days_until_expiry": (contract.end_date - date.today()).days if contract.end_date else None
        }
        
        # Add alert if contract expires in 30 days
        if contract.end_date:
            days_until = (contract.end_date - date.today()).days
            if 0 <= days_until <= 30:
                contract_data["alert"] = f"Contrato expira em {days_until} dias"
            elif days_until < 0:
                contract_data["alert"] = "Contrato expirado"
        
        result.append(contract_data)
    
    return result

@router.post("/")
async def create_contract(
    name: str = Form(...),
    contract_type: str = Form(...),
    description: str = Form(""),
    value: float = Form(0.0),
    start_date: date = Form(...),
    end_date: date = Form(...),
    auto_renew: bool = Form(False),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_path = None
    if file:
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    
    contract = Contract(
        name=name,
        contract_type=contract_type,
        description=description,
        value=value,
        start_date=start_date,
        end_date=end_date,
        auto_renew=auto_renew,
        file_path=file_path,
        company_id=current_user.company_id,
        created_by=current_user.id
    )
    
    db.add(contract)
    db.commit()
    db.refresh(contract)
    
    return {
        "id": contract.id,
        "name": contract.name,
        "contract_type": contract.contract_type,
        "message": "Contrato criado com sucesso"
    }

@router.get("/{contract_id}")
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.company_id == current_user.company_id
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    return {
        "id": contract.id,
        "name": contract.name,
        "contract_type": contract.contract_type,
        "description": contract.description,
        "value": contract.value,
        "start_date": contract.start_date,
        "end_date": contract.end_date,
        "status": contract.status,
        "auto_renew": contract.auto_renew,
        "file_path": contract.file_path,
        "created_at": contract.created_at
    }

@router.put("/{contract_id}")
def update_contract(
    contract_id: int,
    contract_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.company_id == current_user.company_id
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    for field, value in contract_data.items():
        if hasattr(contract, field) and field not in ["id", "company_id", "created_by", "created_at"]:
            setattr(contract, field, value)
    
    contract.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Contrato atualizado com sucesso"}

@router.delete("/{contract_id}")
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.company_id == current_user.company_id
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    
    # Delete file if exists
    if contract.file_path and os.path.exists(contract.file_path):
        os.remove(contract.file_path)
    
    db.delete(contract)
    db.commit()
    
    return {"message": "Contrato excluído com sucesso"}

@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_contracts = db.query(Contract).filter(Contract.company_id == current_user.company_id).count()
    
    active_contracts = db.query(Contract).filter(
        Contract.company_id == current_user.company_id,
        Contract.status == "ativo"
    ).count()
    
    expiring_soon = db.query(Contract).filter(
        Contract.company_id == current_user.company_id,
        Contract.status == "ativo",
        Contract.end_date.between(date.today(), date.today() + timedelta(days=30))
    ).count()
    
    expired = db.query(Contract).filter(
        Contract.company_id == current_user.company_id,
        Contract.end_date < date.today(),
        Contract.status == "ativo"
    ).count()
    
    total_value = db.query(Contract).filter(
        Contract.company_id == current_user.company_id,
        Contract.status == "ativo"
    ).with_entities(Contract.value).all()
    
    total_value_sum = sum([v[0] or 0 for v in total_value])
    
    return {
        "total_contracts": total_contracts,
        "active_contracts": active_contracts,
        "expiring_soon": expiring_soon,
        "expired": expired,
        "total_value": total_value_sum,
        "potential_savings": expired * 1000  # Simulated savings calculation
    }
