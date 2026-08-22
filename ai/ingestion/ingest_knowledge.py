#!/usr/bin/env python3
"""
Knowledge Ingestion Script for All In One Classified AI Chatbot
Extracts text from platform documentation, chunks it into manageable snippets,
generates 384-dimensional vector embeddings, and stores them into Supabase pgvector database.
"""

import os
import sys
import json
import re
import math
import urllib.request
import urllib.parse
from typing import List, Dict, Any

# Environment settings
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

# Check Python embedding library availability
try:
    from fastembed import TextEmbedding
    HAS_FASTEMBED = True
    print("Using FastEmbed (all-MiniLM-L6-v2) for embeddings.")
except ImportError:
    try:
        from sentence_transformers import SentenceTransformer
        HAS_SENTENCE_TRANSFORMERS = True
        HAS_FASTEMBED = False
        print("Using SentenceTransformers (all-MiniLM-L6-v2) for embeddings.")
    except ImportError:
        HAS_FASTEMBED = False
        HAS_SENTENCE_TRANSFORMERS = False
        print("Notice: Neither fastembed nor sentence-transformers installed. Will fall back to Deterministic Feature Hashing for lightweight 384d vectors.")


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split long text into overlapping chunks based on sentence boundaries."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    
    current_chunk = ""
    for p in paragraphs:
        if len(current_chunk) + len(p) <= chunk_size:
            current_chunk += ("\n\n" if current_chunk else "") + p
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = p
            
    if current_chunk:
        chunks.append(current_chunk)
        
    return chunks


def hash_vector_fallback(text: str, dim: int = 384) -> List[float]:
    """Generates a normalized 384-dimensional pseudo-semantic vector using deterministic feature hashing."""
    words = re.findall(r'\w+', text.lower())
    vec = [0.0] * dim
    if not words:
        return vec
        
    for idx, word in enumerate(words):
        h = hash(word)
        vec[h % dim] += 1.0
        vec[(h >> 8) % dim] += 0.5
        
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec


def generate_embedding(text: str, model_obj: Any = None) -> List[float]:
    """Generate 384d vector embedding for input text."""
    if HAS_FASTEMBED and model_obj:
        embeddings = list(model_obj.embed([text]))
        return [float(x) for x in embeddings[0]]
    elif HAS_SENTENCE_TRANSFORMERS and model_obj:
        vec = model_obj.encode(text)
        return [float(x) for x in vec]
    else:
        return hash_vector_fallback(text, 384)


def upsert_to_supabase(documents: List[Dict[str, Any]]) -> bool:
    """Send knowledge document objects to Supabase REST endpoint."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables not set.")
        print(f"Prepared {len(documents)} document chunks locally.")
        return False

    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/knowledge_documents"
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "resolution=merge-duplicates"
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(documents).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Successfully upserted {len(documents)} chunks to Supabase! (HTTP Status {resp.status})")
            return True
    except Exception as e:
        print(f"Error upserting to Supabase: {e}")
        return False


def main():
    print("=== All In One Classified Knowledge Ingestion ===")
    
    # 1. Initialize embedding model
    embedding_model = None
    if HAS_FASTEMBED:
        embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
    elif HAS_SENTENCE_TRANSFORMERS:
        from sentence_transformers import SentenceTransformer
        embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

    # 2. Path to platform knowledge document
    kb_path = os.path.join(os.path.dirname(__file__), "..", "data", "platform_knowledge.md")
    if not os.path.exists(kb_path):
        kb_path = os.path.join(os.getcwd(), "ai", "data", "platform_knowledge.md")

    if not os.path.exists(kb_path):
        print(f"Error: Knowledge file not found at {kb_path}")
        sys.exit(1)

    with open(kb_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 3. Process sections into chunks
    sections = content.split("---")
    all_chunks = []

    for idx, section in enumerate(sections):
        section_text = section.strip()
        if not section_text:
            continue
            
        category = "general"
        if "Authentication" in section_text or "User Accounts" in section_text:
            category = "auth"
        elif "Categories" in section_text or "Posting" in section_text:
            category = "listings"
        elif "Communication" in section_text or "Voice" in section_text or "Calls" in section_text:
            category = "messaging"
        elif "Promotions" in section_text or "Safepay" in section_text or "Payment" in section_text:
            category = "payments"
        elif "Admin" in section_text or "Moderator" in section_text:
            category = "admin"
        elif "Development" in section_text or "Ownership" in section_text or "Leadership" in section_text:
            category = "ownership"
        elif "Rules" in section_text or "Policies" in section_text:
            category = "rules"

        chunks = chunk_text(section_text, chunk_size=450, overlap=50)
        for chunk in chunks:
            vector = generate_embedding(chunk, embedding_model)
            all_chunks.append({
                "content": chunk,
                "embedding": vector,
                "source": "platform_knowledge.md",
                "category": category,
                "metadata": {"section_index": idx, "char_count": len(chunk)}
            })

    print(f"Generated {len(all_chunks)} vector chunks from platform documentation.")
    
    # 4. Upsert to Supabase
    upsert_to_supabase(all_chunks)


if __name__ == "__main__":
    main()
