import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { useApp } from '../contexts/AppContext';
import { invoke } from '@tauri-apps/api/core';
import { Settings as SettingsIcon, Palette, History, Info, Check, ChevronRight, Bot, Key, Server, Globe, ShieldCheck } from 'lucide-react';
import { simpleCn } from '../utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

import { AppSettings } from '../types';

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

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t, theme: appTheme, toggleTheme, language, setLanguage, settings: globalSettings, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'ai' | 'security' | 'about'>('general');
  const [settings, setSettings] = useState<AppSettings>(globalSettings);

  // Change Password State
  const [changePasswordForm, setChangePasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    const { oldPassword, newPassword, confirmPassword } = changePasswordForm;
    if (!oldPassword || !newPassword || !confirmPassword) {
      setChangePasswordError(t('security.all_fields_required'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError(t('security.password_mismatch'));
      return;
    }
    if (newPassword.length < 8) {
      setChangePasswordError(t('security.password_length'));
      return;
    }

    setIsChangingPassword(true);
    setChangePasswordError('');
    setChangePasswordSuccess('');

    try {
      await invoke('change_master_password', { oldPassword, newPassword });
      setChangePasswordSuccess(t('security.change_success'));
      setChangePasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      setChangePasswordError(typeof e === 'string' ? e : t('security.change_failed'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSettings(globalSettings);
    }
  }, [isOpen, globalSettings]);

  const handleSave = async () => {
    try {
      await updateSettings(settings);
      onClose();
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const TabButton = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={simpleCn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
        activeTab === id
          ? "bg-nebula-500 text-white shadow-md shadow-nebula-500/20"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
      )}
    >
      <Icon size={16} className={simpleCn("transition-transform duration-300", activeTab === id && "scale-110")} />
      <span className="flex-1 text-left">{label}</span>
      {activeTab === id && <ChevronRight size={14} className="animate-in slide-in-from-left-2 fade-in duration-300" />}
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('settings.title')} maxWidth="60vw">
      <div className="flex h-[80vh] -m-6">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 bg-slate-50/50 dark:bg-[#0b0b0d] border-r border-slate-200 dark:border-dark-border p-3 flex flex-col gap-1">
          <div className="mb-2 px-3 pt-2">
            <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {t('settings.title')}
            </h2>
          </div>

          <TabButton id="general" icon={SettingsIcon} label={t('settings.general')} />
          <TabButton id="appearance" icon={Palette} label={t('settings.appearance')} />
          <TabButton id="ai" icon={Bot} label={t('settings.ai')} />
          <TabButton id="security" icon={ShieldCheck} label={t('settings.security')} />

          <div className="mt-auto pt-3 border-t border-slate-200 dark:border-dark-border/50">
            <TabButton id="about" icon={Info} label={t('settings.about')} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0d1117]">
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
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
            )}

            {activeTab === 'appearance' && (
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
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                    <ShieldCheck className="text-green-500" size={20} />
                    {t('settings.security')}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">
                    {t('settings.security_desc')}
                  </p>

                  <div className="bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-4 transition-all hover:shadow-sm dark:hover:shadow-none dark:hover:border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('security.auto_lock')}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('security.auto_lock_desc')}</p>
                      </div>
                      <button
                        onClick={() => setSettings({
                          ...settings,
                          lock_timeout: settings.lock_timeout === 0 ? 10 : 0
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.lock_timeout > 0
                          ? 'bg-nebula-500'
                          : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.lock_timeout > 0 ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>

                    {settings.lock_timeout > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">{t('security.lock_timeout')}</label>
                        <div className="flex gap-2">
                          {[5, 10, 15].map(minutes => (
                            <button
                              key={minutes}
                              onClick={() => setSettings({ ...settings, lock_timeout: minutes })}
                              className={simpleCn(
                                "px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-2",
                                settings.lock_timeout === minutes
                                  ? "bg-nebula-500 text-white border-nebula-500 shadow-sm"
                                  : "bg-white dark:bg-[#0b0b0d] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600"
                              )}
                            >
                              {minutes} {t('security.minutes')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-4 transition-all hover:shadow-sm dark:hover:shadow-none dark:hover:border-slate-700">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">{t('security.change_password')}</h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('security.current_password')}</label>
                        <input
                          type="password"
                          value={changePasswordForm.oldPassword}
                          onChange={(e) => setChangePasswordForm({ ...changePasswordForm, oldPassword: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-[#0b0b0d] border border-slate-200 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-nebula-500/50 text-slate-900 dark:text-slate-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('security.new_password')}</label>
                        <input
                          type="password"
                          value={changePasswordForm.newPassword}
                          onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-[#0b0b0d] border border-slate-200 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-nebula-500/50 text-slate-900 dark:text-slate-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('security.confirm_new_password')}</label>
                        <input
                          type="password"
                          value={changePasswordForm.confirmPassword}
                          onChange={(e) => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-[#0b0b0d] border border-slate-200 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-nebula-500/50 text-slate-900 dark:text-slate-100 text-sm"
                        />
                      </div>

                      {changePasswordError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <Info size={12} /> {changePasswordError}
                        </p>
                      )}
                      {changePasswordSuccess && (
                        <p className="text-xs text-green-500 flex items-center gap-1">
                          <Check size={12} /> {changePasswordSuccess}
                        </p>
                      )}

                      <Button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="w-full mt-2 bg-slate-800 hover:bg-slate-700"
                      >
                        {isChangingPassword ? t('security.changing') : t('security.update_password')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
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
            )}

            {activeTab === 'about' && (
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
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-[#0b0b0d] flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} className="hover:bg-slate-200 dark:hover:bg-white/5 text-sm h-9 px-4">{t('common.cancel')}</Button>
            <Button onClick={handleSave} className="shadow-lg shadow-nebula-500/20 text-sm h-9 px-4">{t('common.save')}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
