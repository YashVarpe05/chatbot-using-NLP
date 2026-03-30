#!/bin/bash
set -e

echo "Starting NOVA backend..."
cd backend
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
cd ..

echo "Starting NOVA frontend..."
cd frontend
npm install -q
npm run dev
