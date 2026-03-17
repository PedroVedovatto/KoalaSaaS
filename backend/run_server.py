from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import uvicorn
import logging
from jose import JWTError, jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext

app = FastAPI()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user_id, "email": "admin@gmail.com", "username": "admin", "full_name": "Admin User", "company_id": 1}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserRegister(BaseModel):
    email: str
    password: str
    username: str
    full_name: str = ""
    company_name: str = ""

class UserLogin(BaseModel):
    email: str
    password: str

@app.get("/")
def read_root():
    return {"message": "KoalaSaaS API is running"}

@app.post("/api/auth/register")
def register(user: UserRegister):
    logger.info(f"Registering user: {user.email}")
    access_token = create_access_token(data={"sub": "1"})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": 1,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "company_id": 1
        }
    }

@app.post("/api/auth/login")
def login(user: UserLogin):
    logger.info(f"Logging in user: {user.email}")
    access_token = create_access_token(data={"sub": "1"})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": 1,
            "email": user.email,
            "username": "admin",
            "full_name": "Admin User",
            "company_id": 1
        }
    }

@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    logger.info("Getting current user info")
    return current_user

@app.get("/api/contracts/dashboard/stats")
def get_stats(current_user: dict = Depends(get_current_user)):
    logger.info("Getting dashboard stats")
    return {
        "total_contracts": 5,
        "active_contracts": 3,
        "expiring_soon": 1,
        "expired": 0,
        "total_value": 15000.0,
        "potential_savings": 2000.0
    }

@app.get("/api/contracts")
def get_contracts(current_user: dict = Depends(get_current_user)):
    logger.info("Getting contracts")
    return [
        {
            "id": 1,
            "name": "Contrato de Aluguel",
            "contract_type": "aluguel",
            "description": "Aluguel do escritório",
            "value": 5000.0,
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "status": "ativo",
            "auto_renew": True,
            "created_at": "2024-01-01T00:00:00",
            "days_until_expiry": 30,
            "alert": "Contrato expira em 30 dias"
        }
    ]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
