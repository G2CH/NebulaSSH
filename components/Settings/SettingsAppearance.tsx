import React from 'react';
import { Palette, Check } from 'lucide-react';
import { simpleCn } from '../../utils';
import { useApp } from '../../contexts/AppContext';
import { AppSettings } from '../../types';

const THEMES = [
    { id: 'default', name: 'Nebula Dark', colors: { bg: '#0d1117', fg: '#e6edf3', accent: '#10b981' } },
    { id: 'dracula', name: 'Dracula', colors: { bg: '#282a36', fg: '#f8f8f2', accent: '#ff79c6' } },
    { id: 'onedark', name: 'One Dark', colors: { bg: '#282c34', fg: '#abb2bf', accent: '#61afef' } },
    { id: 'solarized-dark', name: 'Solarized Dark', colors: { bg: '#002b36', fg: '#839496', accent: '#b58900' } },
    { id: 'solarized-light', name: 'Solarized Light', colors: { bg: '#fdf6e3', fg: '#657b83', accent: '#b58900' } },
    { id: 'nord', name: 'Nord', colors: { bg: '#2e3440', fg: '#d8dee9', accent: '#88c0d0' } },
    { id: 'github-light', name: 'GitHub Light', colors: { bg: '#ffffff', fg: '#24292f', accent: '#0969da' } },
    { id: 'github-dark', name: 'GitHub Dark', colors: { bg: '#0d1117', fg: '#c9d1d9', accent: '#58a6ff' } },
];

interface SettingsAppearanceProps {
    settings: AppSettings;
    setSettings: (settings: AppSettings) => void;
}

export const SettingsAppearance: React.FC<SettingsAppearanceProps> = ({ settings, setSettings }) => {
    const { t } = useApp();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <div className="bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-4 transition-all hover:shadow-sm dark:hover:shadow-none dark:hover:border-slate-700 mb-6">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('settings.appearance')}
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSettings({ ...settings, app_theme: 'light' })}
                            className={simpleCn(
                                "px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-2",
                                settings.app_theme === 'light'
                                    ? "bg-nebula-500 text-white border-nebula-500 shadow-sm"
                                    : "bg-white dark:bg-[#0b0b0d] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600"
                            )}
                        >
                            {t('settings.theme_light')}
                        </button>
                        <button
                            onClick={() => setSettings({ ...settings, app_theme: 'dark' })}
                            className={simpleCn(
                                "px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-2",
                                settings.app_theme === 'dark'
                                    ? "bg-nebula-500 text-white border-nebula-500 shadow-sm"
                                    : "bg-white dark:bg-[#0b0b0d] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600"
                            )}
                        >
                            {t('settings.theme_dark')}
                        </button>
                        <button
                            onClick={() => setSettings({ ...settings, app_theme: 'system' })}
                            className={simpleCn(
                                "px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-2",
                                settings.app_theme === 'system'
                                    ? "bg-nebula-500 text-white border-nebula-500 shadow-sm"
                                    : "bg-white dark:bg-[#0b0b0d] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600"
                            )}
                        >
                            {t('settings.theme_system')}
                        </button>
                    </div>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                    <Palette className="text-purple-500" size={20} />
                    {t('settings.theme')}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                    Customize the look and feel of your terminal.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    {THEMES.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => setSettings({ ...settings, theme: theme.id })}
                            className={simpleCn(
                                "relative p-3 rounded-lg border text-left transition-all duration-200 group overflow-hidden",
                                settings.theme === theme.id
                                    ? "border-nebula-500 bg-nebula-50/50 dark:bg-nebula-500/10 shadow-md shadow-nebula-500/10"
                                    : "border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-dark-surface"
                            )}
                        >
                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <span className={simpleCn(
                                    "font-semibold text-sm transition-colors",
                                    settings.theme === theme.id ? "text-nebula-600 dark:text-nebula-400" : "text-slate-900 dark:text-slate-100"
                                )}>{theme.name}</span>
                                {settings.theme === theme.id && (
                                    <div className="w-4 h-4 rounded-full bg-nebula-500 flex items-center justify-center text-white shadow-sm">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 relative z-10">
                                <div className="w-6 h-6 rounded-full border border-slate-200 dark:border-white/10 shadow-sm" style={{ backgroundColor: theme.colors.bg }} title={t('settings.theme_bg')} />
                                <div className="w-6 h-6 rounded-full border border-slate-200 dark:border-white/10 shadow-sm" style={{ backgroundColor: theme.colors.fg }} title={t('settings.theme_fg')} />
                                <div className="w-6 h-6 rounded-full border border-slate-200 dark:border-white/10 shadow-sm" style={{ backgroundColor: theme.colors.accent }} title={t('settings.theme_accent')} />
                            </div>

                            {/* Background Glow for Active State */}
                            {settings.theme === theme.id && (
                                <div className="absolute inset-0 bg-gradient-to-br from-nebula-500/5 to-transparent pointer-events-none" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
