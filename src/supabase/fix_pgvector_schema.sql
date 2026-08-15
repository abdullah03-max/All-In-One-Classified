-- Enable pgvector extension for Supabase PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Create knowledge_documents table for project RAG embeddings
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(384) NOT NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create HNSW Vector Index for sub-millisecond similarity search
CREATE INDEX IF NOT EXISTS knowledge_documents_embedding_idx 
ON knowledge_documents 
USING hnsw (embedding vector_cosine_ops);

-- 3. Create RPC Similarity Search Function match_knowledge_documents
CREATE OR REPLACE FUNCTION match_knowledge_documents (
  query_embedding VECTOR(384),
  match_threshold FLOAT DEFAULT 0.25,
  match_count INT DEFAULT 5,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source TEXT,
  category TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.content,
    kd.source,
    kd.category,
    kd.metadata,
    (1 - (kd.embedding <=> query_embedding))::FLOAT AS similarity
  FROM knowledge_documents kd
  WHERE (filter_category IS NULL OR kd.category = filter_category)
    AND (1 - (kd.embedding <=> query_embedding)) >= match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Create AI Chat Conversations & Messages tables for history
CREATE TABLE IF NOT EXISTS ai_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read access to knowledge_documents via RPC function
CREATE POLICY "Public read knowledge_documents" 
ON knowledge_documents FOR SELECT USING (true);

-- User scoped RLS policies for chat history
CREATE POLICY "Users manage their own conversations" 
ON ai_chat_conversations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage their own messages" 
ON ai_chat_messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM ai_chat_conversations c 
    WHERE c.id = ai_chat_messages.conversation_id AND c.user_id = auth.uid()
  )
);
