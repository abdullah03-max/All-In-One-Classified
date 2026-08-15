import re
import math
import json
import urllib.request
from typing import List, Dict, Any
from ..config import settings

def generate_query_embedding(text: str, dim: int = 384) -> List[float]:
    """Generates 384-dimensional query vector matching ingestion embedding format."""
    words = re.findall(r'\w+', text.lower())
    vec = [0.0] * dim
    if not words:
        return vec
        
    for word in words:
        h = hash(word)
        vec[h % dim] += 1.0
        vec[(h >> 8) % dim] += 0.5
        
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec

def retrieve_relevant_docs(query: str, match_count: int = 4, threshold: float = 0.15) -> List[Dict[str, Any]]:
    """Calls Supabase RPC match_knowledge_documents to fetch relevant context chunks."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return []

    query_vec = generate_query_embedding(query, settings.EMBEDDING_DIM)
    
    url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/rpc/match_knowledge_documents"
    headers = {
        "Content-Type": "application/json",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}"
    }

    payload = {
        "query_embedding": query_vec,
        "match_threshold": threshold,
        "match_count": match_count
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Vector search retrieval notice: {e}")
        return []
