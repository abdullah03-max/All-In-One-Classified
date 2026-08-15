import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Bot } from 'lucide-react';
import { AIChatbotModal } from './AIChatbotModal';

export const AIChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-primary-500/25 transition-all border border-white/20"
        title="Open AI Assistant"
      >
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Bot size={18} className="animate-pulse" />
        </div>
        <span className="font-semibold text-sm tracking-wide hidden sm:inline">AI Assistant</span>
        <Sparkles size={16} className="text-yellow-300" />
      </motion.button>

      {/* Chatbot Modal */}
      <AIChatbotModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AIChatbotWidget;
