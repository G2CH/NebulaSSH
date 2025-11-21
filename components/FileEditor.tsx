import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Save, X, FileText } from 'lucide-react';
import { simpleCn } from '../utils';
import { useApp } from '../contexts/AppContext';

interface Props {
    sessionId: string;
    filePath: string;
    onClose: () => void;
}

export const FileEditor: React.FC<Props> = ({ sessionId, filePath, onClose }) => {
    const { t } = useApp();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        loadFile();
    }, [filePath, sessionId]);

    const loadFile = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('[FileEditor] Loading file:', filePath, 'with sessionId:', sessionId);
            const fileContent = await invoke<string>('read_remote_file', {
                id: sessionId,
                path: filePath
            });
            setContent(fileContent);
            setIsDirty(false);
        } catch (e) {
            setError(String(e));
            console.error('[FileEditor] Failed to load file:', e, 'sessionId:', sessionId);
        } finally {
            setLoading(false);
        }
    };

    const saveFile = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await invoke('write_remote_file', {
                id: sessionId,
                path: filePath,
                content
            });
            setIsDirty(false);
            setSuccessMessage(t('file_editor.save_success'));
            // Auto-hide success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (e) {
            setError(String(e));
            console.error('[FileEditor] Failed to save file:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            if (isDirty && !saving) {
                saveFile();
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        setIsDirty(true);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-dark-bg">
            {/* Header */}
            <div className="h-10 bg-slate-100/50 dark:bg-dark-surface/30 border-b border-slate-200 dark:border-dark-border flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <FileText size={16} className="text-nebula-500" />
                    <span className="font-medium">{filePath.split('/').pop()}</span>
                    {isDirty && <span className="text-orange-500">●</span>}
                    {successMessage && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs animate-fade-in">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {successMessage}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={saveFile}
                        disabled={!isDirty || saving}
                        title={isDirty ? t('file_editor.save_tooltip') : t('file_editor.no_changes')}
                        className={simpleCn(
                            "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
                            isDirty && !saving
                                ? "bg-nebula-500 text-white hover:bg-nebula-600"
                                : "bg-slate-200 dark:bg-dark-border text-slate-400 dark:text-slate-600 cursor-not-allowed"
                        )}
                    >
                        <Save size={14} />
                        {saving ? t('file_editor.saving') : t('file_editor.save')}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-dark-border text-slate-600 dark:text-slate-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        {t('file_editor.loading')}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-500 p-8">
                        <p className="font-medium mb-2 text-base">⚠️ {t('file_editor.failed')}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4 max-w-md">{error}</p>
                        <div className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-500 mb-4">
                            <p>• {t('file_editor.error_check_connection')}</p>
                            <p>• {t('file_editor.error_check_permission')}</p>
                            <p>• {t('file_editor.error_check_path')}</p>
                        </div>
                        <button
                            onClick={loadFile}
                            className="px-4 py-2 bg-nebula-500 text-white rounded-md hover:bg-nebula-600 transition-colors font-medium"
                        >
                            {t('file_editor.retry')}
                        </button>
                    </div>
                ) : (
                    <textarea
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className="w-full h-full bg-white dark:bg-[#0c0c0e] text-slate-800 dark:text-slate-200 font-mono text-sm p-4 rounded-lg border border-slate-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-nebula-500/50 resize-none"
                        spellCheck={false}
                        placeholder={t('file_editor.placeholder')}
                    />
                )}
            </div>

            {/* Status Bar */}
            {!loading && !error && (
                <div className="h-6 bg-slate-100/50 dark:bg-dark-surface/30 border-t border-slate-200 dark:border-dark-border px-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>{filePath}</span>
                    <span>
                        {content.split('\n').length} {t('file_editor.lines')} · {content.length} {t('file_editor.characters')}
                    </span>
                </div>
            )}
        </div>
    );
};
