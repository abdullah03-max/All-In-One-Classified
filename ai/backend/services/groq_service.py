import json
import urllib.request
from typing import List, Dict, Any, Optional
from ..config import settings

SYSTEM_INSTRUCTION = """You are the official conversational AI Assistant for "All In One Classified" marketplace in Pakistan.

YOUR CAPABILITIES & BEHAVIOR:
1. MULTILINGUAL AUTOMATIC DETECTION:
   - Detect the user's input language automatically: English, Urdu (اردو), Roman Urdu (e.g. "ma ad kaisy post kro?", "yar mobile sell karna hai"), or mixed English-Urdu.
   - Respond fluently in the EXACT SAME LANGUAGE and tone as the user!
   - If the user speaks Roman Urdu, reply naturally in friendly Roman Urdu!
   - If the user speaks Urdu, reply in proper Urdu (اردو)!
   - If the user speaks English, reply in clear English!

2. GENERAL AI KNOWLEDGE:
   - For general questions ("Hello", "How are you?", "What is Python?", "What is Artificial Intelligence?", "Who was Albert Einstein?"), answer naturally and accurately using your general knowledge in the user's language!
   - DO NOT say "I don't have information about this" for general knowledge questions!

3. MARKETPLACE KNOWLEDGE:
   - For questions about All In One Classified Marketplace (posting ads, categories, subcategories, product conditions [New, Used, Refurbished, Open Box], Safepay promotion payments, seller verification, text & voice messaging), use the RETRIEVED MARKETPLACE CONTEXT below.
   - Do NOT invent non-existent marketplace features. If a specific feature is truly not supported on the marketplace, state kindly:
     "Currently, our marketplace does not support that feature." (or in Roman Urdu: "Filhal humare marketplace par ye feature available nahi hai.")

4. ACCURACY & CONVERSATION:
   - Remember previous conversation context for follow-up questions.
   - Use clean, structured Markdown formatting (bolding, lists, bullet points).

--- RETRIEVED MARKETPLACE CONTEXT ---
{context}
-------------------------------------
"""

def generate_ai_response(
    user_query: str,
    context_chunks: List[Dict[str, Any]],
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """Generates LLM response using Groq API with RAG context & multilingual reasoning."""
    
    # Format retrieved context
    if context_chunks:
        formatted_context = "\n\n".join([
            f"[Source: {doc.get('source', 'marketplace_kb')}]\n{doc.get('content', '')}"
            for doc in context_chunks
        ])
    else:
        formatted_context = "No specific marketplace vector chunks retrieved for this query. Use general knowledge or guide the user politely."

    system_prompt = SYSTEM_INSTRUCTION.format(context=formatted_context)

    messages = [{"role": "system", "content": system_prompt}]

    # Append past conversation history (last 6 messages)
    if conversation_history:
        for msg in conversation_history[-6:]:
            role = "assistant" if msg.get("sender") == "assistant" else "user"
            messages.append({"role": role, "content": msg.get("content", "")})

    messages.append({"role": "user", "content": user_query})

    # Call Groq API
    if settings.GROQ_API_KEY:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.GROQ_API_KEY}"
            }
            payload = {
                "model": settings.GROQ_MODEL,
                "messages": messages,
                "temperature": 0.4,
                "max_tokens": 700
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if answer.strip():
                    return {
                        "answer": answer.strip(),
                        "sources": list(set([doc.get("source", "knowledge_base") for doc in context_chunks]))
                    }
        except Exception as e:
            print(f"Groq API Error: {e}")

    # Intelligent Fallback if API key unavailable
    fallback_answer = generate_smart_fallback(user_query, context_chunks)
    return {
        "answer": fallback_answer,
        "sources": list(set([doc.get("source", "knowledge_base") for doc in context_chunks]))
    }


def generate_smart_fallback(query: str, context_chunks: List[Dict[str, Any]]) -> str:
    """Intelligent fallback for offline/development environments."""
    q_lower = query.lower()

    if any(greeting in q_lower for greeting in ["hello", "hi", "hey", "aoa", "salam"]):
        return "Walaikumasalam! Welcome to **All In One Classified** AI Assistant! How can I help you today?"
    
    if "python" in q_lower:
        return "Python is a popular high-level programming language known for its easy readability, versatility, and extensive libraries in web development, AI, data analysis, and automation!"

    if "ai" in q_lower or "artificial intelligence" in q_lower:
        return "Artificial Intelligence (AI) refers to computer systems engineered to simulate human intelligence, including learning, reasoning, pattern recognition, and decision making."

    if any(kw in q_lower for kw in ["post", "ad", "sell", "ishtahar"]):
        return "To post an ad on **All In One Classified**:\n1. Click **'Post Ad'** at the top.\n2. Choose Category & Subcategory.\n3. Enter details (Title, Description, Price in PKR, Product Condition: New/Used/Refurbished/Open Box).\n4. Upload photos and click **Submit**!"

    if any(kw in q_lower for kw in ["promote", "featured", "urgent", "safepay"]):
        return "You can promote your listing with **Safepay Online Payment**:\n- **Urgent Badge**: PKR 500 (7 Days)\n- **Featured Ad**: PKR 1,200 (15 Days - Top Placement!)\n- **Premium VIP**: PKR 2,500 (30 Days)\n\nGo to **Dashboard → My Listings** and click **🚀 Promote**!"

    if context_chunks:
        return context_chunks[0].get("content", "I am happy to assist you with any questions about our marketplace or general topics!")

    return "I am here to help you! You can ask me anything about All In One Classified marketplace, or any general topic."
