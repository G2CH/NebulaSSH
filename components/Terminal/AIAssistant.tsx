
import React, { useState, useRef, useEffect } from 'react';
import { AIMessage } from '../../types';
import { simpleCn, generateId } from '../../utils';
import { useApp } from '../../contexts/AppContext';
import { invoke } from '@tauri-apps/api/core';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

export const AIAssistant: React.FC = () => {
  const { t } = useApp();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: t('ai.welcome'),
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: AIMessage = {
      id: generateId(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare messages for backend (convert to simple format if needed)
      const chatMessages = newMessages.map(m => ({
        role: m.role,
        content: m.text
      }));

      // Call backend service
      const response = await invoke<string>('chat_completion', {
        messages: chatMessages
      });

      const botMsg: AIMessage = {
        id: generateId(),
        role: 'model',
        text: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: AIMessage = {
        id: generateId(),
        role: 'model',
        text: typeof error === 'string' ? error : t('ai.error'),
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0c0c0e] border-l border-slate-200 dark:border-dark-border w-80 transition-colors">
      {/* Header */}
      <div className="h-10 flex items-center px-4 border-b border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface/30 flex-shrink-0">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Sparkles size={14} className="text-nebula-600 dark:text-nebula-500" />
          {t('ai.title')}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={simpleCn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            <div className={simpleCn(
              "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
              msg.role === 'user' ? "bg-slate-200 dark:bg-slate-700" : "bg-nebula-100 dark:bg-nebula-500/20 text-nebula-600 dark:text-nebula-400"
            )}>
              {msg.role === 'user' ? <User size={12} /> : <Bot size={14} />}
            </div>
            <div className={simpleCn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm",
              msg.role === 'user'
                ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tr-none"
                : "bg-white dark:bg-[#18181b] border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 rounded-tl-none"
            )}>
              <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-nebula-100 dark:bg-nebula-500/20 text-nebula-600 dark:text-nebula-400 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot size={14} />
            </div>
            <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-dark-border rounded-2xl rounded-tl-none px-3 py-2 shadow-sm">
              <Loader2 size={14} className="animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface/30">
        <div className="relative">
          <textarea
            className="w-full bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-dark-border rounded-xl py-2 pl-3 pr-10 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-nebula-500/50 focus:ring-1 focus:ring-nebula-500/20 transition-all resize-none placeholder:text-slate-400"
            rows={1}
            placeholder={t('ai.placeholder')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 top-1.5 p-1.5 bg-nebula-600 hover:bg-nebula-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
