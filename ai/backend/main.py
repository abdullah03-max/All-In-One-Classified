from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes.chat import router as chat_router

app = FastAPI(
    title="All In One Classified AI Assistant Backend",
    description="FastAPI Backend for Groq LLM & Supabase pgvector RAG",
    version="2.0.0"
)

# Enable CORS for Vercel Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach API routes
app.include_router(chat_router, prefix="/api")

@app.get("/")
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "All In One Classified AI Engine",
        "model": settings.GROQ_MODEL,
        "supabase_connected": bool(settings.SUPABASE_URL)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai.backend.main:app", host="0.0.0.0", port=8000, reload=True)
