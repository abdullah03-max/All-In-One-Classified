import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Sparkles, X, Send, Bot, User,
  RefreshCw, Copy, Check, ArrowRight, Trash2, PlusCircle
} from 'lucide-react';
import { cn } from '../../utils/helpers';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  "How do I post an ad?",
  "ma ad kaisy post kro?",
  "How can I promote my listing?",
  "How does Safepay payment work?",
  "How do I verify my account?",
  "What categories are available?"
];

const API_BASE_URL = import.meta.env.VITE_AI_BACKEND_URL || '';

interface AIChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatbotModal: React.FC<AIChatbotModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      const historyPayload = messages.slice(-6).map(m => ({
        sender: m.sender,
        content: m.content
      }));

      let aiAnswer = '';

      // 1. Call Vercel Serverless / FastAPI Endpoint (/api/chat)
      try {
        const endpoint = API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/api/chat` : '/api/chat';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            history: historyPayload
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.answer) {
            aiAnswer = data.answer;
          }
        }
      } catch (err) {
        console.warn('API endpoint fetch attempt failed:', err);
      }

      // 2. Client fallback logic if serverless endpoint is offline
      if (!aiAnswer) {
        aiAnswer = generateClientFallback(query);
      }

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        content: aiAnswer || "I am here to help you!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Chatbot request error:', err);
      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        content: "I am here to help you! Ask me anything about All In One Classified marketplace, or any general question.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetry = (index: number) => {
    if (index > 0 && messages[index - 1].sender === 'user') {
      const lastQuery = messages[index - 1].content;
      setMessages(prev => prev.slice(0, index - 1));
      handleSend(lastQuery);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

          {/* Chat Modal Window */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden rounded-2xl transition-all",
              "bottom-4 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 w-auto sm:w-[420px] max-w-[calc(100vw-1.5rem)] h-[85vh] sm:h-[580px] max-h-[calc(100vh-3rem)]"
            )}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                  <Bot size={22} className="text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    Marketplace AI Assistant
                  </h3>
                  <p className="text-xs text-primary-100">Conversational AI for general & marketplace queries</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={handleNewConversation}
                    title="New Conversation"
                    className="p-2 rounded-lg hover:bg-white/10 text-primary-100 hover:text-white transition-colors"
                  >
                    <PlusCircle size={18} />
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

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3 shadow-inner">
                    <Sparkles size={28} />
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-base mb-1">
                    Ask Me Anything!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5">
                    I speak English, Urdu (اردو), and Roman Urdu. Ask about our marketplace or any general topic!
                  </p>

                  {/* Suggested Chips */}
                  <div className="w-full text-left space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                      Suggested Questions:
                    </p>
                    <div className="flex flex-col gap-1.5">
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
                messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 max-w-[90%]",
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

                    <div className="group relative">
                      <div className={cn(
                        "p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-line break-words max-w-full overflow-hidden",
                        msg.sender === 'user'
                          ? "bg-primary-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>

                      {/* Action buttons for AI messages */}
                      {msg.sender === 'assistant' && (
                        <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
                          <span>{msg.timestamp}</span>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors ml-2"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            {copiedId === msg.id ? 'Copied' : 'Copy'}
                          </button>
                          <button
                            onClick={() => handleRetry(index)}
                            className="hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                            title="Retry response"
                          >
                            <RefreshCw size={12} />
                            Retry
                          </button>
                        </div>
                      )}
                      {msg.sender === 'user' && (
                        <span className="text-[10px] text-slate-400 mt-1 block px-1 text-right">
                          {msg.timestamp}
                        </span>
                      )}
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
                  placeholder="Ask anything in English, Urdu, or Roman Urdu..."
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
                AI Assistant • English, Urdu & Roman Urdu Supported
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

function generateClientFallback(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("hello") || q.includes("hi") || q.includes("salam") || q.includes("aoa")) {
    return "Walaikumasalam! Welcome to **All In One Classified** AI Assistant! How can I assist you today?";
  }
  if (q.includes("python")) {
    return "Python is a high-level, multi-purpose programming language widely used in web development, artificial intelligence, machine learning, and data science!";
  }
  if (q.includes("ai") || q.includes("artificial intelligence")) {
    return "Artificial Intelligence (AI) is the simulation of human intelligence processes by computer algorithms, including machine learning, natural language processing, and automated reasoning.";
  }
  if (q.includes("post") || q.includes("ad") || q.includes("sell") || q.includes("kaisy") || q.includes("kaise") || q.includes("پوسٹ")) {
    return "To post an ad on **All In One Classified**:\n1. Click **'Post Ad'** at the top.\n2. Select your Category & Subcategory.\n3. Add title, description, price (PKR), product condition (New, Used, Refurbished, Open Box).\n4. Upload photos and click **Submit**!";
  }
  if (q.includes("promote") || q.includes("featured") || q.includes("urgent") || q.includes("safepay") || q.includes("payment")) {
    return "You can promote your listing using **Safepay Online Payment**:\n- **Urgent Badge**: PKR 500 (7 Days)\n- **Featured Ad**: PKR 1,200 (15 Days)\n- **Premium VIP**: PKR 2,500 (30 Days)\n\nGo to **Dashboard → My Listings** and click **🚀 Promote**!";
  }
  if (q.includes("verify") || q.includes("account")) {
    return "To get a verified seller badge, go to **Dashboard → Account Verification**, upload your CNIC details, and submit for admin approval.";
  }
  if (q.includes("contact") || q.includes("seller") || q.includes("chat") || q.includes("call")) {
    return "You can contact sellers using real-time text chat, voice notes, or viewing the verified seller phone number!";
  }
  if (q.includes("category") || q.includes("categories")) {
    return "Available categories include: Vehicles, Real Estate, Electronics, Fashion, Mobile Phones, Jobs, Services, and Home Appliances.";
  }
  return "I am here to help you! You can ask me any question about All In One Classified marketplace, or any general topic in English, Urdu, or Roman Urdu.";
}

export default AIChatbotModal;
