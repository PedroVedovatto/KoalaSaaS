from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, contracts, alerts

# Create database tables
Base.metadata.create_all(bind=engine)

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

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(contracts.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
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
