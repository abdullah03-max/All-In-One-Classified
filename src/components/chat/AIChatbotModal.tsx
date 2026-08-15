import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Sparkles, X, Send, Bot, User,
  RefreshCw, HelpCircle, ArrowRight, AlertCircle, ChevronDown
} from 'lucide-react';
import { Button } from '../ui';
import { cn } from '../../utils/helpers';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  "How do I post an ad?",
  "How can I promote my listing?",
  "How does payment work?",
  "How do I contact a seller?",
  "How can I verify my account?",
  "What categories are available?"
];

// Determine Backend Endpoint URL (FastAPI backend or Vercel serverless proxy fallback)
const API_BASE_URL = import.meta.env.VITE_AI_BACKEND_URL || 'https://all-in-one-classified.vercel.app';

interface AIChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatbotModal: React.FC<AIChatbotModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setError(null);
    setInput('');

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history payload
      const historyPayload = messages.slice(-4).map(m => ({
        sender: m.sender,
        content: m.content
      }));

      // Call Backend API
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const aiAnswer = data.answer || "I don't have enough information about that yet.";

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        content: aiAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      // Fallback offline response logic for seamless demo UX
      const fallbackAnswer = getFallbackResponse(query);
      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        content: fallbackAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Chat Modal / Drawer */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden",
              "bottom-0 right-0 w-full h-[85vh] sm:h-[600px] sm:w-[440px] sm:bottom-6 sm:right-6 sm:rounded-2xl"
            )}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                  <Bot size={22} className="text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    Marketplace AI Assistant
                    <span className="text-[10px] bg-emerald-400/30 text-emerald-200 px-2 py-0.5 rounded-full font-medium border border-emerald-300/30">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs text-primary-100">Instant answers about ads, payments & rules</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={handleClear}
                    title="Clear Conversation"
                    className="p-2 rounded-lg hover:bg-white/10 text-primary-100 hover:text-white transition-colors"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-primary-100 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4 shadow-inner">
                    <Sparkles size={28} />
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-base mb-1">
                    Welcome to AI Assistant!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                    Ask me anything about posting ads, Safepay checkout, account verification, or categories.
                  </p>

                  {/* Suggested Questions */}
                  <div className="w-full text-left space-y-2">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                      Suggested Questions:
                    </p>
                    <div className="flex flex-col gap-2">
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(q)}
                          className="text-left text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 text-slate-700 dark:text-slate-300 p-2.5 rounded-xl transition-all hover:shadow-sm flex items-center justify-between group"
                        >
                          <span>{q}</span>
                          <ArrowRight size={14} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 max-w-[88%]",
                      msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm",
                      msg.sender === 'user'
                        ? "bg-primary-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    )}>
                      {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>

                    <div>
                      <div className={cn(
                        "p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-line",
                        msg.sender === 'user'
                          ? "bg-primary-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                      <span className={cn(
                        "text-[10px] text-slate-400 mt-1 block px-1",
                        msg.sender === 'user' ? "text-right" : "text-left"
                      )}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex gap-3 mr-auto max-w-[85%]">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-xl p-1.5 border border-slate-200 dark:border-slate-700 focus-within:border-primary-500 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask AI anything about the marketplace..."
                  rows={1}
                  className="flex-1 bg-transparent text-xs sm:text-sm px-2 py-1 focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none max-h-24"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className={cn(
                    "p-2 rounded-lg transition-all shrink-0",
                    input.trim() && !loading
                      ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  )}
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                AI powered by RAG context & Groq LPU engine
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Fallback intelligent response matrix if server is starting or offline
function getFallbackResponse(query: str): string {
  const q = query.lower ? query.lower() : query.toLowerCase();
  
  if (q.includes("post") || q.includes("ad") || q.includes("sell")) {
    return "To post an ad on **All In One Classified**:\n1. Click **'Post Ad'** in the top navigation bar.\n2. Select your category & subcategory.\n3. Add title, description, price (PKR), product condition, and photos.\n4. Click **Submit Ad**!";
  }
  if (q.includes("promote") || q.includes("featured") || q.includes("payment") || q.includes("safepay")) {
    return "You can promote your listing using **Safepay Online Payment**:\n- **Urgent Badge**: PKR 500 (7 Days)\n- **Featured Ad**: PKR 1,200 (15 Days)\n- **Premium VIP**: PKR 2,500 (30 Days)\n\nGo to **Dashboard → My Listings** and click **🚀 Promote**!";
  }
  if (q.includes("verify") || q.includes("account")) {
    return "To get a verified seller badge, go to **Dashboard → Account Verification**, upload your CNIC details, and submit for admin approval.";
  }
  if (q.includes("contact") || q.includes("seller") || q.includes("chat") || q.includes("call")) {
    return "You can contact sellers using real-time text chat, voice notes, or direct browser audio calls from any ad details page!";
  }
  if (q.includes("category") || q.includes("categories")) {
    return "Available categories include: Vehicles, Real Estate, Electronics, Fashion, Mobile Phones, Jobs, Services, and Home Appliances.";
  }
  return "I don't have enough information about that yet.";
}

export default AIChatbotModal;
