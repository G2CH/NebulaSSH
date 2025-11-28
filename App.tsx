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
import { Server, Session, ConnectionStatus, Pane, Tab, SplitNode, AppSessionState, TabState, PaneState, AppSettings } from './types';
import { simpleCn, generateId, isTauri } from './utils';
import { TerminalSession } from './components/Terminal/TerminalSession';
import { SplitPane } from './components/Layout/SplitPane';

import { NewConnectionModal } from './components/NewConnectionModal';
import { SettingsModal } from './components/SettingsModal';
import { SplashScreen } from './components/SplashScreen';
import { RightSidebar } from './components/RightSidebar';
import { AIModal } from './components/AIModal';
import { UnlockScreen } from './components/Security/UnlockScreen';
import { SetupMasterPassword } from './components/Security/SetupMasterPassword';
import { Button } from './components/ui/Button';
import { useApp } from './contexts/AppContext';
import { TitleBar } from './components/TitleBar';
import { useSplitPanes } from './hooks/useSplitPanes';
import { useIdleTimer } from './hooks/useIdleTimer';
import {
  Menu,
  Command,
  Plus,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TabBar } from './components/Layout/TabBar';

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
  const { t, updateSettings, settings } = useApp();
  const [servers, setServers] = useState<Server[]>(INITIAL_SERVERS);
  const [isLocked, setIsLocked] = useState(false);
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [isCheckingSecurity, setIsCheckingSecurity] = useState(true);

  // Auto-lock timer
  useIdleTimer(
    settings.lock_timeout,
    () => {
      if (!isLocked && !isSetupRequired && !isCheckingSecurity) {
        console.log('Auto-locking due to inactivity');
        setIsLocked(true);
      }
    },
    !isLocked && !isSetupRequired && !isCheckingSecurity // Only active when unlocked
  );


  // Check security status on mount
  useEffect(() => {
    const checkSecurity = async () => {
      try {
        const isSet = await invoke<boolean>('is_master_password_set');
        if (isSet) {
          // Only lock on startup if auto-lock is enabled
          if (settings.lock_timeout > 0) {
            setIsLocked(true);
          }
        } else {
          // Force setup on first run (no master password set yet)
          setIsSetupRequired(true);
        }
      } catch (e) {
        console.error('Failed to check security:', e);
      } finally {
        setIsCheckingSecurity(false);
      }
    };
    checkSecurity();
  }, []); // Run only once on mount


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
    restoreState,
  } = useSplitPanes();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Session Persistence
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await invoke<AppSessionState | null>('load_session_state');
        if (savedState) {
          console.log('Restoring session state:', savedState);
          restoreState(savedState);

          // Reconnect sessions (optional: auto-reconnect logic could go here)
          // For now, sessions start as DISCONNECTED.
          // We could trigger reconnection for active tab's panes.
        }
      } catch (e) {
        console.error('Failed to load session state:', e);
      }
    };
    loadState();
  }, [restoreState]);

  // Auto-save state
  useEffect(() => {
    const saveState = async () => {
      if (tabs.length === 0) return;

      const tabStates: TabState[] = tabs.map(tab => {
        // Collect panes for this tab
        const tabPanes: PaneState[] = [];
        const collectPanes = (node: SplitNode) => {
          if (node.type === 'leaf' && node.paneId) {
            const pane = panes[node.paneId];
            if (pane) {
              const session = sessions[pane.sessionId];
              tabPanes.push({
                id: pane.id,
                session_id: pane.sessionId,
                server_id: session?.serverId || '',
                current_directory: session?.currentDirectory || null,
                active_view: pane.activeView,
                editor_file: pane.editorFile || null,
              });
            }
          }
          if (node.children) {
            node.children.forEach(collectPanes);
          }
        };
        collectPanes(tab.layout);

        return {
          id: tab.id,
          name: tab.title,
          layout: tab.layout,
          panes: tabPanes,
          active_pane_id: tab.activePaneId,
        };
      });

      const state: AppSessionState = {
        tabs: tabStates,
        active_tab_id: activeTabId,
        last_saved: Date.now(),
        version: '0.2.0', // Should match backend version
      };

      try {
        await invoke('save_session_state', { state });
      } catch (e) {
        console.error('Failed to save session state:', e);
      }
    };

    const timer = setTimeout(saveState, 5000); // Debounce 5s
    return () => clearTimeout(timer);
  }, [tabs, panes, sessions, activeTabId]);
  const [isNewConnectionModalOpen, setIsNewConnectionModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);


  // Refs for stable handlers
  const serversRef = useRef(servers);

  useEffect(() => {
    serversRef.current = servers;
  }, [servers]);



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



  // Get active session from active tab

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isCheckingSecurity) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (isSetupRequired) {
    return <SetupMasterPassword onComplete={() => setIsSetupRequired(false)} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 dark:bg-dark-bg overflow-hidden text-slate-800 dark:text-slate-200 selection:bg-nebula-500/30 selection:text-nebula-600 dark:selection:text-nebula-100 font-sans transition-colors duration-300 relative">

      {/* Security Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-[100]">
          <UnlockScreen onUnlock={async () => {
            setIsLocked(false);
            // Reload all data after unlock
            await loadServers();
            // Reload settings
            try {
              const loaded = await invoke<AppSettings>('get_app_settings');
              updateSettings(loaded);
            } catch (e) {
              console.error('Failed to reload settings:', e);
            }
          }} />
        </div>
      )}

      {/* Custom Title Bar (Only renders in Tauri) */}
      <TitleBar />

      {/* Main Layout Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Sidebar */}
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNewLocal={handleNewLocalTerminal}
          onNewConnection={() => setIsNewConnectionModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          servers={servers}
          onConnect={handleConnect}
          onEditServer={handleEditServer}
          onDeleteServer={handleDeleteServer}
        />




        {/* Main Content */}
        < div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#0d1117] relative transition-all h-full" >

          {/* Mobile Menu Toggle */}
          < div className="absolute left-4 bottom-4 z-50 md:hidden" >
            <Button size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="rounded-full shadow-xl bg-nebula-600 hover:bg-nebula-500">
              <Menu size={20} />
            </Button>
          </div >

          {/* Global Tab Bar */}
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onActivateTab={setActiveTabId}
            onCloseTab={handleCloseTab}
            onNewConnection={() => setIsNewConnectionModalOpen(true)}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            panes={panes}
            sessions={sessions}
            servers={servers}
          />


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
                          paneCount={Object.keys(panes).length}
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
