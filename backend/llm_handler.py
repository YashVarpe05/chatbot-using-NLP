"""LLM routing + resilient local fallback for NOVA."""

import asyncio
import itertools
import json
import os
import time
from typing import Any, Dict, List

import httpx
from dotenv import load_dotenv
from vector_memory import retrieve_similar, store_exchange

# Load .env from backend directory first
_HERE = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_HERE, ".env"))
load_dotenv()

SYSTEM_PROMPT = """You are NOVA, an enterprise-grade AI copilot.

Rules:
1) Be accurate, practical, and concise by default.
2) Structure answers with short headings and bullets when useful.
3) If a request is ambiguous, state assumptions briefly.
4) Never fabricate facts; say what you are unsure about.
5) Keep tone professional and modern.
"""

STYLE_INSTRUCTIONS = {
    "concise": "Respond in 4-7 short lines. Prioritize direct action.",
    "balanced": "Respond with clarity and moderate detail using bullets.",
    "deep": "Respond with a deeper, step-by-step explanation and best practices.",
}

_raw_keys = [
    os.getenv("GEMINI_API_KEY"),
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
]
GEMINI_KEYS = list(dict.fromkeys([k for k in _raw_keys if k and "your_" not in k]))
_key_cycle = itertools.cycle(GEMINI_KEYS) if GEMINI_KEYS else None
_key_cooldowns: Dict[str, float] = {}

_LAST_ACTIVE_PROVIDER = "local"
_LAST_ERROR = ""
_GEMINI_WORKING_MODEL: str | None = None
_OLLAMA_AVAILABLE_LAST = False


async def call_with_timeout(coro, timeout: int = 15):
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        raise Exception("TIMEOUT")


def _update_diagnostics(provider: str, error: str | None = None) -> None:
    global _LAST_ACTIVE_PROVIDER, _LAST_ERROR
    _LAST_ACTIVE_PROVIDER = provider
    _LAST_ERROR = error or ""


def get_next_gemini_key() -> str | None:
    if not GEMINI_KEYS or _key_cycle is None:
        return None
    for _ in range(len(GEMINI_KEYS)):
        key = next(_key_cycle)
        if time.time() > _key_cooldowns.get(key, 0):
            return key
    return None


def set_key_cooldown(key: str, seconds: int = 90) -> None:
    _key_cooldowns[key] = time.time() + seconds


def _gemini_keys_available_count() -> int:
    now = time.time()
    return sum(1 for k in GEMINI_KEYS if now > _key_cooldowns.get(k, 0))


async def _is_ollama_available() -> bool:
    global _OLLAMA_AVAILABLE_LAST
    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            r = await client.get("http://localhost:11434/api/tags")
            _OLLAMA_AVAILABLE_LAST = r.status_code == 200
            return _OLLAMA_AVAILABLE_LAST
    except Exception:
        _OLLAMA_AVAILABLE_LAST = False
        return False


def get_runtime_mode() -> str:
    if GEMINI_KEYS and _gemini_keys_available_count() > 0:
        return "llm"
    if os.getenv("GROQ_API_KEY", ""):
        return "llm"
    return "local"


def get_provider_diagnostics() -> Dict[str, Any]:
    return {
        "active_provider": _LAST_ACTIVE_PROVIDER,
        "gemini_keys_total": len(GEMINI_KEYS),
        "gemini_keys_available": _gemini_keys_available_count(),
        "groq_available": bool(os.getenv("GROQ_API_KEY", "")),
        "ollama_available": _OLLAMA_AVAILABLE_LAST,
        "last_error": _LAST_ERROR,
        "runtime_mode": get_runtime_mode(),
        "gemini": {
            "working_model": _GEMINI_WORKING_MODEL,
            "cooldown_seconds": max(
                [0] + [int(v - time.time()) for v in _key_cooldowns.values() if v > time.time()]
            ),
            "last_error": _LAST_ERROR,
        },
    }


def _build_nlp_context(nlp_results: Dict[str, Any] | None) -> str:
    sentiment = (nlp_results or {}).get("sentiment", {})
    intent = (nlp_results or {}).get("intent", {})
    entities = (nlp_results or {}).get("entities", [])
    entity_summary = ", ".join([f"{e.get('text')} ({e.get('label')})" for e in entities[:5]]) or "none"
    return (
        "[NLP Analysis]\n"
        f"Sentiment: {sentiment.get('label', 'unknown')} ({sentiment.get('compound', 0.0)})\n"
        f"Intent: {intent.get('top_intent', 'unknown')} ({intent.get('confidence', 0.0):.0%})\n"
        f"Entities: {entity_summary}"
    )


def _build_messages(
    history: List[Dict[str, Any]],
    user_message: str,
    response_style: str,
    nlp_results: Dict[str, Any] | None = None,
    rag_context: str = "",
) -> List[Dict[str, str]]:
    style_prompt = STYLE_INSTRUCTIONS.get(response_style, STYLE_INSTRUCTIONS["balanced"])
    messages: List[Dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    if rag_context:
        messages.append({"role": "system", "content": rag_context})
    messages.append({"role": "system", "content": _build_nlp_context(nlp_results)})
    messages.append({"role": "system", "content": f"Response style: {style_prompt}"})
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})
    return messages


async def _call_gemini(
    user_message: str,
    history: List[Dict[str, Any]],
    nlp_results: Dict[str, Any],
    response_style: str,
    temperature: float,
    api_key: str,
    rag_context: str,
) -> str:
    global _GEMINI_WORKING_MODEL
    messages = _build_messages(history, user_message, response_style, nlp_results, rag_context)
    text_prompt = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages])
    requested_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    candidate_models = [m for m in dict.fromkeys([_GEMINI_WORKING_MODEL, requested_model, "gemini-1.5-flash", "gemini-1.5-flash-latest"]) if m]

    payload = {
        "contents": [{"parts": [{"text": text_prompt}]}],
        "generationConfig": {
            "temperature": max(0.0, min(temperature, 1.0)),
            "maxOutputTokens": 800,
        },
    }
    async with httpx.AsyncClient(timeout=35.0) as client:
        for model in candidate_models:
            for base in ["v1beta", "v1"]:
                url = f"https://generativelanguage.googleapis.com/{base}/models/{model}:generateContent?key={api_key}"
                resp = await client.post(url, json=payload)
                if resp.status_code == 404:
                    continue
                if resp.status_code == 429:
                    raise RuntimeError("429 Gemini quota/rate limit")
                resp.raise_for_status()
                data = resp.json()
                parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                text = "".join([p.get("text", "") for p in parts]).strip()
                if text:
                    _GEMINI_WORKING_MODEL = model
                    return text
    raise RuntimeError("Gemini returned empty response")


def _call_groq_sync(messages: List[Dict[str, str]]) -> str:
    from groq import Groq

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=1024,
    )
    return (response.choices[0].message.content or "").strip()


async def _call_groq(
    user_message: str,
    history: List[Dict[str, Any]],
    nlp_results: Dict[str, Any],
    response_style: str,
    rag_context: str,
) -> str:
    messages = _build_messages(history, user_message, response_style, nlp_results, rag_context)
    return await asyncio.to_thread(_call_groq_sync, messages)


async def _call_ollama(
    user_message: str,
    history: List[Dict[str, Any]],
    nlp_results: Dict[str, Any],
    response_style: str,
    rag_context: str,
) -> str:
    payload = {
        "model": "qwen2.5-coder:7b",
        "messages": _build_messages(history, user_message, response_style, nlp_results, rag_context),
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post("http://localhost:11434/api/chat", json=payload)
        resp.raise_for_status()
        return (resp.json().get("message", {}).get("content", "") or "").strip()


def _smart_template_response(user_message: str, nlp_results: Dict[str, Any]) -> str:
    msg = user_message.strip()
    lower = msg.lower()
    intent = nlp_results.get("intent", {}).get("top_intent", "unknown")

    if intent == "greeting" or any(w in lower for w in ["hello", "hi", "hey"]):
        return "Hey! I’m NOVA. I can help with setup guides, debugging, architecture, and code generation."

    if "mongodb" in lower and any(k in lower for k in ["setup", "set up", "install", "configure"]):
        return (
            "To set up MongoDB on a new device:\n"
            "1) Download MongoDB Community Server from mongodb.com/try/download/community\n"
            "2) Install it and enable MongoDB service during setup\n"
            "3) Add MongoDB `bin` to PATH (`mongod`, `mongosh`)\n"
            "4) Start service (Windows Services / Linux `sudo systemctl start mongod`)\n"
            "5) Connect with MongoDB Compass or `mongosh`\n\n"
            "Node.js quick start:\n"
            "- `npm install mongoose`\n"
            "- `mongoose.connect(\"mongodb://127.0.0.1:27017/yourdb\")`"
        )

    if any(k in lower for k in ["linked list", "what is a linked list"]):
        return (
            "A linked list is a linear data structure where each node stores data and a pointer to the next node.\n"
            "It supports efficient insert/delete (especially in middle) but slower random access than arrays."
        )

    if any(k in lower for k in ["calculator in c", "create a calculator in c", "c calculator"]):
        return (
            "Here is a basic C calculator skeleton:\n\n"
            "```c\n"
            "#include <stdio.h>\n\n"
            "int main() {\n"
            "    double a, b;\n"
            "    char op;\n"
            "    // 1) Read first number\n"
            "    // 2) Read operator (+, -, *, /)\n"
            "    // 3) Read second number\n"
            "    // 4) Compute using switch(op)\n"
            "    // 5) Print result\n"
            "    return 0;\n"
            "}\n"
            "```"
        )

    if intent in ["command", "request"] or any(k in lower for k in ["how to", "setup", "install", "configure", "steps"]):
        return (
            f"Step-by-step plan for: {msg}\n"
            "1) Confirm prerequisites/tools\n"
            "2) Install or configure core components\n"
            "3) Verify with a small test command\n"
            "4) Add optional integration (API/app layer)\n"
            "5) Document and automate with scripts"
        )

    if intent == "question" or lower.endswith("?"):
        return (
            f"Direct answer: {msg}\n"
            "If you want, I can also provide a concise version, a deep explanation, or a practical example."
        )

    if any(k in lower for k in ["code", "program", "function", "snippet"]):
        return (
            "Code starter template:\n"
            "1) Define inputs and expected output\n"
            "2) Add validation checks\n"
            "3) Implement core logic in a reusable function\n"
            "4) Add sample test cases"
        )

    return (
        "Got it. Share your target output format (code/plan/summary), constraints, and language, "
        "and I’ll generate a production-ready first draft."
    )


async def get_llm_response(
    user_message: str,
    history: List[Dict[str, Any]],
    nlp_results: Dict[str, Any],
    response_style: str = "balanced",
    temperature: float = 0.4,
    session_id: str = "default",
) -> str:
    # Retrieve semantically similar past exchanges
    similar_context = retrieve_similar(session_id, user_message, top_k=3)

    rag_context = ""
    if similar_context:
        rag_context = "\n\n[Relevant past context from memory:]\n"
        for item in similar_context:
            rag_context += f"- {item['document'][:300]}\n"
            rag_context += f"  (similarity: {item['score']})\n"

    # 1) Groq as Primary
    if os.getenv("GROQ_API_KEY", ""):
        try:
            text = await call_with_timeout(
                _call_groq(user_message, history, nlp_results, response_style, rag_context),
                timeout=15,
            )
            if text:
                _update_diagnostics("groq", None)
                store_exchange(session_id, user_message, text)
                return text
        except Exception as e:
            _update_diagnostics("groq", str(e))

    # 2) Gemini with key rotation + per-key cooldown
    if GEMINI_KEYS:
        for _ in range(len(GEMINI_KEYS)):
            key = get_next_gemini_key()
            if not key:
                break
            try:
                text = await call_with_timeout(
                    _call_gemini(
                        user_message=user_message,
                        history=history,
                        nlp_results=nlp_results,
                        response_style=response_style,
                        temperature=temperature,
                        api_key=key,
                        rag_context=rag_context,
                    ),
                    timeout=15,
                )
                _update_diagnostics("gemini", None)
                store_exchange(session_id, user_message, text)
                return text
            except Exception as e:
                err = str(e)
                if "429" in err or "quota" in err.lower() or "rate limit" in err.lower():
                    set_key_cooldown(key, 90)
                    _update_diagnostics("gemini", err)
                    continue
                if "TIMEOUT" in err:
                    _update_diagnostics("gemini", "TIMEOUT")
                    continue
                _update_diagnostics("gemini", err)
                break

    # 3) Ollama fallback
    try:
        if await _is_ollama_available():
            text = await call_with_timeout(
                _call_ollama(user_message, history, nlp_results, response_style, rag_context),
                timeout=15,
            )
            if text:
                _update_diagnostics("ollama", None)
                store_exchange(session_id, user_message, text)
                return text
    except Exception as e:
        _update_diagnostics("ollama", str(e))

    # 4) Smart Template fallback (guaranteed)
    _update_diagnostics("local", None)
    text = _smart_template_response(user_message, nlp_results)
    store_exchange(session_id, user_message, text)
    return text


def _default_followups() -> List[str]:
    return [
        "Can you simplify this?",
        "Show me a practical example",
        "What should I do next?",
    ]


async def generate_followups(
    llm_response_text: str,
    history: List[Dict[str, Any]],
    response_style: str,
    nlp_results: Dict[str, Any],
) -> List[str]:
    prompt = (
        "Generate exactly 3 short follow-up questions based on this assistant response. "
        "Return ONLY a JSON array of 3 strings.\n\n"
        f"Response:\n{llm_response_text}"
    )
    try:
        text = await get_llm_response(
            user_message=prompt,
            history=history,
            nlp_results=nlp_results,
            response_style="concise",
            temperature=0.2,
        )
        parsed = json.loads(text)
        if isinstance(parsed, list) and len(parsed) >= 3:
            return [str(x) for x in parsed[:3]]
    except Exception:
        pass
    return _default_followups()
