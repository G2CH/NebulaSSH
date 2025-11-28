import React from 'react';
import { History } from 'lucide-react';
import { simpleCn } from '../../utils';
import { useApp } from '../../contexts/AppContext';
import { AppSettings } from '../../types';

interface SettingsGeneralProps {
    settings: AppSettings;
    setSettings: (settings: AppSettings) => void;
}

export const SettingsGeneral: React.FC<SettingsGeneralProps> = ({ settings, setSettings }) => {
    const { t, language, setLanguage } = useApp();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                    <History className="text-nebula-500" size={20} />
                    {t('settings.history')}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                    {t('settings.history_limit_desc')}
                </p>

                <div className="bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-4 transition-all hover:shadow-sm dark:hover:shadow-none dark:hover:border-slate-700 mb-4">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('settings.language')}
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setLanguage('en')}
                            className={simpleCn(
                                "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                                language === 'en'
                                    ? "bg-nebula-500 text-white border-nebula-500 shadow-sm"
                                    : "bg-white dark:bg-[#0b0b0d] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600"
                            )}
                        >
                            {t('settings.language_en')}
                        </button>
                        <button
                            onClick={() => setLanguage('zh')}
                            className={simpleCn(
                                "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                                language === 'zh'
                                    ? "bg-nebula-500 text-white border-nebula-500 shadow-sm"
                                    : "bg-white dark:bg-[#0b0b0d] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600"
                            )}
                        >
                            {t('settings.language_zh')}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-4 transition-all hover:shadow-sm dark:hover:shadow-none dark:hover:border-slate-700">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('settings.history_limit')}
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            value={settings.history_limit}
                            onChange={(e) => setSettings({ ...settings, history_limit: parseInt(e.target.value) || 0 })}
                            className="w-28 px-3 py-1.5 bg-white dark:bg-[#0b0b0d] border border-slate-200 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-nebula-500/50 text-slate-900 dark:text-slate-100 font-mono text-sm"
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{t('settings.lines_per_server')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
