from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime, timedelta, date
import uvicorn
import os
from passlib.context import CryptContext
from jose import JWTError, jwt
from typing import Optional, List
from pydantic import BaseModel
from .database import SessionLocal, engine, Base
from .models import User, Company, Contract

Base.metadata.create_all(bind=engine)

app = FastAPI(title="KoalaSaaS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

class UserRegister(BaseModel):
    email: str
    password: str
    username: str
    full_name: str = ""
    company_name: str = ""

@app.post("/api/auth/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create company
    company = Company(name=user_data.company_name or f"Empresa de {user_data.username}")
    db.add(company)
    db.commit()
    db.refresh(company)

    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        company_id=company.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "company_id": user.company_id
        }
    }

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "company_id": user.company_id
        }
    }

@app.get("/api/auth/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "company_id": current_user.company_id
    }

@app.get("/api/contracts")
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

@app.post("/api/contracts")
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
        unique_filename = f"{datetime.utcnow().timestamp()}_{file.filename}"
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

@app.get("/api/contracts/{contract_id}")
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

@app.put("/api/contracts/{contract_id}")
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

@app.delete("/api/contracts/{contract_id}")
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

@app.get("/api/contracts/dashboard/stats")
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

@app.get("/")
def read_root():
    return {"message": "KoalaSaaS API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
