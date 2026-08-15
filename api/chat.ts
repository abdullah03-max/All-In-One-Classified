import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const SYSTEM_INSTRUCTION = `You are the official conversational AI Assistant for "All In One Classified" marketplace in Pakistan.

YOUR CAPABILITIES & BEHAVIOR:
1. MULTILINGUAL AUTOMATIC DETECTION:
   - Detect the user's input language automatically: English, Urdu (اردو), Roman Urdu (e.g. "ma ad kaisy post kro?", "yar mobile sell karna hai"), or mixed English-Urdu.
   - Respond fluently in the EXACT SAME LANGUAGE and tone as the user!
   - If the user speaks Roman Urdu, reply naturally in friendly Roman Urdu!
   - If the user speaks Urdu, reply in proper Urdu (اردو)!
   - If the user speaks English, reply in clear English!

2. GENERAL AI KNOWLEDGE:
   - For general questions ("Hello", "How are you?", "What is Python?", "What is Artificial Intelligence?", "Who was Albert Einstein?", "How do I create a website?"), answer naturally and accurately using your general AI knowledge in the user's language!
   - DO NOT say "I don't have information about this" for general knowledge questions!

3. MARKETPLACE KNOWLEDGE:
   - For questions about All In One Classified Marketplace (posting ads, account registration, categories, subcategories, product conditions [New, Used, Refurbished, Open Box], Safepay promotion payments, seller verification, text & voice messaging), use the RETRIEVED MARKETPLACE CONTEXT below.
   - Do NOT invent non-existent marketplace features. If a specific feature is truly not supported on the marketplace, state kindly:
     "Currently, our marketplace does not support that feature." (or in Roman Urdu: "Filhal humare marketplace par ye feature available nahi hai.")

4. ACCURACY & CONVERSATION:
   - Remember previous conversation context for follow-up questions.
   - Use clean, structured Markdown formatting (bolding, lists, bullet points).

--- RETRIEVED MARKETPLACE CONTEXT ---
{context}
-------------------------------------
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS Headers for local development and live Vercel domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history } = req.body || {};
    const userQuery = (message || '').trim();

    if (!userQuery) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // 1. Vector Similarity Search in Supabase pgvector
    let contextChunks: any[] = [];
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const queryVec = generateQueryVector(userQuery);
        const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_knowledge_documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            query_embedding: queryVec,
            match_threshold: 0.1,
            match_count: 4,
          }),
        });

        if (rpcRes.ok) {
          contextChunks = await rpcRes.json();
        }
      } catch (err) {
        console.warn('Vector search warning:', err);
      }
    }

    // 2. Build Prompt Context
    const contextText = Array.isArray(contextChunks) && contextChunks.length > 0
      ? contextChunks.map(c => `[Source: ${c.source || 'kb'}]\n${c.content}`).join('\n\n')
      : 'No specific vector chunks retrieved. Use general AI knowledge or marketplace guide.';

    const systemPrompt = SYSTEM_INSTRUCTION.replace('{context}', contextText);

    // 3. Format Conversation History
    const messages: any[] = [{ role: 'system', content: systemPrompt }];

    if (Array.isArray(history)) {
      for (const m of history.slice(-6)) {
        messages.push({
          role: m.sender === 'assistant' ? 'assistant' : 'user',
          content: m.content || '',
        });
      }
    }

    messages.push({ role: 'user', content: userQuery });

    // 4. Call Groq API securely using environment variable
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY environment variable is missing on server.' });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 750,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API Error:', errText);
      return res.status(500).json({ error: 'Groq API error', details: errText });
    }

    const groqData = await groqRes.json();
    const answer = groqData?.choices?.[0]?.message?.content || "I am here to help you!";

    return res.status(200).json({
      success: true,
      answer: answer.trim(),
      sources: Array.isArray(contextChunks) ? Array.from(new Set(contextChunks.map(c => c.source))) : [],
    });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

// Helper to generate 384d vector matching pgvector schema
function generateQueryVector(text: string): number[] {
  const dim = 384;
  const words = (text.toLowerCase().match(/\w+/g) || []);
  const vec = new Array(dim).fill(0);
  if (words.length === 0) return vec;

  for (const word of words) {
    let h = 0;
    for (let i = 0; i < word.length; i++) {
      h = (h << 5) - h + word.charCodeAt(i);
      h |= 0;
    }
    const absH = Math.abs(h);
    vec[absH % dim] += 1.0;
    vec[(absH >> 8) % dim] += 0.5;
  }

  const sumSq = vec.reduce((a, b) => a + b * b, 0);
  const norm = Math.sqrt(sumSq);
  return norm > 0 ? vec.map(x => x / norm) : vec;
}
