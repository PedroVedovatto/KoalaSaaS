cd backend
$pythonPath = "C:\Users\Tomaso Corrêa Dhein\AppData\Local\Programs\Python\Python312\python.exe"
& $pythonPath -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
