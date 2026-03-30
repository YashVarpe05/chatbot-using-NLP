@echo off
echo Starting NOVA backend...
cd backend
pip install -r requirements.txt
start uvicorn main:app --reload --port 8000
cd ..

echo Starting NOVA frontend...
cd frontend
npm install
npm run dev
