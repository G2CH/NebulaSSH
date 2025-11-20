import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { isTauri } from '../utils';

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;

    const checkMaximized = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const appWindow = getCurrentWindow();
        setIsMaximized(await appWindow.isMaximized());
      } catch (e) {
        console.error('Failed to check maximized state', e);
      }
    };

    checkMaximized();

    const handleResize = () => checkMaximized();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMinimize = async () => {
    console.log('Minimize clicked, isTauri:', isTauri());
    if (isTauri()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        console.log('getCurrentWindow imported:', getCurrentWindow);
        await getCurrentWindow().minimize();
        console.log('Minimize completed');
      } catch (e) {
        console.error('Failed to minimize', e);
      }
    } else {
      console.log('Not in Tauri environment');
    }
  };

  const handleMaximize = async () => {
    console.log('Maximize clicked, isTauri:', isTauri());
    if (isTauri()) {
      try {
        const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
        const appWindow = getCurrentWindow();
        const maximized = await appWindow.isMaximized();

        if (maximized) {
          // Unmaximize and restore to default size
          await appWindow.unmaximize();
          await appWindow.setSize(new LogicalSize(1920, 1080));
          setIsMaximized(false);
        } else {
          // Maximize window
          await appWindow.maximize();
          setIsMaximized(true);
        }
        console.log('Maximize completed');
      } catch (e) {
        console.error('Failed to maximize', e);
      }
    } else {
      console.log('Not in Tauri environment');
    }
  };

  const handleClose = async () => {
    console.log('Close clicked, isTauri:', isTauri());
    if (isTauri()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
        console.log('Close completed');
      } catch (e) {
        console.error('Failed to close', e);
      }
    } else {
      console.log('Not in Tauri environment');
    }
  };

  return (
    <div
      className="h-8 bg-white dark:bg-[#0b0b0d] flex items-center justify-between select-none z-50 border-b border-slate-200 dark:border-dark-border/50 transition-colors flex-none"
    >
      <div
        data-tauri-drag-region
        onDoubleClick={handleMaximize}
        className="flex-1 h-full flex items-center px-4 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-move"
      >
        <div className="flex items-center gap-2">
          <img src="/logo-small.png" alt="Logo" className="w-4 h-4" />
          <span>Nebula SSH</span>
        </div>
      </div>

      <div className="flex h-full">
        <button
          onClick={handleMinimize}
          className="w-12 h-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
          title="Minimize"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-12 h-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
          title="Maximize"
        >
          {isMaximized ? <Copy size={14} className="rotate-180" /> : <Square size={14} />}
        </button>
        <button
          onClick={handleClose}
          className="w-12 h-full flex items-center justify-center hover:bg-red-500 hover:text-white text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
