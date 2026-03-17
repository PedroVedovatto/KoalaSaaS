from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

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
    return {
        "access_token": "fake-token",
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
    return {
        "access_token": "fake-token",
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
def get_me():
    return {
        "id": 1,
        "email": "admin@gmail.com",
        "username": "admin",
        "full_name": "Admin User",
        "company_id": 1
    }

@app.get("/api/contracts/dashboard/stats")
def get_stats():
    return {
        "total_contracts": 5,
        "active_contracts": 3,
        "expiring_soon": 1,
        "expired": 0,
        "total_value": 15000.0,
        "potential_savings": 2000.0
    }

@app.get("/api/contracts")
def get_contracts():
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
