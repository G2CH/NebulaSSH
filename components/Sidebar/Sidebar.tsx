import React, { useState, useMemo } from 'react';
import { simpleCn } from '../../utils';
import { ConnectionItem } from './ConnectionItem';
import {
    Settings,
    Search,
    Plus,
    TerminalSquare,
    PanelLeftClose,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Server } from '../../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNewLocal: () => void;
    onNewConnection: () => void;
    onOpenSettings: () => void;
    servers: Server[];
    onConnect: (server: Server) => void;
    onEditServer: (server: Server) => void;
    onDeleteServer: (id: string | number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    onNewLocal,
    onNewConnection,
    onOpenSettings,
    servers,
    onConnect,
    onEditServer,
    onDeleteServer
}) => {
    const { t } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

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

    return (
        <div
            className={simpleCn(
                "flex flex-col bg-white dark:bg-[#0b0b0d] border-r border-slate-200 dark:border-dark-border transition-all duration-300 ease-out z-30 shadow-xl md:shadow-none h-full",
                isOpen ? "w-[280px] translate-x-0" : "w-0 -translate-x-10 opacity-0 overflow-hidden absolute md:relative"
            )}
        >
            {/* Sidebar Header */}
            <div className="h-12 px-4 border-b border-slate-200 dark:border-dark-border flex items-center justify-between bg-white dark:bg-[#0b0b0d] flex-shrink-0 gap-2">
                <div className="flex items-center gap-2 flex-1">
                    <button
                        onClick={onNewLocal}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-dark-border border border-slate-200 dark:border-dark-border rounded-md transition-all text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:shadow-sm"
                        title={t('sidebar.new_local')}
                    >
                        <TerminalSquare size={14} />
                        <span>{t('sidebar.local_btn')}</span>
                    </button>
                    <button
                        onClick={onNewConnection}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-dark-border border border-slate-200 dark:border-dark-border rounded-md transition-all text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:shadow-sm"
                        title={t('sidebar.new_connection')}
                    >
                        <Plus size={14} />
                        <span>{t('sidebar.new_btn')}</span>
                    </button>
                </div>
                <button
                    onClick={onClose}
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
                                        onClick={() => onConnect(server)}
                                        onConnect={() => onConnect(server)}
                                        onEdit={() => onEditServer(server)}
                                        onDelete={() => onDeleteServer(server.id)}
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
                    onClick={onOpenSettings}
                    className="flex items-center justify-center w-full p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-surface group transition-colors"
                    title="Settings"
                >
                    <Settings size={18} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                </button>
            </div>
        </div>
    );
};
