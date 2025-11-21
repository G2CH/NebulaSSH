import React, { useState, useRef, useEffect } from 'react';
import { AIMessage } from '../../types';
import { simpleCn, generateId } from '../../utils';
import { useApp } from '../../contexts/AppContext';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Send, Bot, User, Sparkles, Loader2, Maximize2, X } from 'lucide-react';
import { AIMessageRenderer } from './AIMessageRenderer';

interface Props {
  isModal?: boolean;
  initialContext?: {
    text: string;
    action?: 'ask' | 'explain' | 'fix' | 'optimize';
  };
}

export const AIAssistant: React.FC<Props> = ({ isModal = false, initialContext: propContext }) => {
  const { t, aiMessages: messages, setAIMessages: setMessages, toggleAIModal, isAIModalOpen, aiContext, setAIContext } = useApp();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAIModalOpen]);

  // Handle initial context (from terminal selection, etc.)
  // Prioritize global aiContext over prop
  const initialContext = aiContext || propContext;

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    let processedInput = textToSend.trim();

    // Process slash commands
    const slashCommandMatch = processedInput.match(/^\/(\w+)\s+(.+)/s);
    if (slashCommandMatch) {
      const [, command, content] = slashCommandMatch;
      const commandMap: Record<string, 'explain' | 'fix' | 'optimize'> = {
        explain: 'explain',
        fix: 'fix',
        optimize: 'optimize'
      };

      if (commandMap[command]) {
        const action = commandMap[command];
        processedInput = t(`ai.prompt_${action}`).replace('{code}', content);
      }
    }

    const userMsg: AIMessage = {
      id: generateId(),
      role: 'user',
      content: processedInput,
      timestamp: Date.now()
    };

    const botMsgId = generateId();
    const botMsg: AIMessage = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };

    // Add both messages immediately
    const currentMessages = [...messages, userMsg];
    setMessages([...currentMessages, botMsg]);
    setInput('');
    setIsLoading(true);

    let unlistenChunk: (() => void) | undefined;
    let unlistenDone: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;

    const cleanup = () => {
      if (unlistenChunk) unlistenChunk();
      if (unlistenDone) unlistenDone();
      if (unlistenError) unlistenError();
      setIsLoading(false);
    };

    try {
      // Setup listeners
      unlistenChunk = await listen<string>('ai_response_chunk', (event) => {
        setMessages(prev => prev.map(msg =>
          msg.id === botMsgId
            ? { ...msg, content: msg.content + event.payload }
            : msg
        ));
      });

      unlistenDone = await listen('ai_response_done', () => {
        cleanup();
      });

      unlistenError = await listen<string>('ai_response_error', (event) => {
        console.error("AI Stream Error:", event.payload);
        setMessages(prev => prev.map(msg =>
          msg.id === botMsgId
            ? { ...msg, content: msg.content + `\n\n[Error: ${event.payload}]` }
            : msg
        ));
        cleanup();
      });

      // Prepare messages for backend
      const chatMessages = currentMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call backend service
      await invoke('chat_completion', {
        messages: chatMessages
      });

    } catch (error) {
      console.error("AI Invocation Error:", error);
      setMessages(prev => prev.map(msg =>
        msg.id === botMsgId
          ? { ...msg, content: typeof error === 'string' ? error : t('ai.error') }
          : msg
      ));
      cleanup();
    }
  };

  useEffect(() => {
    if (initialContext && initialContext.text) {
      const actionTemplates = {
        explain: t('ai.prompt_explain').replace('{code}', initialContext.text),
        fix: t('ai.prompt_fix').replace('{code}', initialContext.text),
        optimize: t('ai.prompt_optimize').replace('{code}', initialContext.text),
        ask: initialContext.text
      };

      const template = actionTemplates[initialContext.action || 'ask'];

      // If it's a specific action, auto-send
      if (initialContext.action && initialContext.action !== 'ask') {
        handleSend(template);
      } else {
        // Otherwise just populate input
        setInput(template);
      }

      // Clear the context after using it
      if (aiContext) {
        setAIContext(null);
      }
    }
  }, [initialContext, aiContext, setAIContext, t]); // Be careful with dependencies here to avoid loops

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // If modal is open AND we are NOT in the modal (i.e. we are the sidebar instance), show placeholder
  if (isAIModalOpen && !isModal) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0c0c0e] border-l border-slate-200 dark:border-dark-border w-full items-center justify-center text-slate-400 gap-3">
        <Maximize2 size={24} />
        <p className="text-xs text-center px-4">
          AI Assistant is open in a separate window.
        </p>
        <button
          onClick={toggleAIModal}
          className="text-xs text-nebula-500 hover:underline"
        >
          Restore to sidebar
        </button>
      </div>
    );
  }

  return (
    <div className={simpleCn(
      "flex flex-col h-full bg-slate-50 dark:bg-[#0c0c0e] transition-colors",
      !isModal && "border-l border-slate-200 dark:border-dark-border w-full"
    )}>
      {/* Header removed as per request, controls moved to sidebar header */}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={simpleCn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            <div className={simpleCn(
              "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
              msg.role === 'user' ? "bg-slate-200 dark:bg-slate-700" : "bg-nebula-100 dark:bg-nebula-500/20 text-nebula-600 dark:text-nebula-400"
            )}>
              {msg.role === 'user' ? <User size={12} /> : <Bot size={14} />}
            </div>
            <div className={simpleCn(
              "max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm",
              msg.role === 'user'
                ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tr-none"
                : "bg-white dark:bg-[#18181b] border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 rounded-tl-none w-full"
            )}>
              <AIMessageRenderer content={msg.content} role={msg.role} />
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
            onClick={() => handleSend()}
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
