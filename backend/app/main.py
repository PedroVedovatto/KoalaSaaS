from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import auth, contracts, alerts, settings, users
import os

# Create database tables
Base.metadata.create_all(bind=engine)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app = FastAPI(
    title="KoalaSaaS API",
    description="Contract Management SaaS with Smart Alerts",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(contracts.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "KoalaSaaS API v2.0.0",
        "docs": "/docs",
        "features": [
            "Multi-tenant authentication",
            "Contract management",
            "Smart alerts system",
            "File uploads",
            "Dashboard analytics"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
