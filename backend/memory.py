"""
Session Memory Manager for NOVA Chatbot.
Stores conversation history in a Python dict (no external DB needed).
Keeps last 10 turns per session for context-aware responses.
"""

from typing import Dict, List, Optional
import uuid
from datetime import datetime, timedelta


# In-memory session store: { session_id: { messages: [...], created_at: str } }
_sessions: Dict[str, dict] = {}

MAX_TURNS = 10
MAX_SESSIONS = 500
SESSION_TTL_MINUTES = 120


def _parse_dt(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except Exception:
        return datetime.now()


def _prune_sessions() -> None:
    """Best-effort in-memory pruning for long-running processes."""
    if not _sessions:
        return

    now = datetime.now()
    ttl_cutoff = now - timedelta(minutes=SESSION_TTL_MINUTES)

    expired_ids = []
    for sid, data in _sessions.items():
        msgs = data.get("messages", [])
        created = _parse_dt(data.get("created_at", now.isoformat()))
        last_seen_raw = data.get("last_seen_at", data.get("created_at", now.isoformat()))
        last_seen = _parse_dt(last_seen_raw)

        # Remove idle + empty sessions aggressively, old sessions conservatively.
        if (not msgs and last_seen < ttl_cutoff) or (created < now - timedelta(hours=12)):
            expired_ids.append(sid)

    for sid in expired_ids:
        _sessions.pop(sid, None)

    # Safety cap if session count still exceeds threshold.
    if len(_sessions) > MAX_SESSIONS:
        sorted_items = sorted(
            _sessions.items(),
            key=lambda item: _parse_dt(item[1].get("last_seen_at", item[1].get("created_at", now.isoformat()))),
        )
        overflow = len(_sessions) - MAX_SESSIONS
        for sid, _ in sorted_items[:overflow]:
            _sessions.pop(sid, None)


def get_or_create_session(session_id: Optional[str] = None, user_id: Optional[int] = None) -> str:
    """Get existing session or create a new one. Returns session_id."""
    _prune_sessions()

    if session_id and session_id in _sessions:
        if user_id is not None:
            _sessions[session_id]["user_id"] = user_id
        _sessions[session_id]["last_seen_at"] = datetime.now().isoformat()
        return session_id
    
    new_id = session_id or str(uuid.uuid4())
    _sessions[new_id] = {
        "messages": [],
        "created_at": datetime.now().isoformat(),
        "last_seen_at": datetime.now().isoformat(),
        "user_id": user_id,
    }
    return new_id


def link_session_to_user(session_id: str, user_id: int) -> None:
    """Associate an existing session with a user id."""
    if session_id not in _sessions:
        get_or_create_session(session_id, user_id=user_id)
        return
    _sessions[session_id]["user_id"] = user_id
    _sessions[session_id]["last_seen_at"] = datetime.now().isoformat()


def add_message(session_id: str, role: str, content: str) -> None:
    """Add a message to session history. Trims to MAX_TURNS pairs."""
    if session_id not in _sessions:
        get_or_create_session(session_id)
    
    _sessions[session_id]["messages"].append({
        "role": role,
        "content": content,
        "timestamp": datetime.now().isoformat(),
    })
    _sessions[session_id]["last_seen_at"] = datetime.now().isoformat()
    
    # Keep only the last MAX_TURNS * 2 messages (user + assistant pairs)
    msgs = _sessions[session_id]["messages"]
    if len(msgs) > MAX_TURNS * 2:
        _sessions[session_id]["messages"] = msgs[-(MAX_TURNS * 2):]


def get_history(session_id: str) -> List[dict]:
    """Get conversation history for a session."""
    if session_id not in _sessions:
        return []
    _sessions[session_id]["last_seen_at"] = datetime.now().isoformat()
    return _sessions[session_id]["messages"]


def get_memory_length(session_id: str) -> int:
    """Get number of conversation turns (message pairs) in memory."""
    if session_id not in _sessions:
        return 0
    return len(_sessions[session_id]["messages"])


def clear_session(session_id: str) -> bool:
    """Clear a session's memory. Returns True if session existed."""
    if session_id in _sessions:
        _sessions[session_id]["messages"] = []
        _sessions[session_id]["last_seen_at"] = datetime.now().isoformat()
        return True
    return False


def get_all_sessions() -> Dict[str, dict]:
    """Get summary of all active sessions."""
    _prune_sessions()
    return {
        sid: {
            "message_count": len(data["messages"]),
            "created_at": data["created_at"],
            "last_seen_at": data.get("last_seen_at", data["created_at"]),
            "user_id": data.get("user_id"),
        }
        for sid, data in _sessions.items()
    }
