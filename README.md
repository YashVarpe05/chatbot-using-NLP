`# NOVA — Neural Optimized Virtual Assistant

NOVA is an advanced AI chatbot built with a FastAPI backend and a React frontend, designed for production-style behavior with NLP enrichment and multi-provider LLM fallback routing. It combines conversation memory, sentiment/intent/entity analysis, and resilient runtime fallback to keep responses available even under provider failures.

## Architecture

```text
┌───────────────────────────── Frontend (React + Vite) ─────────────────────────────┐
│ Chat UI • NLP Inspector • Animations • Toasts • ErrorBoundary • SessionStorage    │
└───────────────────────────────────┬─────────────────────────────────────────────────┘
                                    │ HTTP / WS
┌───────────────────────────────────▼─────────────────────────────────────────────────┐
│ Backend API (FastAPI)                                                                │
│  /chat  /clear  /health  /debug/provider  /analyze  /ws/{session_id}               │
│   ├─ Memory manager (session + sliding window)                                       │
│   ├─ NLP pipeline (VADER + BART-MNLI + spaCy)                                        │
│   └─ LLM router: Gemini multi-key → Groq → Ollama → Smart template                 │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- (Optional) Ollama running locally for local model fallback

## Setup (5 steps)

1. **Clone repo**
   ```bash
   git clone <your-repo-url>
   cd chatbot-using-NLP
   ```
2. **Copy env files**
   - Backend: copy `backend/.env.example` → `backend/.env`
   - Frontend: copy `frontend/.env.example` → `frontend/.env`
3. **Add at least one key**
   - Set `GEMINI_API_KEY` (or `GEMINI_API_KEY_1/2/3`) in `backend/.env`
4. **Start app**
   - Linux/Mac: `bash start.sh`
   - Windows: `start.bat`
   - Docker: `docker-compose up -d --build`
5. **Open app**
   - Frontend (Local): http://localhost:5173
   - Frontend (Docker): http://localhost:80

## Provider fallback chain

NOVA tries providers in this order:

1. Groq (`llama-3.3-70b-versatile` - fast and free primary)
2. Gemini (multi-key rotation + per-key cooldown)
3. Ollama (`qwen2.5-coder:7b`)
4. Smart local template response (guaranteed final fallback)

## Keyboard shortcuts

- `Enter` → Send message
- `Ctrl + L` → Clear current chat
- `Esc` → Close NLP panel

## Debug endpoint

`GET /debug/provider`

Returns live diagnostics, including:

- `active_provider`
- `gemini_keys_total`
- `gemini_keys_available`
- `groq_available`
- `ollama_available`
- `last_error`
- runtime + memory diagnostics
