import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SlotProvider, useSlot } from './contexts/SlotContext';

// Helper component to portal pane content
const PanePortal: React.FC<{ paneId: string; children: React.ReactNode }> = ({ paneId, children }) => {
  const { getPaneRoot } = useSlot();
  const target = getPaneRoot(paneId);

  return createPortal(children, target);
};

import { invoke } from '@tauri-apps/api/core';
import { Server, Session, ConnectionStatus, Pane, Tab, SplitNode } from './types';
import { simpleCn, generateId, isTauri } from './utils';
import { TerminalSession } from './components/Terminal/TerminalSession';
import { SplitPane } from './components/Layout/SplitPane';
import { ConnectionItem } from './components/Sidebar/ConnectionItem';
import { NewConnectionModal } from './components/NewConnectionModal';
import { SettingsModal } from './components/SettingsModal';
import { SplashScreen } from './components/SplashScreen';
import { RightSidebar } from './components/RightSidebar';
import { AIModal } from './components/AIModal';
import { Button } from './components/ui/Button';
import { useApp } from './contexts/AppContext';
import { TitleBar } from './components/TitleBar';
import { useSplitPanes } from './hooks/useSplitPanes';
import {
  Plus,
  Search,
  Settings,
  Command,
  X,
  Menu,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  TerminalSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const INITIAL_SERVERS: Server[] = [];

const LOCAL_SERVER: Server = {
  id: 'local',
  protocol: 'local',
  name: 'Local Terminal',
  group: 'Local',
  host: 'localhost',
  username: 'local',
  port: 0,
  tags: [],
  color: 'green',
  created_at: 0,
  updated_at: 0
};

function AppContent() {
  const { t } = useApp();
  const [servers, setServers] = useState<Server[]>(INITIAL_SERVERS);

  // Use split panes hook
  const {
    sessions,
    panes,
    tabs,
    activeTabId,
    handleConnect: handleConnectPane,
    handleSplit: handleSplitState,
    handlePaneFocus,
    handleUpdatePane,
    updateSession,
    handleCloseTab,
    handleClosePane,
    setActiveTabId,
    handleResize,
  } = useSplitPanes();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNewConnectionModalOpen, setIsNewConnectionModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Refs for stable handlers
  const serversRef = useRef(servers);

  useEffect(() => {
    serversRef.current = servers;
  }, [servers]);

  // Tab scrolling refs and state
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const checkScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [sessions, isSidebarOpen]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const handleConnect = React.useCallback(async (server: Server) => {
    // Get appropriate default directory
    let defaultDir = '/';
    if (server.protocol === 'local') {
      try {
        defaultDir = await invoke<string>('get_home_directory');
      } catch (e) {
        console.error('Failed to get home directory:', e);
        defaultDir = '/';
      }
    } else {
      defaultDir = '/';
    }

    handleConnectPane(server, defaultDir);

    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, [handleConnectPane]);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const dbServers = await invoke<Server[]>('get_servers');
      setServers(dbServers);
    } catch (e) {
      console.error('Failed to load servers:', e);
    }
  };

  // Global keyboard shortcuts
  const { toggleAIModal } = useApp();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K: Toggle AI Assistant
      if (modifier && e.key === 'k') {
        e.preventDefault();
        toggleAIModal();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAIModal]);

  const handleAddServer = React.useCallback(async (newServer: Server) => {
    try {
      console.log('Saving server:', newServer);

      const serverId = await invoke<number>('save_server', {
        server: {
          name: newServer.name,
          host: newServer.host,
          port: parseInt(newServer.port?.toString() || '22'),
          username: newServer.username,
          password: newServer.password || null,
          id: typeof newServer.id === 'number' ? newServer.id : null, // Use existing ID for updates
          private_key_path: null,
          group: newServer.group,
          tags: newServer.tags,
          color: newServer.color,
          created_at: Date.now(),
          updated_at: Date.now(),
        }
      });

      console.log('Server saved with ID:', serverId);

      // Reload servers to get the new one with correct ID
      // We can't easily memoize loadServers without moving it or using refs, 
      // but we can just call the logic here or trigger a reload.
      // For now, let's just call the raw invoke and update state.
      try {
        const dbServers = await invoke<Server[]>('get_servers');
        setServers(dbServers);
      } catch (e) {
        console.error('Failed to load servers:', e);
      }

      console.log('Servers reloaded successfully');
    } catch (e) {
      console.error('Failed to save server:', e);
      alert(`Failed to save server: ${e}`);
    }
  }, []);

  const handleNewLocalTerminal = React.useCallback(() => {
    handleConnect(LOCAL_SERVER);
  }, [handleConnect]);

  const handleEditServer = React.useCallback((server: Server) => {
    setEditingServer(server);
    setIsNewConnectionModalOpen(true);
  }, []);

  const handleDeleteServer = React.useCallback(async (serverId: string | number) => {
    // Don't allow deleting local terminal
    if (serverId === 'local') return;

    if (confirm(t('common.confirm_delete') || 'Are you sure you want to delete this connection?')) {
      try {
        await invoke('delete_server', { id: serverId });
        // Remove from local state
        setServers(prev => prev.filter(s => s.id !== serverId));

        // TODO: Close tabs/sessions associated with this server
      } catch (e) {
        console.error('Failed to delete server:', e);
        alert(`Failed to delete server: ${e}`);
      }
    }
  }, [t]);

  const toggleGroup = (group: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(group)) newCollapsed.delete(group);
    else newCollapsed.add(group);
    setCollapsedGroups(newCollapsed);
  };

  const groupedServers = useMemo(() => {
    const filtered = servers.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.host.includes(searchQuery) ||
      s.tags.some(t => t.includes(searchQuery))
    );

    const groups: Record<string, Server[]> = {};
    filtered.forEach(server => {
      const groupName = server.group || t('sidebar.groups');
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(server);
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [servers, searchQuery, t]);

  const handleSplitAction = useCallback(async (direction: 'horizontal' | 'vertical') => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;
    const activePaneId = activeTab.activePaneId;
    const activePane = panes[activePaneId];
    if (!activePane) return;
    const sourceSessionId = activePane.sessionId;
    const session = sessions[sourceSessionId];

    const newSessionId = generateId();

    try {
      if (session?.serverId === 'local') {
        await invoke('connect_local', {
          id: newSessionId,
          cols: 80,
          rows: 24
        });
      } else {
        await invoke('duplicate_session', {
          sourceId: sourceSessionId,
          newId: newSessionId
        });
      }
      handleSplitState(direction, newSessionId);
    } catch (e) {
      console.error('Failed to split pane:', e);
    }
  }, [activeTabId, tabs, panes, sessions, handleSplitState]);

  // Helper to render a pane
  const activeTab = tabs.find(t => t.id === activeTabId);

  const renderPane = (paneId: string) => {
    const pane = panes[paneId];
    if (!pane) return null;
    const session = sessions[pane.sessionId];
    if (!session) return null;
    const server = servers.find(s => s.id === session.serverId) || (session.serverId === 'local' ? LOCAL_SERVER : undefined);
    if (!server) return null;

    const isActivePane = activeTab?.activePaneId === paneId;

    return (
      <TerminalSession
        key={session.id}
        session={session}
        server={server}
        active={isActivePane}
        activeView={pane.activeView}
        paneId={paneId}
        editorFile={pane.editorFile}
        onUpdateSession={updateSession}
        onClose={() => handleCloseTab(activeTabId!)} // Close tab for now
        onSplit={handleSplitAction}
        onFocus={() => handlePaneFocus(paneId)}
        onUpdatePane={handleUpdatePane}
        onClosePane={() => handleClosePane(paneId)}
      />
    );
  };

  // Extract unique group names for the modal
  const existingGroups = useMemo(() => {
    const groups = new Set<string>();
    servers.forEach(s => {
      if (s.group) groups.add(s.group);
    });
    return Array.from(groups).sort();
  }, [servers]);

  // Get active session from active tab

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 dark:bg-dark-bg overflow-hidden text-slate-800 dark:text-slate-200 selection:bg-nebula-500/30 selection:text-nebula-600 dark:selection:text-nebula-100 font-sans transition-colors duration-300">

      {/* Custom Title Bar (Only renders in Tauri) */}
      <TitleBar />

      {/* Main Layout Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Sidebar */}
        <div
          className={simpleCn(
            "flex flex-col bg-white dark:bg-[#0b0b0d] border-r border-slate-200 dark:border-dark-border transition-all duration-300 ease-out z-30 shadow-xl md:shadow-none h-full",
            isSidebarOpen ? "w-[280px] translate-x-0" : "w-0 -translate-x-10 opacity-0 overflow-hidden absolute md:relative"
          )}
        >
          {/* Sidebar Header */}
          <div className="h-12 px-4 border-b border-slate-200 dark:border-dark-border flex items-center justify-between bg-white dark:bg-[#0b0b0d] flex-shrink-0 gap-2">
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={handleNewLocalTerminal}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-dark-border border border-slate-200 dark:border-dark-border rounded-md transition-all text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:shadow-sm"
                title={t('sidebar.new_local')}
              >
                <TerminalSquare size={14} />
                <span>{t('sidebar.local_btn')}</span>
              </button>
              <button
                onClick={() => setIsNewConnectionModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-dark-border border border-slate-200 dark:border-dark-border rounded-md transition-all text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:shadow-sm"
                title={t('sidebar.new_connection')}
              >
                <Plus size={14} />
                <span>{t('sidebar.new_btn')}</span>
              </button>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 bg-slate-50 dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-dark-border border border-slate-200 dark:border-dark-border rounded-md transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:shadow-sm"
              title={t('sidebar.collapse')}
            >
              <PanelLeftClose size={14} />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 flex-shrink-0">
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 group-focus-within:text-nebula-500 dark:group-focus-within:text-nebula-400 transition-colors" size={14} />
              <input
                className="w-full bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-nebula-500/40 focus:ring-2 focus:ring-nebula-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder={t('sidebar.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Connection List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 scrollbar-hide mask-image-b">
            {groupedServers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs text-center">
                <span>{t('sidebar.empty')}</span>
              </div>
            )}

            {groupedServers.map(([groupName, groupServers]) => (
              <div key={groupName} className="animate-fade-in">
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="flex items-center w-full px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors group select-none"
                >
                  {collapsedGroups.has(groupName) ? (
                    <ChevronRight size={12} className="mr-2 text-slate-400 dark:text-slate-600" />
                  ) : (
                    <ChevronDown size={12} className="mr-2 text-slate-400 dark:text-slate-600" />
                  )}
                  <span className="flex-1 text-left">
                    {groupName.startsWith('common.') ? t(groupName as any) : groupName}
                  </span>
                  <span className="bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border px-1.5 py-0.5 rounded text-[9px] text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                    {groupServers.length}
                  </span>
                </button>

                {!collapsedGroups.has(groupName) && (
                  <div className="space-y-1 mt-0.5">
                    {groupServers.map(server => (
                      <ConnectionItem
                        key={server.id}
                        server={server}
                        onClick={() => handleConnect(server)}
                        onConnect={() => handleConnect(server)}
                        onEdit={() => handleEditServer(server)}
                        onDelete={() => handleDeleteServer(server.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Settings Button */}
          <div className="border-t border-slate-200 dark:border-dark-border p-3 flex-shrink-0">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center justify-center w-full p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-surface group transition-colors"
              title="Settings"
            >
              <Settings size={18} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            </button>
          </div>
        </div>




        {/* Main Content */}
        < div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#0d1117] relative transition-all h-full" >

          {/* Mobile Menu Toggle */}
          < div className="absolute left-4 bottom-4 z-50 md:hidden" >
            <Button size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="rounded-full shadow-xl bg-nebula-600 hover:bg-nebula-500">
              <Menu size={20} />
            </Button>
          </div >

          {/* Global Tab Bar */}
          < div className="h-11 bg-slate-50 dark:bg-[#0d1117] flex items-end px-2 gap-1 select-none border-b border-slate-200 dark:border-dark-border/50 z-20 transition-colors flex-shrink-0" >
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="mb-2 mr-2 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-surface/50 transition-all hidden md:block"
                title={t('sidebar.expand')}
              >
                <PanelLeftOpen size={18} />
              </button>
            )
            }

            <div className="flex-1 relative flex items-end h-full min-w-0 overflow-hidden">
              {/* Left Scroll Button with Gradient */}
              <div className={simpleCn(
                "absolute left-0 bottom-0 top-0 z-20 flex items-center pr-4 pl-1 bg-gradient-to-r from-slate-50 via-slate-50 to-transparent dark:from-[#0d1117] dark:via-[#0d1117] transition-opacity duration-200",
                showLeftScroll ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
                <button
                  onClick={() => scrollTabs('left')}
                  className="p-1 bg-white dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-white/10 rounded-full shadow-md border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>

              <div
                ref={tabsRef}
                onScroll={checkScroll}
                className="flex-1 flex gap-1 overflow-x-auto no-scrollbar h-full items-end pb-[1px] px-1 scroll-smooth"
              >
                {tabs.map(tab => {
                  const pane = panes[tab.activePaneId];
                  const session = pane ? sessions[pane.sessionId] : null;
                  const server = session ? servers.find(s => s.id === session.serverId) || (session.serverId === 'local' ? LOCAL_SERVER : undefined) : null;
                  const isActive = activeTabId === tab.id;

                  // Display name priority: server name > tab title > fallback
                  const displayName = server?.name || tab.title || 'Session';

                  return (
                    <div
                      key={tab.id}
                      onClick={() => setActiveTabId(tab.id)}
                      className={simpleCn(
                        "group relative flex items-center gap-2.5 px-4 h-9 rounded-t-lg text-xs font-medium min-w-[160px] max-w-[240px] cursor-pointer transition-all duration-200 border-t border-x flex-shrink-0",
                        isActive
                          ? "bg-white dark:bg-[#0d1117] border-slate-200 dark:border-dark-border border-b-white dark:border-b-[#0d1117] text-slate-800 dark:text-slate-100 shadow-sm dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)] z-10"
                          : "bg-slate-200/50 dark:bg-[#121214] border-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-[#18181b] hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      {isActive && <div className="absolute top-0 left-0 w-full h-[2px] bg-nebula-500 rounded-t-full" />}

                      <div className="w-1.5 h-1.5 rounded-full transition-colors" />

                      <span className="truncate flex-1">{displayName}</span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseTab(tab.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Right Scroll Button with Gradient */}
              <div className={simpleCn(
                "absolute right-0 bottom-0 top-0 z-20 flex items-center pl-4 pr-1 bg-gradient-to-l from-slate-50 via-slate-50 to-transparent dark:from-[#0d1117] dark:via-[#0d1117] transition-opacity duration-200",
                showRightScroll ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
                <button
                  onClick={() => scrollTabs('right')}
                  className="p-1 bg-white dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-white/10 rounded-full shadow-md border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="h-full flex items-center px-2 mb-[1px]">
              <button
                onClick={() => setIsNewConnectionModalOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-nebula-600 dark:hover:text-nebula-400 hover:bg-nebula-50 dark:hover:bg-nebula-500/10 transition-all"
                title={t('sidebar.new_connection')}
              >
                <Plus size={18} />
              </button>
            </div>
          </div >


          <div className="flex-1 flex min-h-0 overflow-hidden relative">
            {
              tabs.length > 0 ? (
                <>
                  {tabs.map(tab => (
                    <div
                      key={tab.id}
                      className="absolute inset-0 bg-slate-50 dark:bg-dark-bg flex flex-col"
                      style={{
                        display: activeTabId === tab.id ? 'flex' : 'none',
                        zIndex: activeTabId === tab.id ? 10 : 0
                      }}
                    >
                      <SplitPane
                        node={tab.layout}
                        panes={panes}
                        onResize={(nodeId, sizes) => handleResize(tab.id, nodeId, sizes)}
                      />
                    </div>
                  ))}
                  {Object.values(panes).map(pane => {
                    const session = sessions[pane.sessionId];
                    if (!session) return null;
                    const server = servers.find(s => s.id === session.serverId) || (session.serverId === 'local' ? LOCAL_SERVER : undefined);
                    if (!server) return null;

                    return (
                      <PanePortal key={pane.id} paneId={pane.id}>
                        <TerminalSession
                          key={session.id} // Stable key
                          session={session}
                          server={server}
                          active={activeTab?.activePaneId === pane.id}
                          activeView={pane.activeView}
                          paneId={pane.id}
                          editorFile={pane.editorFile}
                          onUpdateSession={updateSession}
                          onClose={() => handleCloseTab(activeTabId!)}
                          onSplit={handleSplitAction}
                          onFocus={() => handlePaneFocus(pane.id)}
                          onUpdatePane={handleUpdatePane}
                          onClosePane={() => handleClosePane(pane.id)}
                        />
                      </PanePortal>
                    );
                  })}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-8 p-8 relative overflow-hidden bg-slate-50 dark:bg-dark-bg w-full h-full">
                  {/* Decorative background elements */}
                  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nebula-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-normal" />
                  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-normal" />

                  <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up">
                    <div className="w-32 h-32 rounded-[2rem] bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border/50 flex items-center justify-center rotate-6 shadow-xl mb-8 relative group cursor-default transition-transform hover:rotate-3 hover:scale-105 duration-500">
                      <div className="absolute inset-0 bg-gradient-to-br from-nebula-500/20 to-purple-500/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Command size={64} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-200 transition-colors" />
                    </div>

                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-3 tracking-tight">{t('common.connect')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed mb-8">
                      {t('terminal.welcome')}
                    </p>

                    <div className="flex gap-4">
                      <Button onClick={() => setIsNewConnectionModalOpen(true)} className="pl-4 pr-5 py-2.5 shadow-lg shadow-nebula-500/20">
                        <Plus size={18} className="mr-2" />
                        {t('modal.new_connection_title')}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            }
          </div >


        </div >
        {/* Right Sidebar (Activity Bar Style) */}
        < RightSidebar
          activeSessionId={activeTab?.activePaneId ? panes[activeTab.activePaneId]?.sessionId : null}
          activeServerId={activeTab?.activePaneId && panes[activeTab.activePaneId] ? sessions[panes[activeTab.activePaneId].sessionId]?.serverId || null : null
          }
        />

        <NewConnectionModal
          isOpen={isNewConnectionModalOpen}
          onClose={() => {
            setIsNewConnectionModalOpen(false);
            setEditingServer(null);
          }}
          onSave={handleAddServer}
          existingGroups={Array.from(new Set(servers.map(s => s.group || ''))).filter(Boolean)}
          editingServer={editingServer}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
        <AIModal />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SlotProvider>
      <AppContent />
    </SlotProvider>
  );
}
