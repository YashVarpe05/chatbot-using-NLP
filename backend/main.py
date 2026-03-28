"""
NOVA — Advanced AI Chatbot Backend
FastAPI server with NLP pipeline, session memory, and LLM integration.
Run with: uvicorn main:app --reload
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
import uuid

from memory import (
    get_or_create_session,
    add_message,
    get_history,
    get_memory_length,
    clear_session,
)
from nlp_pipeline import run_full_pipeline, analyze_sentiment, detect_intent, extract_entities
from llm_handler import get_llm_response

# ── App Setup ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="NOVA AI Chatbot API",
    description="Advanced AI chatbot with NLP pipeline — Sentiment, Intent, NER, and LLM",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request/Response Models ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    sentiment: dict
    intent: dict
    entities: list
    memory_length: int
    session_id: str


# ── REST Endpoints ──────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "NOVA AI Chatbot API",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "POST /chat": "Send a message and get AI response with NLP analysis",
            "POST /clear": "Clear session memory",
            "GET /health": "Health check",
            "WS /ws/{session_id}": "WebSocket for real-time chat",
        },
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "NOVA v1.0"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint.
    1. Run NLP pipeline on user message
    2. Get conversation history
    3. Generate LLM response
    4. Store messages in memory
    5. Return response + NLP analysis
    """
    # Get or create session
    session_id = get_or_create_session(request.session_id)
    
    # Run NLP pipeline on user message
    nlp_results = run_full_pipeline(request.message)
    
    # Get conversation history for context
    history = get_history(session_id)
    
    # Get LLM response
    reply = await get_llm_response(request.message, history)
    
    # Store both messages in memory
    add_message(session_id, "user", request.message)
    add_message(session_id, "assistant", reply)
    
    return ChatResponse(
        reply=reply,
        sentiment=nlp_results["sentiment"],
        intent=nlp_results["intent"],
        entities=nlp_results["entities"],
        memory_length=get_memory_length(session_id),
        session_id=session_id,
    )


class ClearRequest(BaseModel):
    session_id: str


@app.post("/clear")
async def clear_memory(request: ClearRequest):
    """Clear conversation memory for a session."""
    success = clear_session(request.session_id)
    return {
        "success": success,
        "message": "Memory cleared" if success else "Session not found",
    }


@app.get("/analyze")
async def analyze_text(text: str):
    """Analyze text without sending to LLM — useful for NLP demo."""
    return run_full_pipeline(text)


# ── WebSocket Endpoint ──────────────────────────────────────────────────────

@app.websocket("/ws/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time chat streaming."""
    await websocket.accept()
    
    # Ensure session exists
    session_id = get_or_create_session(session_id)
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message_data = json.loads(data)
            user_message = message_data.get("message", "")
            
            if not user_message:
                continue
            
            # Run NLP pipeline
            nlp_results = run_full_pipeline(user_message)
            
            # Send NLP results immediately
            await websocket.send_text(json.dumps({
                "type": "nlp_analysis",
                "sentiment": nlp_results["sentiment"],
                "intent": nlp_results["intent"],
                "entities": nlp_results["entities"],
            }))
            
            # Get conversation history
            history = get_history(session_id)
            
            # Generate response
            reply = await get_llm_response(user_message, history)
            
            # Store in memory
            add_message(session_id, "user", user_message)
            add_message(session_id, "assistant", reply)
            
            # Send complete response
            await websocket.send_text(json.dumps({
                "type": "response",
                "reply": reply,
                "sentiment": nlp_results["sentiment"],
                "intent": nlp_results["intent"],
                "entities": nlp_results["entities"],
                "memory_length": get_memory_length(session_id),
                "session_id": session_id,
            }))
    
    except WebSocketDisconnect:
        print(f"Client disconnected: {session_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()


# ── Startup Event ───────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    print("[*] NOVA AI Chatbot API is starting...")
    print("[*] API available at http://localhost:8000")
    print("[*] API docs at http://localhost:8000/docs")
    print("[*] WebSocket at ws://localhost:8000/ws/{session_id}")
