import React from 'react';
import { Bot, Globe, Key, Server } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AppSettings } from '../../types';
import { Select } from '../ui/Select';

interface SettingsAIProps {
    settings: AppSettings;
    setSettings: (settings: AppSettings) => void;
}

export const SettingsAI: React.FC<SettingsAIProps> = ({ settings, setSettings }) => {
    const { t } = useApp();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                    <Bot className="text-nebula-500" size={20} />
                    {t('settings.ai')}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">
                    {t('settings.ai_desc')}
                </p>

                <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-4 transition-all hover:shadow-sm dark:hover:shadow-none dark:hover:border-slate-700">
                        <Select
                            label={
                                <span className="flex items-center gap-2">
                                    <Globe size={14} />
                                    {t('settings.ai_provider')}
                                </span>
                            }
                            value={settings.ai_provider}
                            onChange={(e) => setSettings({ ...settings, ai_provider: e.target.value })}
                            options={[
                                { value: 'openai', label: 'OpenAI' },
                                { value: 'anthropic', label: 'Anthropic' },
                                { value: 'ollama', label: 'Ollama (Local)' },
                                { value: 'custom', label: 'Custom / Compatible' }
                            ]}
                        />
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-4 transition-all hover:shadow-sm dark:hover:shadow-none dark:hover:border-slate-700">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <Key size={14} />
                            {t('settings.ai_api_key')}
                        </label>
                        <input
                            type="password"
                            value={settings.ai_api_key || ''}
                            onChange={(e) => setSettings({ ...settings, ai_api_key: e.target.value })}
                            placeholder="sk-..."
                            className="w-full px-3 py-2 bg-white dark:bg-[#0b0b0d] border border-slate-200 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-nebula-500/50 text-slate-900 dark:text-slate-100 font-mono text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-4 transition-all hover:shadow-sm dark:hover:shadow-none dark:hover:border-slate-700">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Bot size={14} />
                                {t('settings.ai_model')}
                            </label>
                            <input
                                type="text"
                                value={settings.ai_model || ''}
                                onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                                placeholder={settings.ai_provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20240620'}
                                className="w-full px-3 py-2 bg-white dark:bg-[#0b0b0d] border border-slate-200 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-nebula-500/50 text-slate-900 dark:text-slate-100 font-mono text-sm"
                            />
                        </div>

                        <div className="bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-4 transition-all hover:shadow-sm dark:hover:shadow-none dark:hover:border-slate-700">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Server size={14} />
                                {t('settings.ai_base_url')}
                            </label>
                            <input
                                type="text"
                                value={settings.ai_base_url || ''}
                                onChange={(e) => setSettings({ ...settings, ai_base_url: e.target.value })}
                                placeholder="https://api.openai.com/v1"
                                className="w-full px-3 py-2 bg-white dark:bg-[#0b0b0d] border border-slate-200 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-nebula-500/50 text-slate-900 dark:text-slate-100 font-mono text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
