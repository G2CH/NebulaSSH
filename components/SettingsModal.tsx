import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './ui/Button';
import { useApp } from '../contexts/AppContext';
import {
  Settings as SettingsIcon,
  Palette,
  Info,
  ChevronRight,
  Bot,
  ShieldCheck
} from 'lucide-react';
import { simpleCn } from '../utils';
import { AppSettings } from '../types';

import { SettingsGeneral } from './Settings/SettingsGeneral';
import { SettingsAppearance } from './Settings/SettingsAppearance';
import { SettingsSecurity } from './Settings/SettingsSecurity';
import { SettingsAI } from './Settings/SettingsAI';
import { SettingsAbout } from './Settings/SettingsAbout';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t, settings: globalSettings, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'ai' | 'security' | 'about'>('general');
  const [settings, setSettings] = useState<AppSettings>(globalSettings);

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
              <SettingsGeneral settings={settings} setSettings={setSettings} />
            )}

            {activeTab === 'appearance' && (
              <SettingsAppearance settings={settings} setSettings={setSettings} />
            )}

            {activeTab === 'security' && (
              <SettingsSecurity settings={settings} setSettings={setSettings} />
            )}

            {activeTab === 'ai' && (
              <SettingsAI settings={settings} setSettings={setSettings} />
            )}

            {activeTab === 'about' && (
              <SettingsAbout />
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
