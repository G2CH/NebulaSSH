import React, { useRef, useState, useEffect } from 'react';
import { simpleCn } from '../../utils';
import {
    PanelLeftOpen,
    ChevronLeft,
    ChevronRight,
    Plus,
    X
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Tab, Pane, Session, Server } from '../../types';

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

interface TabBarProps {
    tabs: Tab[];
    activeTabId: string | null;
    onActivateTab: (id: string) => void;
    onCloseTab: (id: string) => void;
    onNewConnection: () => void;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    panes: Record<string, Pane>;
    sessions: Record<string, Session>;
    servers: Server[];
}

export const TabBar: React.FC<TabBarProps> = ({
    tabs,
    activeTabId,
    onActivateTab,
    onCloseTab,
    onNewConnection,
    isSidebarOpen,
    onToggleSidebar,
    panes,
    sessions,
    servers
}) => {
    const { t } = useApp();
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
    }, [tabs, isSidebarOpen]);

    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsRef.current) {
            tabsRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

    return (
        <div className="h-11 bg-slate-50 dark:bg-[#0d1117] flex items-end px-2 gap-1 select-none border-b border-slate-200 dark:border-dark-border/50 z-20 transition-colors flex-shrink-0">
            {!isSidebarOpen && (
                <button
                    onClick={onToggleSidebar}
                    className="mb-2 mr-2 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-surface/50 transition-all hidden md:block"
                    title={t('sidebar.expand')}
                >
                    <PanelLeftOpen size={18} />
                </button>
            )}

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
                                onClick={() => onActivateTab(tab.id)}
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
                                        onCloseTab(tab.id);
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
                    onClick={onNewConnection}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-nebula-600 dark:hover:text-nebula-400 hover:bg-nebula-50 dark:hover:bg-nebula-500/10 transition-all"
                    title={t('sidebar.new_connection')}
                >
                    <Plus size={18} />
                </button>
            </div>
        </div>
    );
};
