import React from 'react';
import { X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { AIAssistant } from './Terminal/AIAssistant';
import { simpleCn } from '../utils';

export const AIModal: React.FC = () => {
    const { isAIModalOpen, toggleAIModal } = useApp();

    if (!isAIModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-[800px] h-[600px] bg-white dark:bg-[#0c0c0e] rounded-xl shadow-2xl border border-slate-200 dark:border-dark-border flex flex-col overflow-hidden animate-scale-in">
                {/* Modal Header */}
                <div className="h-10 flex items-center justify-between px-4 border-b border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/30">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">AI Assistant</span>
                    <button
                        onClick={toggleAIModal}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content - Reusing AIAssistant but we need to make sure it renders fully */}
                {/* Since AIAssistant handles its own layout, we just wrap it */}
                <div className="flex-1 overflow-hidden relative">
                    <AIAssistant isModal={true} />
                </div>
            </div>
        </div>
    );
};
