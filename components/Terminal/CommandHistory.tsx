import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useApp } from '../../contexts/AppContext';
import { Search, Clock, Terminal, Play, Plus } from 'lucide-react';
import { simpleCn } from '../../utils';
import { SaveSnippetModal } from './SaveSnippetModal';

interface CommandHistoryItem {
    id: number;
    server_id: number | null;
    command: string;
    executed_at: number;
}

interface Props {
    serverId: string | number;
    onSelectCommand: (command: string) => void;
}

export const CommandHistory: React.FC<Props> = ({ serverId, onSelectCommand }) => {
    const { t } = useApp();
    const [history, setHistory] = useState<CommandHistoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [selectedCommand, setSelectedCommand] = useState('');

    useEffect(() => {
        loadHistory();
    }, [serverId]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            // If serverId is 'local', we might want to pass null or handle it specifically
            // But currently the backend expects Option<i64>. 
            // 'local' string ID won't parse to i64.
            // We should probably treat 'local' as null server_id for now, or a specific ID if we saved it.
            // For now, let's skip history for 'local' if it's string, or try to parse.

            let sid: number | null = null;
            if (typeof serverId === 'number') {
                sid = serverId;
            } else if (serverId !== 'local') {
                // Try to parse if it's a number string
                const parsed = parseInt(serverId);
                if (!isNaN(parsed)) sid = parsed;
            }

            const data = await invoke<CommandHistoryItem[]>('get_command_history', {
                serverId: sid,
                limit: 100
            });
            setHistory(data);
        } catch (e) {
            console.error('Failed to load history:', e);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = history.filter(item =>
        item.command.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const handleSaveToSnippets = (command: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCommand(command);
        setSaveModalOpen(true);
    };

    const handleExecute = (command: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectCommand(command);
    };

    // Get unique categories for the modal
    const existingCategories = Array.from(new Set(['Docker', 'System', 'Git', 'Network', 'Database']));

    return (
        <div className="flex flex-col h-full bg-white dark:bg-dark-surface w-full">
            <div className="p-4 border-b border-slate-200 dark:border-dark-border">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Clock size={16} />
                    {t('settings.history')}
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input
                        className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-nebula-500/20"
                        placeholder={t('sidebar.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                    <div className="text-center py-8 text-slate-400 text-xs">{t('common.loading')}</div>
                ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">{t('sidebar.empty')}</div>
                ) : (
                    filteredHistory.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onSelectCommand(item.command)}
                            className="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-bg group transition-colors border border-transparent hover:border-slate-200 dark:hover:border-dark-border relative"
                        >
                            <div className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate mb-1 pr-16">
                                {item.command}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Terminal size={10} />
                                {formatTime(item.executed_at)}
                            </div>

                            {/* Action buttons */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleExecute(item.command, e)}
                                    className="p-1.5 hover:bg-nebula-100 dark:hover:bg-nebula-900/20 rounded text-nebula-600 dark:text-nebula-400 transition-colors"
                                    title={t('history.execute')}
                                >
                                    <Play size={12} />
                                </button>
                                <button
                                    onClick={(e) => handleSaveToSnippets(item.command, e)}
                                    className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded text-purple-600 dark:text-purple-400 transition-colors"
                                    title={t('history.add_to_snippets')}
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                        </button>
                    ))
                )}
            </div>

            <SaveSnippetModal
                isOpen={saveModalOpen}
                onClose={() => setSaveModalOpen(false)}
                command={selectedCommand}
                existingCategories={existingCategories}
                onSuccess={() => {
                    // Optionally show success message or reload snippets
                    console.log('Snippet saved successfully');
                }}
            />
        </div>
    );
};
