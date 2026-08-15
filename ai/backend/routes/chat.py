from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..services.rag_service import retrieve_rag_context
from ..services.groq_service import generate_ai_response

router = APIRouter()

class ChatMessage(BaseModel):
    sender: str
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., max_length=1000, description="User query message")
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    success: bool = True
    answer: str
    sources: List[str] = []

@router.post("/chat", response_model=ChatResponse)
async def process_chat(request: ChatRequest):
    user_query = request.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # 1. Retrieve RAG Context from Supabase Vector DB
    context_chunks = retrieve_rag_context(user_query, match_count=4)

    # 2. Format history
    history_list = [{"sender": m.sender, "content": m.content} for m in request.history] if request.history else []

    # 3. Generate response using Groq LLM (handles general & marketplace queries in user's language)
    result = generate_ai_response(user_query, context_chunks, history_list)

    return ChatResponse(
        success=True,
        answer=result["answer"],
        sources=result.get("sources", [])
    )
