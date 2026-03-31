"""ChromaDB-backed semantic memory for session-scoped retrieval."""

from __future__ import annotations

import os
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List

import chromadb
from sentence_transformers import SentenceTransformer

_HERE = os.path.dirname(os.path.abspath(__file__))
_CHROMA_DIR = os.path.join(_HERE, ".chroma")
_BASE_COLLECTION = "nova_memory"
_EMBED_MODEL = os.getenv("VECTOR_EMBED_MODEL", "all-MiniLM-L6-v2")
_VECTOR_ENABLED = os.getenv("VECTOR_MEMORY_ENABLED", "true").lower() in {"1", "true", "yes", "on"}

_client = None
_embedder = None


def _get_client():
    if not _VECTOR_ENABLED:
        raise RuntimeError("Vector memory is disabled")
    global _client
    if _client is None:
        os.makedirs(_CHROMA_DIR, exist_ok=True)
        _client = chromadb.PersistentClient(path=_CHROMA_DIR)
    return _client


def _get_embedder() -> SentenceTransformer:
    if not _VECTOR_ENABLED:
        raise RuntimeError("Vector memory is disabled")
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(_EMBED_MODEL)
    return _embedder


def _session_collection_name(session_id: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9_-]", "_", session_id)[:80]
    return f"{_BASE_COLLECTION}__{safe}"


def _get_collection(session_id: str):
    client = _get_client()
    return client.get_or_create_collection(name=_session_collection_name(session_id))


def _embed_texts(texts: List[str]) -> List[List[float]]:
    model = _get_embedder()
    vectors = model.encode(texts, normalize_embeddings=True)
    return vectors.tolist()


def _build_exchange_text(user_message: str, assistant_message: str) -> str:
    return f"User: {user_message}\nAssistant: {assistant_message}"


def upsert_exchange(session_id: str, user_message: str, assistant_message: str) -> None:
    """Embed and upsert a single user-assistant exchange into session collection."""
    text = _build_exchange_text(user_message, assistant_message)
    vector = _embed_texts([text])[0]
    collection = _get_collection(session_id)

    doc_id = str(uuid.uuid4())
    collection.upsert(
        ids=[doc_id],
        embeddings=[vector],
        documents=[text],
        metadatas=[
            {
                "session_id": session_id,
                "created_at": datetime.utcnow().isoformat(),
                "type": "exchange",
            }
        ],
    )


def query_similar_exchanges(session_id: str, user_message: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Return top-k semantically similar past exchanges for a session."""
    collection = _get_collection(session_id)
    query_embedding = _embed_texts([user_message])[0]
    result = collection.query(
        query_embeddings=[query_embedding],
        n_results=max(1, top_k),
        include=["documents", "metadatas", "distances"],
    )

    documents = (result.get("documents") or [[]])[0]
    metadatas = (result.get("metadatas") or [[]])[0]
    distances = (result.get("distances") or [[]])[0]

    matches: List[Dict[str, Any]] = []
    for idx, doc in enumerate(documents):
        matches.append(
            {
                "document": doc,
                "metadata": metadatas[idx] if idx < len(metadatas) else {},
                "distance": distances[idx] if idx < len(distances) else None,
            }
        )
    return matches
