@echo off
if exist .venv\Scripts\activate (
    call .venv\Scripts\activate
) else if exist .venv\bin\activate.bat (
    call .venv\bin\activate.bat
)
echo Starting NOVA backend...
cd backend
pip install -r requirements.txt
start uvicorn main:app --reload --port 8000
cd ..

echo Starting NOVA frontend...
cd frontend
npm install
npm run dev
