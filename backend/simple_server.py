from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "KoalaSaaS API is running"}

@app.post("/api/auth/register")
def register():
    return {"message": "Register endpoint working"}

@app.post("/api/auth/login")
def login():
    return {"message": "Login endpoint working"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
