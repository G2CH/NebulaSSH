import React from 'react';
import { useApp } from '../../contexts/AppContext';

export const SettingsAbout: React.FC = () => {
    const { t } = useApp();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center pt-4">
            <div className="w-20 h-20 bg-gradient-to-br from-nebula-500 to-purple-600 rounded-2xl mx-auto shadow-xl shadow-nebula-500/30 flex items-center justify-center mb-4 transform hover:rotate-3 transition-transform duration-500 overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>

            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Nebula SSH</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{t('settings.version')} 0.1.0 (Alpha)</p>
            </div>

            <div className="max-w-xs mx-auto text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <p className="mb-3">
                    {t('settings.app_desc')}
                </p>
                <p>
                    {t('settings.built_with')}
                </p>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-dark-border/50 w-full max-w-xs mx-auto">
                <p className="text-[10px] text-slate-400">
                    {t('settings.copyright')}
                </p>
            </div>
        </div>
    );
};
