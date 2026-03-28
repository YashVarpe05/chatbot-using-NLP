"""
Session Memory Manager for NOVA Chatbot.
Stores conversation history in a Python dict (no external DB needed).
Keeps last 10 turns per session for context-aware responses.
"""

from typing import Dict, List, Optional
import uuid
from datetime import datetime


# In-memory session store: { session_id: { messages: [...], created_at: str } }
_sessions: Dict[str, dict] = {}

MAX_TURNS = 10


def get_or_create_session(session_id: Optional[str] = None) -> str:
    """Get existing session or create a new one. Returns session_id."""
    if session_id and session_id in _sessions:
        return session_id
    
    new_id = session_id or str(uuid.uuid4())
    _sessions[new_id] = {
        "messages": [],
        "created_at": datetime.now().isoformat(),
    }
    return new_id


def add_message(session_id: str, role: str, content: str) -> None:
    """Add a message to session history. Trims to MAX_TURNS pairs."""
    if session_id not in _sessions:
        get_or_create_session(session_id)
    
    _sessions[session_id]["messages"].append({
        "role": role,
        "content": content,
        "timestamp": datetime.now().isoformat(),
    })
    
    # Keep only the last MAX_TURNS * 2 messages (user + assistant pairs)
    msgs = _sessions[session_id]["messages"]
    if len(msgs) > MAX_TURNS * 2:
        _sessions[session_id]["messages"] = msgs[-(MAX_TURNS * 2):]


def get_history(session_id: str) -> List[dict]:
    """Get conversation history for a session."""
    if session_id not in _sessions:
        return []
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
        return True
    return False


def get_all_sessions() -> Dict[str, dict]:
    """Get summary of all active sessions."""
    return {
        sid: {
            "message_count": len(data["messages"]),
            "created_at": data["created_at"],
        }
        for sid, data in _sessions.items()
    }
