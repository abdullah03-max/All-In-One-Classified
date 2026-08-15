import os

class Settings:
    # Groq API Credentials (Server-Side ONLY via Environment Variable)
    GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

    # Supabase Credentials
    SUPABASE_URL: str = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY", "")

    # Vector dimensions for all-MiniLM-L6-v2
    EMBEDDING_DIM: int = 384

settings = Settings()
