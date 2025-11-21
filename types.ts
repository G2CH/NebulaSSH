export interface Server {
  id: string;
  name: string;
  protocol: 'ssh' | 'local';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  privateKeyPath?: string;
  localForwards?: PortForward[];
  remoteForwards?: PortForward[];
  jumpHostId?: string | null;
  group?: string;
  tags?: string[];
  color?: string;
  created_at?: number;
  updated_at?: number;
}

export interface PortForward {
  localPort: number;
  remoteHost: string;
  remotePort: number;
}

export interface Session {
  id: string;
  serverId: string;
  status: ConnectionStatus;
  currentDirectory?: string;
  history: string[];
  commandHistory: string[];
  historyPointer: number;
}

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
}

export interface Tab {
  id: string;
  title: string;
  activePaneId: string;
  layout: SplitNode;
}

export interface Pane {
  id: string;
  sessionId: string;
  activeView: 'terminal' | 'sftp' | 'monitor' | 'editor';
  editorFile?: string;
}

export interface SplitNode {
  id?: string;
  type: 'split' | 'leaf';
  direction?: 'horizontal' | 'vertical';
  children?: SplitNode[];
  paneId?: string;
  sizes?: number[];
}

export interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number;
  modifiedTime: string;
  permissions: string;
  owner: string;
  group: string;
}

export interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  children?: Record<string, FileSystemNode>;
  content?: string;
  size?: string;
  lastModified?: string;
}

export interface Snippet {
  id: number | null;
  name: string;
  command: string;
  category: string;
  description?: string;
  created_at?: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface LocalSystemStats {
  os: string;
  hostname: string;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  diskUsage: number;
  diskTotal: number;
  networkRx: number;
  networkTx: number;
}

export interface TerminalDimensions {
  cols?: number;
  rows?: number;
}

export interface AppSettings {
  history_limit: number;
  theme: string;
  app_theme: 'light' | 'dark' | 'system';
  ai_provider: string;
  ai_api_key?: string;
  ai_model?: string;
  ai_base_url?: string;
  auto_reconnect: boolean;
  lock_timeout: number; // Minutes, 0 to disable
}

// Session Persistence Types
export interface AppSessionState {
  tabs: TabState[];
  active_tab_id: string | null;
  last_saved: number;
  version: string;
}

export interface TabState {
  id: string;
  name: string;
  layout: SplitNode;
  panes: PaneState[];
  active_pane_id: string | null;
}

export interface PaneState {
  id: string;
  session_id: string;
  server_id: string;
  current_directory: string | null;
  active_view: 'terminal' | 'sftp' | 'monitor' | 'editor';
  editor_file: string | null;
}
