
import React, { useState, useRef, useEffect } from 'react';
import { Session, ConnectionStatus, Pane } from '../../types';
import { vfs } from '../../services/mockFileSystem';
import { simpleCn } from '../../utils';
import { Terminal as TerminalIcon, FolderOpen, Activity, Command, Sparkles, MessageSquare, Wrench, Lightbulb, SplitSquareHorizontal, SplitSquareVertical, X } from 'lucide-react';
import { SFTPBrowser } from '../SFTP/SFTPBrowser';
import { SystemDashboard } from './SystemDashboard';
import { SnippetPanel } from './SnippetPanel';
import { AIAssistant } from './AIAssistant';
import { TerminalContextMenu } from '../TerminalContextMenu';
import { useTerminalContextMenu } from '../../hooks/useTerminalContextMenu';
import { useApp } from '../../contexts/AppContext';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Server } from '../../types';
import { FileEditor } from '../FileEditor';

interface Props {
  session: Session;
  server: Server;
  active: boolean;
  activeView: 'terminal' | 'sftp' | 'monitor' | 'editor';
  paneId: string;
  editorFile?: string;
  paneCount?: number;
  onUpdateSession: (sessionId: string, updates: Partial<Session>) => void;
  onClose: () => void;
  onSplit: (direction: 'horizontal' | 'vertical') => void;
  onFocus?: () => void;
  onUpdatePane?: (paneId: string, updates: Partial<Pane>) => void;
  onClosePane?: () => void;
}

const LIGHT_THEME = {
  foreground: '#1e293b', // slate-800
  background: '#ffffff',
  cursor: '#0d9488',
  cursorAccent: '#ffffff',
  selectionBackground: 'rgba(13, 148, 136, 0.3)',
  black: '#000000',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  blue: '#3b82f6',
  magenta: '#a855f7',
  cyan: '#06b6d4',
  white: '#d1d5db',
  brightBlack: '#64748b',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#fde047',
  brightBlue: '#60a5fa',
  brightMagenta: '#c084fc',
  brightCyan: '#22d3ee',
  brightWhite: '#f8fafc',
};

const DARK_THEME = {
  foreground: '#e2e8f0', // slate-200
  background: '#0c0c0e',
  cursor: '#2dd4bf',
  cursorAccent: '#000000',
  selectionBackground: 'rgba(45, 212, 191, 0.3)',
  black: '#000000',
  red: '#ef4444',
  green: '#10b981',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  magenta: '#a855f7',
  cyan: '#06b6d4',
  white: '#e2e8f0',
  brightBlack: '#475569',
  brightRed: '#f87171',
  brightGreen: '#34d399',
  brightYellow: '#fbbf24',
  brightBlue: '#60a5fa',
  brightMagenta: '#c084fc',
  brightCyan: '#22d3ee',
  brightWhite: '#ffffff',
};

const THEME_PALETTES: Record<string, any> = {
  'default': DARK_THEME,
  'dracula': {
    ...DARK_THEME,
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#f8f8f2',
    selectionBackground: '#44475a',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a4',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff',
  },
  'onedark': {
    ...DARK_THEME,
    background: '#282c34',
    foreground: '#abb2bf',
    cursor: '#528bff',
    selectionBackground: '#3e4451',
    black: '#282c34',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
    white: '#abb2bf',
    brightBlack: '#5c6370',
    brightRed: '#e06c75',
    brightGreen: '#98c379',
    brightYellow: '#e5c07b',
    brightBlue: '#61afef',
    brightMagenta: '#c678dd',
    brightCyan: '#56b6c2',
    brightWhite: '#ffffff',
  },
  'solarized-dark': {
    ...DARK_THEME,
    background: '#002b36',
    foreground: '#839496',
    cursor: '#93a1a1',
    selectionBackground: '#073642',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3',
  },
  'solarized-light': {
    ...LIGHT_THEME,
    background: '#fdf6e3',
    foreground: '#657b83',
    cursor: '#586e75',
    selectionBackground: '#eee8d5',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3',
  },
  'nord': {
    ...DARK_THEME,
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#d8dee9',
    selectionBackground: '#434c5e',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
    brightBlack: '#4c566a',
    brightRed: '#bf616a',
    brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1',
    brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb',
    brightWhite: '#eceff4',
  },
  'github-light': {
    ...LIGHT_THEME,
    background: '#ffffff',
    foreground: '#24292f',
    cursor: '#0969da',
    selectionBackground: '#d0e8ff',
    black: '#24292f',
    red: '#cf222e',
    green: '#1a7f37',
    yellow: '#9a6700',
    blue: '#0969da',
    magenta: '#8250df',
    cyan: '#1b7c83',
    white: '#6e7781',
    brightBlack: '#57606a',
    brightRed: '#a40e26',
    brightGreen: '#116329',
    brightYellow: '#4d2d00',
    brightBlue: '#0550ae',
    brightMagenta: '#6639ba',
    brightCyan: '#116329', // GitHub uses green for cyan sometimes? sticking to palette
    brightWhite: '#8c959f',
  },
  'github-dark': {
    ...DARK_THEME,
    background: '#0d1117',
    foreground: '#c9d1d9',
    cursor: '#58a6ff',
    selectionBackground: '#1f6feb',
    black: '#484f58',
    red: '#ff7b72',
    green: '#3fb950',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#39c5cf',
    white: '#b1bac4',
    brightBlack: '#6e7681',
    brightRed: '#ffa198',
    brightGreen: '#56d364',
    brightYellow: '#e3b341',
    brightBlue: '#79c0ff',
    brightMagenta: '#d2a8ff',
    brightCyan: '#56d364',
    brightWhite: '#f0f6fc',
  }
};

function TerminalSessionComponent({ session, server, active, activeView, paneId, editorFile, paneCount, onUpdateSession, onClose, onSplit, onFocus, onUpdatePane, onClosePane }: Props) {
  const { t, settings, toggleAIModal, setAIContext } = useApp();
  // Helper to get sidebar state for resizing
  const [isSidebarOpen] = useState(true); // Assuming open for calculation

  // Refs for Xterm
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // State for local mock shell if WS fails
  const commandBufferRef = useRef('');

  // Context menu for AI actions
  const contextMenuActions = [
    {
      label: t('ai.ask') || 'Ask AI',
      icon: <MessageSquare size={14} />,
      action: (text: string) => {
        setAIContext({ text, action: 'ask' });
        toggleAIModal();
      },
      requiresSelection: true
    },
    {
      label: t('ai.explain') || 'Explain',
      icon: <Lightbulb size={14} />,
      action: (text: string) => {
        setAIContext({ text, action: 'explain' });
        toggleAIModal();
      },
      requiresSelection: true
    },
    {
      label: t('ai.fix') || 'Fix',
      icon: <Wrench size={14} />,
      action: (text: string) => {
        setAIContext({ text, action: 'fix' });
        toggleAIModal();
      },
      requiresSelection: true
    },
    {
      label: t('terminal.split_vertical') || 'Split Vertical',
      icon: <SplitSquareVertical size={14} />,
      action: () => onSplit('vertical')
    },
    {
      label: t('terminal.split_horizontal') || 'Split Horizontal',
      icon: <SplitSquareHorizontal size={14} />,
      action: () => onSplit('horizontal')
    },
    {
      label: t('terminal.close_pane'),
      icon: <X size={14} />,
      action: () => onClosePane?.()
    }
  ];

  const { menuPosition, executeAction, menuRef, selectedText } = useTerminalContextMenu(
    xtermRef.current,
    contextMenuActions
  );

  // Initialize Terminal
  useEffect(() => {
    if (xtermRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      theme: THEME_PALETTES[settings.theme] || DARK_THEME,
      allowProposedApi: true,
      scrollback: settings.history_limit || 10000,
    });

    // Command capturing buffer
    let commandBuffer = '';
    term.onData(data => {
      if (data === '\r') { // Enter key
        if (commandBuffer.trim()) {
          // Save command to DB
          let sid: number | null = null;
          if (typeof server.id === 'number') {
            sid = server.id;
          } else if (server.id !== 'local') {
            const parsed = parseInt(server.id.toString());
            if (!isNaN(parsed)) sid = parsed;
          }

          invoke('save_command_log', {
            serverId: sid,
            command: commandBuffer.trim()
          }).catch(e => console.error('Failed to save command:', e));
        }
        commandBuffer = '';
      } else if (data === '\u007F') { // Backspace
        if (commandBuffer.length > 0) {
          commandBuffer = commandBuffer.slice(0, -1);
        }
      } else if (data >= ' ') { // Printable characters
        commandBuffer += data;
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    if (terminalContainerRef.current) {
      term.open(terminalContainerRef.current);
      // Wait for renderer to be ready before fitting
      requestAnimationFrame(() => {
        safeFit();
      });
    }

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[1;32mNebula SSH Client v2.0\x1b[0m');
    term.writeln(`Connecting to \x1b[1m${server.host}\x1b[0m...`);

    let unlistenData: () => void;
    let unlistenClose: () => void;

    const setupSsh = async () => {
      try {
        const isLocal = server.protocol === 'local';
        const eventPrefix = isLocal ? 'local' : 'ssh';
        const connectCmd = isLocal ? 'connect_local' : 'connect_ssh';
        const disconnectCmd = isLocal ? 'disconnect_local' : 'disconnect_ssh';
        const resizeCmd = isLocal ? 'resize_local' : 'resize_ssh';

        // Listen for data from backend
        unlistenData = await listen<number[]>(`${eventPrefix}_data_${session.id}`, (event) => {
          const data = new Uint8Array(event.payload);
          term.write(data);
        });

        unlistenClose = await listen(`${eventPrefix}_close_${session.id}`, () => {
          term.writeln('\r\n\x1b[33mConnection closed.\x1b[0m');
          onUpdateSession(session.id, { status: ConnectionStatus.DISCONNECTED });
        });

        // Connect
        if (isLocal) {
          await invoke(connectCmd, {
            id: session.id,
            cols: 80,
            rows: 24
          });
        } else {
          await invoke(connectCmd, {
            id: session.id,
            host: server.host,
            port: server.port || 22,
            username: server.username,
            password: server.password,
            privateKey: null
          });
        }

        term.writeln('\x1b[32m✓ Connection established.\x1b[0m\r\n');
        onUpdateSession(session.id, { status: ConnectionStatus.CONNECTED });

        // Get remote home directory for SSH connections
        if (!isLocal) {
          try {
            const remoteHome = await invoke<string>('get_remote_home_directory', { id: session.id });
            onUpdateSession(session.id, { currentDirectory: remoteHome });
          } catch (e) {
            console.error('Failed to get remote home directory:', e);
            // Fallback to /
            onUpdateSession(session.id, { currentDirectory: '/' });
          }
        }

        // Initial resize
        if (fitAddonRef.current) {
          const dims = fitAddonRef.current.proposeDimensions();
          if (dims) {
            invoke(resizeCmd, { id: session.id, cols: dims.cols, rows: dims.rows });
          }
        }

      } catch (e) {
        console.error(e);
        term.writeln(`\r\n\x1b[31mConnection failed: ${e}\x1b[0m`);
        onUpdateSession(session.id, { status: ConnectionStatus.FAILED });
      }
    };

    setupSsh();

    // Handle Input
    term.onData(data => {
      const isLocal = server.protocol === 'local';
      const writeCmd = isLocal ? 'write_local' : 'write_ssh';
      invoke(writeCmd, { id: session.id, data });
    });

    // Handle Resize
    const handleResize = () => {
      // Only resize if terminal is active (visible)
      if (!active || activeView !== 'terminal') return;
      safeFit();
    };
    window.addEventListener('resize', handleResize);

    // Initial fit after a small delay to ensure layout is settled
    // Only fit if active
    if (active) {
      setTimeout(() => handleResize(), 100);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (unlistenData) unlistenData();
      if (unlistenClose) unlistenClose();

      term.dispose();
      xtermRef.current = null;
    };
  }, []); // Run once on mount

  // Handle active state changes (focus and resize)
  useEffect(() => {
    if (active && activeView === 'terminal' && xtermRef.current && fitAddonRef.current) {
      requestAnimationFrame(() => {
        safeFit();
        xtermRef.current?.focus();
      });
    }
  }, [active, activeView]);

  // Disconnect SSH only on component unmount (session close)
  useEffect(() => {
    return () => {
      const isLocal = server.protocol === 'local';
      const disconnectCmd = isLocal ? 'disconnect_local' : 'disconnect_ssh';
      invoke(disconnectCmd, { id: session.id });
    };
  }, []); // Empty deps - only run on mount/unmount

  // Update theme dynamically
  useEffect(() => {
    if (xtermRef.current) {
      const palette = THEME_PALETTES[settings.theme] || DARK_THEME;
      xtermRef.current.options.theme = palette;
    }
  }, [settings.theme]);

  // Update layout when sidebars open/close
  useEffect(() => {
    if (activeView === 'terminal') {
      setTimeout(() => {
        safeFit();
      }, 300); // Wait for transition
    }
  }, [activeView, isSidebarOpen]);

  const safeFit = () => {
    if (!fitAddonRef.current || !xtermRef.current) return;

    // Check if visible
    if (terminalContainerRef.current?.offsetParent === null) return;

    // Check if renderer is ready
    const term = xtermRef.current as any;
    if (!term._core || !term._core._renderService || !term._core._renderService.dimensions) {
      // Renderer not ready yet, skip resize
      return;
    }

    try {
      fitAddonRef.current.fit();
      const dims = fitAddonRef.current.proposeDimensions();

      // Ensure dimensions are valid and positive
      if (dims && dims.cols > 0 && dims.rows > 0) {
        const isLocal = server.protocol === 'local';
        const resizeCmd = isLocal ? 'resize_local' : 'resize_ssh';
        invoke(resizeCmd, { id: session.id, cols: dims.cols, rows: dims.rows })
          .catch(e => console.warn('Resize failed:', e));
      }
    } catch (e) {
      console.warn('Terminal safeFit failed:', e);
    }
  };

  // Mock Shell Logic for Fallback
  const startMockShell = (term: Terminal) => {
    const prompt = () => {
      term.write('\r\n\x1b[1;34m~ \x1b[1;32m➜ \x1b[0m');
    };
    prompt();

    (term as any)._prompt = prompt; // Attach prompt to instance for reuse
  };

  const handleMockInput = (data: string, term: Terminal) => {
    const ord = data.charCodeAt(0);

    // Enter
    if (ord === 13) {
      term.write('\r\n');
      const cmd = commandBufferRef.current.trim();
      commandBufferRef.current = '';

      if (cmd) {
        const output = mockExecute(cmd);
        if (output) term.writeln(output);
      }

      if ((term as any)._prompt) (term as any)._prompt();
      return;
    }

    // Backspace
    if (ord === 127) {
      if (commandBufferRef.current.length > 0) {
        commandBufferRef.current = commandBufferRef.current.slice(0, -1);
        term.write('\b \b');
      }
      return;
    }

    // Ctrl+C
    if (ord === 3) {
      commandBufferRef.current = '';
      term.write('^C\r\n');
      if ((term as any)._prompt) (term as any)._prompt();
      return;
    }

    // Regular input
    if (ord >= 32 && ord <= 126) {
      commandBufferRef.current += data;
      term.write(data);
    }
  };

  const mockExecute = (cmd: string): string => {
    const [c, ...args] = cmd.split(' ');
    switch (c) {
      case 'ls': return 'Documents  Downloads  Projects  todo.txt';
      case 'pwd': return '/home/user';
      case 'whoami': return 'root';
      case 'date': return new Date().toString();
      case 'help': return 'Available mock commands: ls, pwd, whoami, date, echo, clear, exit';
      case 'clear':
        xtermRef.current?.clear();
        return '';
      case 'echo': return args.join(' ');
      case 'exit':
        onClose();
        return 'Bye!';
      default: return `bash: ${c}: command not found`;
    }
  };

  const handleSnippetRun = (cmd: string) => {
    if (!xtermRef.current) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(cmd + '\r');
    } else {
      // Simulate typing for mock
      xtermRef.current.write(cmd);
      commandBufferRef.current += cmd;
    }
    xtermRef.current.focus();
  };

  // Calculate active index for the segmented control slider
  const tabs = [
    { id: 'terminal', icon: TerminalIcon, label: t('tabs.terminal') },
    { id: 'sftp', icon: FolderOpen, label: t('tabs.sftp') },
    { id: 'dashboard', icon: Activity, label: t('tabs.monitor') }
  ];
  const activeTabIndex = tabs.findIndex(tab => tab.id === activeView);

  return (
    <div
      className={simpleCn(
        "flex-1 flex flex-col h-full overflow-hidden transition-all relative",
        active ? "ring-2 ring-nebula-500/50 z-10" : "border-r border-b border-slate-200 dark:border-dark-border",
        server.protocol === 'local' ? "bg-slate-50 dark:bg-dark-bg" : "bg-slate-950"
      )}
      style={{ display: 'flex' }}
      onClick={() => onFocus?.()}
    >
      {/* Close Button - Show only when there are multiple panes */}
      {paneCount && paneCount > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClosePane?.();
          }}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-md bg-slate-100 dark:bg-dark-surface hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
          title={t('terminal.close_pane')}
        >
          <X size={14} className="group-hover:scale-110 transition-transform" />
        </button>
      )}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-slate-50 dark:bg-dark-bg">
        {/* Top Bar */}
        <div className="h-10 bg-slate-100/50 dark:bg-dark-surface/30 border-b border-slate-200 dark:border-dark-border flex items-center justify-center px-4 flex-shrink-0 backdrop-blur-sm">
          <div className="flex items-center gap-1 px-1 py-1 bg-white dark:bg-dark-surface rounded-lg border border-slate-200 dark:border-dark-border shadow-sm">
            <button
              onClick={() => onUpdatePane?.(paneId, { activeView: 'terminal' })}
              className={simpleCn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5",
                activeView === 'terminal'
                  ? "bg-nebula-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-bg"
              )}
            >
              <TerminalIcon size={12} />
              {t('tabs.terminal')}
            </button>
            <button
              onClick={() => onUpdatePane?.(paneId, { activeView: 'sftp' })}
              className={simpleCn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5",
                activeView === 'sftp'
                  ? "bg-nebula-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-bg"
              )}
            >
              <FolderOpen size={12} />
              {t('tabs.sftp')}
            </button>
            <button
              onClick={() => onUpdatePane?.(paneId, { activeView: 'monitor' })}
              className={simpleCn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5",
                activeView === 'monitor'
                  ? "bg-nebula-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-bg"
              )}
            >
              <Activity size={12} />
              {t('tabs.monitor')}
            </button>
          </div>
        </div>

        {/* View Content */}
        <div className="flex-1 min-h-0 relative">
          <div
            className="absolute inset-0 flex flex-col"
            style={{ display: activeView === 'terminal' ? 'flex' : 'none' }}
          >
            <div
              ref={terminalContainerRef}
              className="absolute inset-0 pl-2 pt-2"
            />
          </div>

          {activeView === 'sftp' && (
            <SFTPBrowser
              sessionId={session.id}
              initialPath={session.currentDirectory}
              onNavigate={(path) => onUpdateSession(session.id, { currentDirectory: path })}
              isLocal={server.protocol === 'local'}
              onEdit={(filePath) => {
                if (onUpdatePane) {
                  onUpdatePane(paneId, { activeView: 'editor', editorFile: filePath });
                }
              }}
            />
          )}

          {activeView === 'monitor' && (
            <SystemDashboard sessionId={session.id} isLocal={server.protocol === 'local'} />
          )}

          {activeView === 'editor' && onUpdatePane && editorFile && (
            <FileEditor
              sessionId={session.id}
              filePath={editorFile}
              onClose={() => onUpdatePane(paneId, { activeView: 'terminal' })}
            />
          )}
        </div>

        {/* Terminal Context Menu */}
        {menuPosition && (
          <TerminalContextMenu
            position={menuPosition}
            actions={contextMenuActions}
            onActionClick={executeAction}
            menuRef={menuRef}
            hasSelection={!!selectedText}
          />
        )}
      </div>
    </div >
  );
};

export const TerminalSession = React.memo(TerminalSessionComponent);
