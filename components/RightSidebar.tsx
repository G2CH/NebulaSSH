import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Bot, Code2, Copy, Clock, Maximize2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { simpleCn } from '../utils';
import { CommandHistory } from './Terminal/CommandHistory';
import { AIAssistant } from './Terminal/AIAssistant';
import { useResizable } from '../hooks/useResizable';

interface Props {
  activeSessionId: string | null;
  activeServerId: string | number | null;
}

export const RightSidebar: React.FC<Props> = ({ activeSessionId, activeServerId }) => {
  const { t, toggleAIModal } = useApp();
  const [activeTab, setActiveTab] = useState<'ai' | 'snippets' | 'history' | null>(null);

  const { width, isResizing, handleMouseDown } = useResizable({
    defaultWidth: 320,
    minWidth: 280,
    maxWidth: 600,
    storageKey: 'rightSidebarWidth'
  });

  const toggleTab = (tab: 'ai' | 'snippets' | 'history') => {
    setActiveTab(current => current === tab ? null : tab);
  };

  const [snippets, setSnippets] = useState<Array<{ id: number, name: string, command: string, category: string }>>([]);
  const [snippetSearch, setSnippetSearch] = useState('');

  // Fetch snippets when tab is opened
  React.useEffect(() => {
    if (activeTab === 'snippets') {
      invoke<Array<any>>('get_all_snippets')
        .then(setSnippets)
        .catch(console.error);
    }
  }, [activeTab]);

  const handleRunSnippet = async (command: string) => {
    if (!activeSessionId) return;

    // Determine if local or remote based on activeServerId (simplified check)
    const isLocal = activeServerId === 'local';
    const cmd = isLocal ? 'write_local' : 'write_ssh';

    try {
      await invoke(cmd, { id: activeSessionId, data: command + '\r' });
    } catch (e) {
      console.error('Failed to run snippet:', e);
    }
  };

  const filteredSnippets = snippets.filter(s =>
    s.name.toLowerCase().includes(snippetSearch.toLowerCase()) ||
    s.command.toLowerCase().includes(snippetSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(snippetSearch.toLowerCase())
  );

  return (
    <div className="flex h-full bg-slate-50/50 dark:bg-[#0b0b0d] border-l border-slate-200 dark:border-dark-border transition-all duration-300 z-20">

      {/* Content Panel (Slides out to the left of the icons) */}
      <div
        className={simpleCn(
          "flex flex-col bg-white dark:bg-[#0b0b0d] border-r border-slate-200 dark:border-dark-border transition-all duration-300 ease-in-out overflow-hidden relative",
          activeTab ? "opacity-100" : "w-0 opacity-0"
        )}
        style={{ width: activeTab ? `${width}px` : 0 }}
      >
        {/* Resize Handle */}
        {activeTab && (
          <div
            onMouseDown={handleMouseDown}
            className={simpleCn(
              "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-nebula-500/50 transition-colors z-10",
              isResizing && "bg-nebula-500"
            )}
          />
        )}
        {/* Panel Header */}
        <div className="h-11 px-4 border-b border-slate-200 dark:border-dark-border flex items-center justify-between flex-shrink-0 bg-slate-50/50 dark:bg-[#0b0b0d]">
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
            {activeTab === 'ai' && t('right_sidebar.ai')}
            {activeTab === 'snippets' && t('right_sidebar.snippets')}
            {activeTab === 'history' && t('right_sidebar.history')}
          </span>
          {activeTab === 'ai' && (
            <button
              onClick={toggleAIModal}
              className="text-slate-400 hover:text-nebula-500 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded"
              title={t('ai.expand') || "Expand"}
            >
              <Maximize2 size={14} />
            </button>
          )}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {activeTab === 'ai' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <AIAssistant />
            </div>
          )}

          {activeTab === 'snippets' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="relative mb-2">
                <input
                  className="w-full bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg py-2 pl-3 pr-3 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-nebula-500/40 focus:ring-2 focus:ring-nebula-500/10 transition-all"
                  placeholder={t('snippets.search_ph')}
                  value={snippetSearch}
                  onChange={(e) => setSnippetSearch(e.target.value)}
                />
              </div>

              {filteredSnippets.map((snippet, i) => (
                <div
                  key={snippet.id || i}
                  className="group p-3 rounded-xl border border-slate-200 dark:border-dark-border hover:border-nebula-500/30 hover:bg-slate-50 dark:hover:bg-dark-surface transition-all cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => handleRunSnippet(snippet.command)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-xs text-slate-700 dark:text-slate-200">{snippet.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">{snippet.category}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate flex-1 bg-slate-100 dark:bg-[#000] px-2 py-1 rounded border border-slate-200 dark:border-white/5">
                      {snippet.command}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(snippet.command);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-nebula-500 hover:bg-nebula-50 dark:hover:bg-nebula-500/10 rounded transition-all"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredSnippets.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-4">
                  {t('sidebar.empty')}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            activeServerId ? (
              <CommandHistory
                serverId={activeServerId}
                onSelectCommand={(cmd) => {
                  // TODO: Insert command into terminal
                  console.log('Selected command:', cmd);
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs p-4 text-center">
                {t('sidebar.empty')}
              </div>
            )
          )}
        </div>
      </div>

      {/* Activity Bar (Rightmost Strip) */}
      <div className="w-[40px] flex flex-col items-center py-4 gap-4 bg-slate-50/80 dark:bg-[#0b0b0d] flex-shrink-0">
        <button
          onClick={() => toggleTab('ai')}
          className={simpleCn(
            "p-2 rounded-xl transition-all relative group",
            activeTab === 'ai'
              ? "text-nebula-600 dark:text-nebula-400 bg-nebula-50 dark:bg-nebula-500/10"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
          )}
          title={t('right_sidebar.ai')}
        >
          <Bot size={20} strokeWidth={activeTab === 'ai' ? 2.5 : 2} />
          {activeTab === 'ai' && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-nebula-500 rounded-r-full" />
          )}
        </button>

        <button
          onClick={() => toggleTab('snippets')}
          className={simpleCn(
            "p-2 rounded-xl transition-all relative group",
            activeTab === 'snippets'
              ? "text-nebula-600 dark:text-nebula-400 bg-nebula-50 dark:bg-nebula-500/10"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
          )}
          title={t('right_sidebar.snippets')}
        >
          <Code2 size={20} strokeWidth={activeTab === 'snippets' ? 2.5 : 2} />
          {activeTab === 'snippets' && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-nebula-500 rounded-r-full" />
          )}
        </button>

        <button
          onClick={() => toggleTab('history')}
          className={simpleCn(
            "p-2 rounded-xl transition-all relative group",
            activeTab === 'history'
              ? "text-nebula-600 dark:text-nebula-400 bg-nebula-50 dark:bg-nebula-500/10"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
          )}
          title={t('right_sidebar.history')}
        >
          <Clock size={20} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
          {activeTab === 'history' && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-nebula-500 rounded-r-full" />
          )}
        </button>

        <div className="mt-auto flex flex-col gap-4">
          {/* Placeholder for future settings or other bottom icons */}
        </div>
      </div>
    </div>
  );
};
