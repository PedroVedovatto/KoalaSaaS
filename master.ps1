if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Python..."
    winget install --id Python.Python.3 --accept-package-agreements --accept-source-agreements
}

Write-Host "Executando setup..."
python setup.py

Write-Host "Iniciando servidor backend..."
Start-Job -ScriptBlock {
    Set-Location "c:\KoalaSaaS\backend"
    & ".\venv\Scripts\Activate.ps1"
    uvicorn app.main:app --reload
}

Write-Host "Iniciando servidor frontend..."
Start-Job -ScriptBlock {
    Set-Location "c:\KoalaSaaS\frontend"
    npm run dev
}

Write-Host "Sistema KoalaSaaS iniciado!"
Write-Host "Backend: http://127.0.0.1:8000"
Write-Host "Frontend: http://localhost:3000"
Write-Host "Acesse http://localhost:3000 para usar o sistema."
