import json
import urllib.request
from typing import Dict, Any, List
from ..config import settings
from .prompt import SYSTEM_PROMPT, FALLBACK_SYSTEM_PROMPT, build_prompt_context

def generate_groq_response(user_message: str, docs: List[Dict[str, Any]], history: List[Dict[str, str]] = None) -> str:
    """Invokes Groq API securely server-side using llama-3.3-70b-versatile or configured model."""
    if not settings.GROQ_API_KEY:
        # Fallback offline simulation when GROQ_API_KEY is not configured yet
        return generate_mock_rag_response(user_message, docs)

    context_str = build_prompt_context(docs)
    system_instruction = SYSTEM_PROMPT.format(context=context_str) if docs else FALLBACK_SYSTEM_PROMPT

    messages = [{"role": "system", "content": system_instruction}]

    # Append brief user conversation history (up to last 4 messages)
    if history:
        for msg in history[-4:]:
            role = "assistant" if msg.get("sender") == "assistant" else "user"
            messages.append({"role": role, "content": msg.get("content", "")})

    messages.append({"role": "user", "content": user_message})

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.GROQ_API_KEY}"
    }

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 500
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            answer = res_data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return answer.strip() or "I don't have enough information about that yet."
    except Exception as e:
        print(f"Groq API Error: {e}")
        return generate_mock_rag_response(user_message, docs)


def generate_mock_rag_response(query: str, docs: List[Dict[str, Any]]) -> str:
    """Fallback response generator if Groq API key is missing or unreachable."""
    q_lower = query.lower()
    
    if "post" in q_lower or "ad" in q_lower or "sell" in q_lower:
        return "To post an ad on **All In One Classified**:\n1. Click the **'Post Ad'** button in the header.\n2. Choose your Category and Subcategory.\n3. Fill in product details (title, description, price, condition).\n4. Upload images and select your city.\n5. Click **Submit Ad**!"
    elif "promote" in q_lower or "featured" in q_lower or "payment" in q_lower or "safepay" in q_lower:
        return "You can promote your ad using **Safepay Online Payment**:\n- **Urgent Badge**: PKR 500 (7 Days)\n- **Featured Ad**: PKR 1,200 (15 Days - Pins to Top!)\n- **Premium VIP**: PKR 2,500 (30 Days)\n\nGo to your **Dashboard -> My Listings** and click **🚀 Promote**!"
    elif "verify" in q_lower or "account" in q_lower:
        return "To verify your account, go to **Dashboard -> Account Verification**, fill in your CNIC details, and submit for review. Verified accounts receive a blue verification badge!"
    elif docs:
        return docs[0].get("content", "I don't have enough information about that yet.")
    else:
        return "I don't have enough information about that yet."
