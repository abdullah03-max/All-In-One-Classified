import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import settings
from .rag.retriever import retrieve_relevant_docs
from .rag.generator import generate_groq_response

app = FastAPI(
    title="All In One Classified AI Chatbot API",
    description="FastAPI Backend for RAG Retrieval & Groq LLM Generation",
    version="1.0.0"
)

# Enable CORS for Vercel Frontend & Local Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    sender: str
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., max_length=1000, description="User question (max 1000 characters)")
    conversation_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    success: bool
    answer: str
    sources: List[str] = []

@app.get("/")
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "All In One Classified AI Assistant API",
        "model": settings.GROQ_MODEL,
        "supabase_connected": bool(settings.SUPABASE_URL)
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    user_query = request.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    # 1. Retrieve relevant RAG context from Supabase pgvector
    docs = retrieve_relevant_docs(user_query, match_count=4)
    sources = list(set([doc.get("source", "knowledge_base") for doc in docs]))

    # 2. Convert conversation history to list of dicts
    history_list = [{"sender": m.sender, "content": m.content} for m in request.history] if request.history else []

    # 3. Generate answer via Groq LLM
    answer = generate_groq_response(user_query, docs, history_list)

    return ChatResponse(
        success=True,
        answer=answer,
        sources=sources
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai.backend.main:app", host="0.0.0.0", port=8000, reload=True)
