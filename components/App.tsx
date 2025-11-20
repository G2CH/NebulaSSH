
import React, { useState, useMemo } from 'react';
import { Server, Session, ConnectionStatus } from './types';
import { simpleCn, generateId } from './utils';
import { TerminalSession } from './components/Terminal/TerminalSession';
import { ConnectionItem } from './components/Sidebar/ConnectionItem';
import { NewConnectionModal } from './components/NewConnectionModal';
import { SettingsModal } from './components/SettingsModal';
import { Button } from './components/ui/Button';
import { useApp } from './contexts/AppContext';
import { 
  Plus, 
  Search, 
  Settings, 
  Command, 
  X, 
  Menu,
  ChevronLeft,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const INITIAL_SERVERS: Server[] = [
  { id: '1', name: 'Production Web', group: 'Production', host: '10.0.0.52', user: 'admin', tags: ['prod', 'web'], color: 'nebula', lastConnected: Date.now() - 100000 },
  { id: '2', name: 'Analytics DB', group: 'Production', host: 'db-01.internal', user: 'postgres', tags: ['db', 'prod'], color: 'purple' },
  { id: '3', name: 'Staging API', group: 'Staging', host: 'api.stage.nebula.dev', user: 'deploy', tags: ['stage'], color: 'orange' },
  { id: '4', name: 'Personal VPS', group: 'Personal', host: '192.168.1.200', user: 'josh', tags: ['personal'], color: 'blue' },
  { id: '5', name: 'Raspberry Pi', group: 'Personal', host: '192.168.1.15', user: 'pi', tags: ['iot'], color: 'orange' },
  { id: '6', name: 'Jump Host', group: 'General', host: 'jump.corp.net', user: 'root', tags: ['gateway'], color: 'nebula' },
];

export default function App() {
  const { t } = useApp();
  const [servers, setServers] = useState<Server[]>(INITIAL_SERVERS);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNewConnectionModalOpen, setIsNewConnectionModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const handleConnect = (server: Server) => {
    const newSession: Session = {
      id: generateId(),
      serverId: server.id,
      status: ConnectionStatus.CONNECTED,
      activeView: 'terminal',
      history: [],
      currentDirectory: '/home/user',
      commandHistory: [],
      historyPointer: 0,
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleCloseSession = (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);
    if (activeSessionId === sessionId) {
      setActiveSessionId(newSessions.length > 0 ? newSessions[newSessions.length - 1].id : null);
    }
  };

  const updateSession = (sessionId: string, updates: Partial<Session>) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
  };

  const handleAddServer = (newServer: Server) => {
    setServers([...servers, newServer]);
  };

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

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-dark-bg overflow-hidden text-slate-800 dark:text-slate-200 selection:bg-nebula-500/30 selection:text-nebula-600 dark:selection:text-nebula-100 font-sans transition-colors duration-300">
      
      {/* Sidebar */}
      <div 
        className={simpleCn(
          "flex flex-col bg-white dark:bg-[#0b0b0d] border-r border-slate-200 dark:border-dark-border transition-all duration-300 ease-out z-30 shadow-xl md:shadow-none",
          isSidebarOpen ? "w-[280px] translate-x-0" : "w-0 -translate-x-10 opacity-0 overflow-hidden absolute md:relative"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-14 px-4 border-b border-slate-200 dark:border-dark-border flex items-center justify-between bg-white dark:bg-[#0b0b0d]">
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-7 h-7 bg-gradient-to-tr from-nebula-600 to-nebula-400 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-nebula-500/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-slate-900 dark:text-slate-100 text-sm">Nebula</span>
          </div>
          <button onClick={() => setIsNewConnectionModalOpen(true)} className="p-1.5 bg-slate-50 dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-dark-border border border-slate-200 dark:border-dark-border rounded-md transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:shadow-sm">
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
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
                <span className="flex-1 text-left">{groupName}</span>
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
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-dark-border bg-white dark:bg-[#0b0b0d]">
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center justify-between w-full p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-surface group transition-colors"
          >
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                 JD
               </div>
               <div className="text-left">
                 <div className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">John Doe</div>
                 <div className="text-[10px] text-slate-400 dark:text-slate-500">{t('sidebar.plan_pro')}</div>
               </div>
             </div>
             <Settings size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#0d1117] relative transition-all">
        
        {/* Mobile Menu Toggle */}
        <div className="absolute left-4 bottom-4 z-50 md:hidden">
           <Button size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="rounded-full shadow-xl bg-nebula-600 hover:bg-nebula-500">
              <Menu size={20} />
           </Button>
        </div>

        {/* Global Tab Bar */}
        <div className="h-11 bg-slate-50 dark:bg-[#0d1117] flex items-end px-2 gap-1 select-none border-b border-slate-200 dark:border-dark-border/50 z-20 transition-colors">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mb-2 mr-2 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-surface/50 transition-all hidden md:block"
          >
             {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar h-full items-end pb-[1px]">
            {sessions.map(session => {
              const server = servers.find(s => s.id === session.serverId);
              const isActive = activeSessionId === session.id;
              return (
                <div 
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={simpleCn(
                    "group relative flex items-center gap-2.5 px-4 h-9 rounded-t-lg text-xs font-medium min-w-[160px] max-w-[240px] cursor-pointer transition-all duration-200 border-t border-x",
                    isActive 
                      ? "bg-white dark:bg-[#0d1117] border-slate-200 dark:border-dark-border border-b-white dark:border-b-[#0d1117] text-slate-800 dark:text-slate-100 shadow-sm dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)] z-10" 
                      : "bg-slate-200/50 dark:bg-[#121214] border-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-[#18181b] hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {isActive && <div className="absolute top-0 left-0 w-full h-[2px] bg-nebula-500 rounded-t-full" />}
                  
                  <div className={simpleCn(
                    "w-1.5 h-1.5 rounded-full transition-colors", 
                    isActive ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" : "bg-slate-400 dark:bg-slate-600"
                  )} />
                  
                  <span className="truncate flex-1">{server?.name || t('common.unknown')}</span>
                  
                  <button 
                    onClick={(e) => handleCloseSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
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
        </div>

        {/* Workspace */}
        {activeSession ? (
          <TerminalSession 
            key={activeSession.id}
            session={activeSession}
            active={true}
            onUpdateSession={updateSession}
            onClose={() => handleCloseSession(activeSession.id)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-8 p-8 relative overflow-hidden bg-slate-50 dark:bg-dark-bg">
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
        )}
      </div>

      <NewConnectionModal 
        isOpen={isNewConnectionModalOpen}
        onClose={() => setIsNewConnectionModalOpen(false)}
        onSave={handleAddServer}
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
