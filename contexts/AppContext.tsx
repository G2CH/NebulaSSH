import React, { createContext, useContext, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { translations, Language } from '../locales';
import { AppSettings, AIMessage } from '../types';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: (theme: 'light' | 'dark' | 'system') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => Promise<void>;

  // AI State
  aiMessages: AIMessage[];
  setAIMessages: React.Dispatch<React.SetStateAction<AIMessage[]>>;
  isAIModalOpen: boolean;
  toggleAIModal: () => void;
  aiContext: { text: string; action?: 'ask' | 'explain' | 'fix' | 'optimize' } | null;
  setAIContext: (context: { text: string; action?: 'ask' | 'explain' | 'fix' | 'optimize' } | null) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  history_limit: 10000,
  theme: 'default',
  app_theme: 'system',
  ai_provider: 'openai',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('dark');
  const [language, setLanguage] = useState<Language>('zh'); // Default to Chinese

  // AI State
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([]);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiContext, setAIContext] = useState<{ text: string; action?: 'ask' | 'explain' | 'fix' | 'optimize' } | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Initialize welcome message if empty
  useEffect(() => {
    if (aiMessages.length === 0) {
      setAIMessages([{
        id: 'welcome',
        role: 'model',
        text: t('ai.welcome'),
        timestamp: Date.now()
      }]);
    }
  }, [language]); // Re-run when language changes to update welcome message

  const loadSettings = async () => {
    try {
      const loaded = await invoke<AppSettings>('get_app_settings');
      setSettings(loaded);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const updateSettings = async (newSettings: AppSettings) => {
    try {
      await invoke('save_app_settings', { settings: newSettings });
      setSettings(newSettings);
    } catch (e) {
      console.error('Failed to save settings:', e);
      throw e;
    }
  };

  // Handle theme changes (including system theme detection)
  useEffect(() => {
    const applyTheme = () => {
      let themeToApply = settings.app_theme;

      if (themeToApply === 'system') {
        themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      const root = window.document.documentElement;
      if (themeToApply === 'dark') {
        root.classList.add('dark');
        setActiveTheme('dark');
      } else {
        root.classList.remove('dark');
        setActiveTheme('light');
      }
    };

    applyTheme();

    // Listen for system theme changes if using system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.app_theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.app_theme]);

  const toggleTheme = (newTheme: 'light' | 'dark' | 'system') => {
    updateSettings({ ...settings, app_theme: newTheme });
  };

  const toggleAIModal = () => {
    setIsAIModalOpen(prev => !prev);
  };

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current[key] === undefined) {
        return path;
      }
      current = current[key];
    }
    return current as string;
  };

  return (
    <AppContext.Provider value={{
      theme: activeTheme,
      toggleTheme,
      language,
      setLanguage,
      t,
      settings,
      updateSettings,
      aiMessages,
      setAIMessages,
      isAIModalOpen,
      toggleAIModal,
      aiContext,
      setAIContext
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
