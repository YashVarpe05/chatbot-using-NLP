"""
NOVA — Advanced AI Chatbot Backend
FastAPI server with NLP pipeline, session memory, and LLM integration.
Run with: uvicorn main:app --reload
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional
import json
import os
import time
import uuid
import logging
import asyncio

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from memory import (
    get_or_create_session,
    add_message,
    get_history,
    get_memory_length,
    clear_session,
    get_all_sessions,
    link_session_to_user,
)
from db import get_db, init_db
from auth import router as auth_router, resolve_user_from_request
from sqlalchemy.orm import Session
from nlp_pipeline import run_full_pipeline
from vector_memory import upsert_exchange, query_similar_exchanges
from llm_handler import (
    get_llm_response,
    generate_followups,
    get_runtime_mode,
    get_provider_diagnostics,
)

# ── App Setup ───────────────────────────────────────────────────────────────


class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps(
            {
                "ts": self.formatTime(record),
                "level": record.levelname,
                "msg": record.getMessage(),
                **getattr(record, "extra", {}),
            }
        )


logger = logging.getLogger("nova")
logger.setLevel(logging.INFO)
_handler = logging.StreamHandler()
_handler.setFormatter(JSONFormatter())
logger.handlers = [_handler]

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="NOVA AI Chatbot API",
    description="Advanced AI chatbot with NLP pipeline — Sentiment, Intent, NER, and LLM",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)


# ── Request/Response Models ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    response_style: Optional[str] = "balanced"
    temperature: Optional[float] = 0.4


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    for err in exc.errors():
        if err.get("loc", []) and err.get("loc", [])[-1] == "message" and err.get("type") == "string_too_long":
            return JSONResponse(
                status_code=422,
                content={"detail": "Message too long (max 2000 characters)"},
            )
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


class ChatResponse(BaseModel):
    reply: str
    sentiment: dict
    intent: dict
    entities: list
    suggestions: list
    followups: list
    runtime_mode: str
    memory_length: int
    session_id: str


def _build_vector_context(similar: list[dict]) -> str:
    if not similar:
        return ""
    lines = ["[Relevant Past Exchanges]"]
    for i, item in enumerate(similar[:3], start=1):
        doc = (item or {}).get("document", "")
        if doc:
            lines.append(f"{i}. {doc}")
    return "\n\n".join(lines)


async def _vector_context_for_message(session_id: str, user_message: str, timeout_s: float = 1.2) -> str:
    """Best-effort vector retrieval that never blocks chat path for long."""
    try:
        similar = await asyncio.wait_for(
            asyncio.to_thread(query_similar_exchanges, session_id, user_message, 3),
            timeout=timeout_s,
        )
        return _build_vector_context(similar)
    except Exception:
        return ""


async def _vector_upsert_safe(
    session_id: str,
    user_message: str,
    assistant_message: str,
    timeout_s: float = 1.2,
) -> bool:
    """Best-effort vector upsert with timeout guard."""
    try:
        await asyncio.wait_for(
            asyncio.to_thread(upsert_exchange, session_id, user_message, assistant_message),
            timeout=timeout_s,
        )
        return True
    except Exception:
        return False


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


@app.get("/debug/provider")
async def provider_debug():
    """Operational diagnostics for provider/runtime behavior."""
    sessions = get_all_sessions()
    total_messages = sum(s.get("message_count", 0) for s in sessions.values())
    return {
        **get_provider_diagnostics(),
        "memory": {
            "active_sessions": len(sessions),
            "total_messages": total_messages,
        },
    }


@app.post("/chat", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat(request: Request, body: ChatRequest, db: Session = Depends(get_db)):
    """
    Main chat endpoint.
    1. Run NLP pipeline on user message
    2. Get conversation history
    3. Generate LLM response
    4. Store messages in memory
    5. Return response + NLP analysis
    """
    # Get or create session
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()

    user = resolve_user_from_request(request, db)
    user_id = user.id if user else None
    session_id = get_or_create_session(body.session_id, user_id=user_id)
    if user_id is not None:
        link_session_to_user(session_id, user_id)
    
    # Run NLP pipeline on user message
    nlp_results = await run_full_pipeline(body.message)
    
    # Get conversation history for context
    history = get_history(session_id)

    # Retrieve semantically similar past exchanges (session-scoped)
    history_for_llm = list(history)
    memory_context = await _vector_context_for_message(session_id, body.message)
    if memory_context:
        history_for_llm = [{"role": "assistant", "content": memory_context}] + history_for_llm
    
    # Get LLM response
    reply = await get_llm_response(
        user_message=body.message,
        history=history_for_llm,
        nlp_results=nlp_results,
        response_style=(body.response_style or "balanced"),
        temperature=body.temperature if body.temperature is not None else 0.4,
    )

    suggestions = await generate_followups(
        llm_response_text=reply,
        history=history,
        response_style=(body.response_style or "balanced"),
        nlp_results=nlp_results,
    )
    
    # Store both messages in memory
    add_message(session_id, "user", body.message)
    add_message(session_id, "assistant", reply)

    # Upsert user-assistant exchange into vector memory (session-scoped)
    vector_upsert_ok = await _vector_upsert_safe(session_id, body.message, reply)
    if not vector_upsert_ok:
        logger.warning(
            "VECTOR_UPSERT_FAILED",
            extra={"extra": {"request_id": request_id, "session_id": session_id, "error": "timeout_or_failure"}},
        )

    provider_used = get_provider_diagnostics().get("active_provider", "unknown")
    response_time_ms = int((time.time() - start_time) * 1000)
    log_extra = {
        "extra": {
            "request_id": request_id,
            "session_id": session_id,
            "message_length": len(body.message),
            "provider_used": provider_used,
            "response_time_ms": response_time_ms,
            "intent_detected": nlp_results.get("intent", {}).get("top_intent", "unknown"),
            "sentiment_score": nlp_results.get("sentiment", {}).get("compound", 0.0),
        }
    }
    logger.info("CHAT_REQUEST", extra=log_extra)
    if response_time_ms > 5000:
        logger.warning("SLOW_REQUEST", extra=log_extra)
    
    return ChatResponse(
        reply=reply,
        sentiment=nlp_results["sentiment"],
        intent=nlp_results["intent"],
        entities=nlp_results["entities"],
        suggestions=suggestions,
        followups=suggestions,
        runtime_mode=get_runtime_mode(),
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
    return await run_full_pipeline(text)


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
            nlp_results = await run_full_pipeline(user_message)
            
            # Send NLP results immediately
            await websocket.send_text(json.dumps({
                "type": "nlp_analysis",
                "sentiment": nlp_results["sentiment"],
                "intent": nlp_results["intent"],
                "entities": nlp_results["entities"],
            }))
            
            # Get conversation history
            history = get_history(session_id)

            # Retrieve semantically similar past exchanges
            history_for_llm = list(history)
            memory_context = await _vector_context_for_message(session_id, user_message)
            if memory_context:
                history_for_llm = [{"role": "assistant", "content": memory_context}] + history_for_llm
            
            # Generate response
            reply = await get_llm_response(
                user_message=user_message,
                history=history_for_llm,
                nlp_results=nlp_results,
            )

            suggestions = await generate_followups(
                llm_response_text=reply,
                history=history,
                response_style="balanced",
                nlp_results=nlp_results,
            )
            
            # Store in memory
            add_message(session_id, "user", user_message)
            add_message(session_id, "assistant", reply)
            vector_upsert_ok = await _vector_upsert_safe(session_id, user_message, reply)
            if not vector_upsert_ok:
                logger.warning(
                    "VECTOR_UPSERT_FAILED",
                    extra={"extra": {"session_id": session_id, "error": "timeout_or_failure", "channel": "websocket"}},
                )
            
            # Send complete response
            await websocket.send_text(json.dumps({
                "type": "response",
                "reply": reply,
                "sentiment": nlp_results["sentiment"],
                "intent": nlp_results["intent"],
                "entities": nlp_results["entities"],
                "suggestions": suggestions,
                "followups": suggestions,
                "runtime_mode": get_runtime_mode(),
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
    init_db()
    warnings = []
    if not any([os.getenv(f"GEMINI_API_KEY_{i}") for i in range(1, 4)] + [os.getenv("GEMINI_API_KEY")]):
        warnings.append("No Gemini keys found — will use fallback providers")
    if not os.getenv("GROQ_API_KEY"):
        warnings.append("GROQ_API_KEY missing — Groq fallback disabled")
    for warning in warnings:
        logger.warning(warning)
    logger.info("NOVA backend started", extra={"extra": {"providers_loaded": True}})

    print("[*] NOVA AI Chatbot API is starting...")
    print("[*] API available at http://localhost:8000")
    print("[*] API docs at http://localhost:8000/docs")
    print("[*] WebSocket at ws://localhost:8000/ws/{session_id}")
