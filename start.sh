#!/bin/bash
set -e

if [ -f ".venv/Scripts/activate" ]; then
    source .venv/Scripts/activate
elif [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi

echo "Starting NOVA backend..."
cd backend
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
cd ..

echo "Starting NOVA frontend..."
cd frontend
npm install -q
npm run dev
