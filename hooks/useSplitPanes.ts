import { useState, useCallback } from 'react';
import { Session, Pane, Tab, SplitNode, Server, AppSessionState, TabState, PaneState } from '../types';
import { ConnectionStatus } from '../types';

export const useSplitPanes = () => {
    const [sessions, setSessions] = useState<Record<string, Session>>({});
    const [panes, setPanes] = useState<Record<string, Pane>>({});
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    const createSession = useCallback((server: Server, defaultDir: string): Session => {
        return {
            id: `session-${Date.now()}`,
            serverId: server.id,
            status: ConnectionStatus.CONNECTED,
            history: [],
            currentDirectory: defaultDir,
            commandHistory: [],
            historyPointer: 0,
        };
    }, []);

    const createPane = useCallback((sessionId: string): Pane => {
        return {
            id: `pane-${Date.now()}`,
            sessionId,
            activeView: 'terminal',
        };
    }, []);

    const createTab = useCallback((title: string, paneId: string): Tab => {
        return {
            id: `tab-${Date.now()}`,
            title,
            activePaneId: paneId,
            layout: {
                id: `node-${Date.now()}`,
                type: 'leaf',
                paneId
            }
        };
    }, []);

    const handleConnect = useCallback((server: Server, defaultDir: string) => {
        const newSession = createSession(server, defaultDir);
        const newPane = createPane(newSession.id);
        const newTab = createTab(server.name, newPane.id);

        setSessions(prev => ({ ...prev, [newSession.id]: newSession }));
        setPanes(prev => ({ ...prev, [newPane.id]: newPane }));
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);

        return { session: newSession, pane: newPane, tab: newTab };
    }, [createSession, createPane, createTab]);

    const handleSplit = useCallback((direction: 'horizontal' | 'vertical', newSessionId?: string) => {
        if (!activeTabId) return;

        const tab = tabs.find(t => t.id === activeTabId);
        if (!tab) return;

        const activePaneId = tab.activePaneId;
        const activePane = panes[activePaneId];
        if (!activePane) return;

        const activeSession = sessions[activePane.sessionId];
        if (!activeSession) return;

        // If newSessionId provided, create new session state
        if (newSessionId) {
            const newSession: Session = {
                ...activeSession,
                id: newSessionId,
                status: ConnectionStatus.CONNECTING,
            };
            setSessions(prev => ({ ...prev, [newSessionId]: newSession }));
        }

        const newPane: Pane = {
            id: `pane-${Date.now()}`,
            sessionId: newSessionId || activePane.sessionId, // <- Reuse same session or use newSessionId!
            activeView: 'terminal',
        };

        // Update layout tree
        const updateLayoutTree = (node: SplitNode): SplitNode => {
            if (node.type === 'leaf' && node.paneId === activePaneId) {
                return {
                    id: `node-${Date.now()}`,
                    type: 'split',
                    direction,
                    children: [
                        node,
                        {
                            id: `node-${Date.now()}`,
                            type: 'leaf',
                            paneId: newPane.id
                        }
                    ]
                };
            }

            if (node.type === 'split' && node.children) {
                return {
                    ...node,
                    children: node.children.map(updateLayoutTree)
                };
            }

            return node;
        };

        const newLayout = updateLayoutTree(tab.layout);

        // Only add new pane (not a new session)
        setPanes(prev => ({ ...prev, [newPane.id]: newPane }));
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, layout: newLayout } : t
        ));
    }, [activeTabId, tabs, panes, sessions]);

    const handlePaneFocus = useCallback((paneId: string) => {
        if (activeTabId) {
            setTabs(prev => prev.map(t => {
                if (t.id === activeTabId && t.activePaneId !== paneId) {
                    return { ...t, activePaneId: paneId };
                }
                return t;
            }));
        }
    }, [activeTabId]);

    const handleUpdatePane = useCallback((paneId: string, updates: Partial<Pane>) => {
        setPanes(prev => ({
            ...prev,
            [paneId]: { ...prev[paneId], ...updates }
        }));
    }, []);

    const updateSession = useCallback((sessionId: string, updates: Partial<Session>) => {
        setSessions(prev => ({
            ...prev,
            [sessionId]: { ...prev[sessionId], ...updates }
        }));
    }, []);

    const handleResize = useCallback((tabId: string, nodeId: string, sizes: number[]) => {
        setTabs(prev => prev.map(t => {
            if (t.id !== tabId) return t;

            const updateNode = (node: SplitNode): SplitNode => {
                if (node.id === nodeId) {
                    return { ...node, sizes };
                }
                if (node.children) {
                    return { ...node, children: node.children.map(updateNode) };
                }
                return node;
            };

            return { ...t, layout: updateNode(t.layout) };
        }));
    }, []);

    const handleCloseTab = useCallback((tabId: string) => {
        // Find all panes and sessions for this tab
        const tab = tabs.find(t => t.id === tabId);
        if (!tab) return;

        // Remove tab
        setTabs(prev => {
            const filtered = prev.filter(t => t.id !== tabId);
            // If we closed the active tab, set a new active tab
            if (tabId === activeTabId) {
                setActiveTabId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
            }
            return filtered;
        });

        // Cleanup would go here - remove sessions and panes
        // For now simplified
    }, [tabs, activeTabId]);

    const handleClosePane = useCallback((paneId: string) => {
        if (!activeTabId) return;

        const tab = tabs.find(t => t.id === activeTabId);
        if (!tab) return;

        // Count panes in this tab
        const countPanes = (node: SplitNode): number => {
            if (node.type === 'leaf') return 1;
            if (node.type === 'split' && node.children) {
                return node.children.reduce((sum, child) => sum + countPanes(child), 0);
            }
            return 0;
        };

        const paneCount = countPanes(tab.layout);

        // If this is the only pane, close the entire tab
        if (paneCount <= 1) {
            handleCloseTab(activeTabId);
            return;
        }

        // Remove pane from layout tree
        const removePaneFromTree = (node: SplitNode): SplitNode | null => {
            if (node.type === 'leaf') {
                return node.paneId === paneId ? null : node;
            }

            if (node.type === 'split' && node.children) {
                const newChildren = node.children
                    .map(child => removePaneFromTree(child))
                    .filter((child): child is SplitNode => child !== null);

                if (newChildren.length === 0) return null;
                if (newChildren.length === 1) return newChildren[0];

                return { ...node, children: newChildren };
            }

            return node;
        };

        const newLayout = removePaneFromTree(tab.layout);
        if (!newLayout) {
            handleCloseTab(activeTabId);
            return;
        }

        // Get the new active pane ID BEFORE updating state
        const getFirstPaneId = (node: SplitNode): string | null => {
            if (node.type === 'leaf') return node.paneId ?? null;
            if (node.children && node.children.length > 0) {
                return getFirstPaneId(node.children[0]);
            }
            return null;
        };

        const newActivePaneId = tab.activePaneId === paneId
            ? (getFirstPaneId(newLayout) ?? tab.activePaneId)
            : tab.activePaneId;

        // Update tab layout FIRST with the new activePaneId
        setTabs(prev => prev.map(t => {
            if (t.id === activeTabId) {
                return { ...t, layout: newLayout, activePaneId: newActivePaneId };
            }
            return t;
        }));

        // THEN clean up pane and its session (after tab is updated)
        const pane = panes[paneId];
        if (pane) {
            setPanes(prev => {
                const { [paneId]: _, ...rest } = prev;
                return rest;
            });
            // Optionally clean up session if no other pane uses it
            // For now, keep the session
        }
    }, [activeTabId, tabs, panes, handleCloseTab]);

    const restoreState = useCallback((state: AppSessionState) => {
        const newSessions: Record<string, Session> = {};
        const newPanes: Record<string, Pane> = {};
        const newTabs: Tab[] = [];

        state.tabs.forEach(tabState => {
            // Restore panes and sessions for this tab
            if (tabState.panes) {
                tabState.panes.forEach(paneState => {
                    // Reconstruct Session
                    if (!newSessions[paneState.session_id]) {
                        newSessions[paneState.session_id] = {
                            id: paneState.session_id,
                            serverId: paneState.server_id,
                            status: ConnectionStatus.DISCONNECTED, // Start as disconnected
                            currentDirectory: paneState.current_directory || undefined,
                            history: [],
                            commandHistory: [],
                            historyPointer: 0,
                        };
                    }

                    // Reconstruct Pane
                    newPanes[paneState.id] = {
                        id: paneState.id,
                        sessionId: paneState.session_id,
                        activeView: paneState.active_view,
                        editorFile: paneState.editor_file || undefined,
                    };
                });
            }

            // Restore Tab
            const newTab: Tab = {
                id: tabState.id,
                title: tabState.name,
                activePaneId: tabState.active_pane_id || '',
                layout: tabState.layout
            };
            newTabs.push(newTab);
        });

        setSessions(newSessions);
        setPanes(newPanes);
        setTabs(newTabs);
        if (state.active_tab_id) {
            setActiveTabId(state.active_tab_id);
        }
    }, []);

    return {
        sessions,
        panes,
        tabs,
        activeTabId,
        handleConnect,
        handleSplit,
        handlePaneFocus,
        handleUpdatePane,
        updateSession,
        handleCloseTab,
        handleClosePane,
        setActiveTabId,
        handleResize,
        restoreState,
    };
};
