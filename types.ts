
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  FAILED = 'FAILED',
}

export interface PortForwardingRule {
  id: string;
  rule_type: 'Local' | 'Remote' | 'Dynamic';
  source_port: number;
  destination_host?: string;
  destination_port?: number;
}

export interface Server {
  id: string | number;
  name: string;
  group?: string;
  host: string;
  port?: number;
  protocol: 'ssh' | 'local';
  username: string;
  password?: string;
  privateKeyPath?: string;
  tags: string[];
  color?: string;
  lastConnected?: number;
  created_at?: number;
  updated_at?: number;
  forwarding_rules?: PortForwardingRule[];
  jump_host_id?: number;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'system' | 'error';
  content: string;
  timestamp: number;
  directory?: string;
}

export interface Session {
  id: string;
  serverId: string | number;
  status: ConnectionStatus;
  history: TerminalLine[];
  currentDirectory: string;
  commandHistory: string[];
  historyPointer: number;
}

export interface Pane {
  id: string;
  sessionId: string;
  flex?: number;
  activeView: 'terminal' | 'sftp' | 'monitor' | 'editor';
  editorFile?: string;
}

export type SplitDirection = 'horizontal' | 'vertical';

export interface SplitNode {
  id: string;
  type: 'leaf' | 'split';
  direction?: SplitDirection;
  children?: SplitNode[];
  paneId?: string;
  flex?: number;
  sizes?: number[];
}

export interface Tab {
  id: string;
  title: string;
  layout: SplitNode;
  activePaneId: string;
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
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface SSHMessage {
  type: 'connect' | 'data' | 'resize' | 'error';
  data?: string;
  cols?: number;
  rows?: number;
}

export interface AppSettings {
  history_limit: number;
  theme: string;
  app_theme: string;
  ai_provider: string;
  ai_api_key?: string;
  ai_model?: string;
  ai_base_url?: string;
}
