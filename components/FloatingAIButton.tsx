import React from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const FloatingAIButton: React.FC = () => {
    const { toggleAIModal, isAIModalOpen } = useApp();

    // Don't show if modal is already open
    if (isAIModalOpen) return null;

    return (
        <button
            onClick={toggleAIModal}
            className="fixed bottom-6 right-6 z-40 group"
            title="AI Assistant (Cmd/Ctrl+K)"
        >
            {/* Pulse animation */}
            <div className="absolute inset-0 bg-nebula-500 rounded-full animate-ping opacity-20" />

            {/* Main button */}
            <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-nebula-500 to-nebula-600 hover:from-nebula-600 hover:to-nebula-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Sparkles size={24} className="text-white" strokeWidth={2} />

                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    AI Assistant
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
                </div>
            </div>
        </button>
    );
};
