"""
NOVA Vector Memory — RAG layer using ChromaDB
Stores past conversation pairs as embeddings.
Retrieves semantically similar context for each new query.
"""

import hashlib
import os
import time

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

# --- Init embedding model (loads once, cached globally) ---
_embed_model = None


def get_embed_model():
    global _embed_model
    if _embed_model is None:
        _embed_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embed_model


# --- Init ChromaDB (persistent local storage) ---
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_store")

_chroma_client = None


def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(
            path=CHROMA_PATH,
            settings=Settings(anonymized_telemetry=False),
        )
    return _chroma_client


def get_collection(session_id: str):
    """Get or create a ChromaDB collection for this session."""
    client = get_chroma_client()
    # Collection names must be alphanumeric + underscores
    safe_name = "nova_" + session_id.replace("-", "_")
    return client.get_or_create_collection(
        name=safe_name,
        metadata={"hnsw:space": "cosine"},
    )


# --- Core RAG functions ---

def store_exchange(session_id: str, user_message: str, assistant_response: str):
    """
    Embed and store a conversation exchange in ChromaDB.
    Called AFTER every successful LLM response.
    """
    try:
        collection = get_collection(session_id)
        model = get_embed_model()

        # Combine user + assistant for richer embedding context
        combined_text = f"User: {user_message}\nAssistant: {assistant_response}"
        embedding = model.encode(combined_text).tolist()

        # Unique ID: hash of session + timestamp
        doc_id = hashlib.md5(
            f"{session_id}_{time.time()}".encode()
        ).hexdigest()

        collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[combined_text],
            metadatas=[{
                "session_id": session_id,
                "timestamp": time.time(),
                "user_message": user_message[:500],
                "assistant_preview": assistant_response[:500],
            }],
        )
    except Exception as e:
        # RAG store failure must never crash the main chat flow
        print(f"[vector_memory] store_exchange error: {e}")


def retrieve_similar(session_id: str, query: str, top_k: int = 3) -> list[dict]:
    """
    Find top_k most semantically similar past exchanges for this session.
    Returns list of dicts with 'user_message', 'assistant_preview', 'score'.
    Called BEFORE LLM to inject relevant memory.
    """
    try:
        collection = get_collection(session_id)

        # Need at least 1 stored document to query
        if collection.count() == 0:
            return []

        model = get_embed_model()
        query_embedding = model.encode(query).tolist()

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count()),
            include=["documents", "metadatas", "distances"],
        )

        similar = []
        for i, doc in enumerate(results["documents"][0]):
            distance = results["distances"][0][i]
            score = 1 - distance  # cosine similarity (higher = more similar)

            # Only include if similarity is meaningful (>0.3)
            if score > 0.3:
                similar.append({
                    "document": doc,
                    "user_message": results["metadatas"][0][i].get("user_message", ""),
                    "assistant_preview": results["metadatas"][0][i].get("assistant_preview", ""),
                    "score": round(score, 3),
                })

        return similar

    except Exception as e:
        print(f"[vector_memory] retrieve_similar error: {e}")
        return []


def delete_session_memory(session_id: str):
    """
    Delete all vector memory for a session.
    Called when POST /clear is triggered.
    """
    try:
        client = get_chroma_client()
        safe_name = "nova_" + session_id.replace("-", "_")
        client.delete_collection(safe_name)
    except Exception as e:
        print(f"[vector_memory] delete_session_memory error: {e}")


def get_session_memory_count(session_id: str) -> int:
    """Return how many exchanges are stored for this session."""
    try:
        collection = get_collection(session_id)
        return collection.count()
    except Exception:
        return 0
