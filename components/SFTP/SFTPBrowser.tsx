
import React, { useState, useEffect } from 'react';
import { vfs } from '../../services/mockFileSystem';
import { FileSystemNode } from '../../types';
import { simpleCn } from '../../utils';
import { useApp } from '../../contexts/AppContext';
import {
  Folder,
  FileText,
  File as FileIcon,
  ArrowUp,
  Download,
  Upload,
  RefreshCw,
  Search,
  ChevronRight,
  Home
} from 'lucide-react';

import { invoke } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';

interface Props {
  sessionId: string;
  initialPath: string;
  onNavigate: (path: string) => void;
  isLocal?: boolean;
}

export const SFTPBrowser: React.FC<Props> = ({ sessionId, initialPath, onNavigate, isLocal = false }) => {
  const { t } = useApp();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<FileSystemNode[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const loadPath = async (path: string) => {
    setIsLoading(true);
    try {
      let contents: FileSystemNode[];

      if (isLocal) {
        // Local file browsing
        contents = await invoke<FileSystemNode[]>('list_local_directory', { path });
      } else {
        // SSH/SFTP browsing
        await invoke('init_sftp', { id: sessionId });
        contents = await invoke<FileSystemNode[]>('list_directory', {
          id: sessionId,
          path
        });
      }

      // Sort: Directories first, then files
      const sorted = contents.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
      setFiles(sorted);
      setCurrentPath(path);
      onNavigate(path);
    } catch (e) {
      console.error("File Browser Error:", e);
      alert(`Error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPath(initialPath);
  }, []);

  const handleNavigate = (path: string) => {
    setSelectedItems(new Set());
    loadPath(path);
  };

  const handleItemClick = (name: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      const newSet = new Set(selectedItems);
      if (newSet.has(name)) newSet.delete(name);
      else newSet.add(name);
      setSelectedItems(newSet);
    } else {
      setSelectedItems(new Set([name]));
    }
  };

  const handleDoubleClick = async (node: FileSystemNode) => {
    if (node.type === 'directory') {
      const newPath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`;
      handleNavigate(newPath);
    } else {
      // Download
      try {
        const savePath = await save({
          defaultPath: node.name,
        });
        if (savePath) {
          const remotePath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`;
          await invoke('download_file', {
            id: sessionId,
            remotePath,
            localPath: savePath
          });
          alert(t('sftp.downloading') + ' complete!');
        }
      } catch (e) {
        console.error(e);
        alert('Download failed: ' + e);
      }
    }
  };

  const handleUpload = async () => {
    try {
      const localPath = await open({
        multiple: false,
        directory: false,
      });

      if (localPath) {
        // Extract filename from path (simple approximation)
        // In a real app, we'd use a path library or invoke a command to get basename
        // For now, let's assume standard path separators
        const filename = (localPath as string).split(/[/\\]/).pop();
        if (!filename) return;

        const remotePath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;

        await invoke('upload_file', {
          id: sessionId,
          localPath,
          remotePath
        });

        loadPath(currentPath); // Refresh
        alert('Upload complete!');
      }
    } catch (e) {
      console.error(e);
      alert('Upload failed: ' + e);
    }
  };

  const goUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const newPath = '/' + parts.join('/');
    handleNavigate(newPath);
  };

  // Breadcrumb generation
  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-200 font-sans transition-colors">
      {/* Toolbar */}
      <div className="h-12 border-b border-slate-200 dark:border-dark-border flex items-center px-4 gap-3 bg-white dark:bg-dark-surface/30">
        <div className="flex items-center gap-2 mr-2">
          <button
            onClick={goUp}
            disabled={currentPath === '/'}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-surface rounded-md disabled:opacity-30 transition-colors text-slate-500 dark:text-slate-400"
            title={t('sftp.up_level')}
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={() => loadPath(currentPath)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-surface rounded-md transition-colors text-slate-500 hover:text-nebula-600 dark:text-slate-400 dark:hover:text-nebula-400"
            title={t('sftp.refresh')}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Breadcrumb Path */}
        <div className="flex-1 flex items-center bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-md px-3 py-1.5 text-sm overflow-hidden shadow-sm dark:shadow-none">
          <button
            onClick={() => handleNavigate('/')}
            className="hover:text-nebula-600 dark:hover:text-nebula-400 transition-colors mr-1 text-slate-500 dark:text-slate-400"
            title={t('sftp.path_root')}
          >
            <Home size={14} />
          </button>
          <span className="text-slate-400 dark:text-slate-600 mx-1">/</span>
          {breadcrumbs.map((part, idx) => {
            const path = '/' + breadcrumbs.slice(0, idx + 1).join('/');
            return (
              <React.Fragment key={path}>
                <button
                  onClick={() => handleNavigate(path)}
                  className="hover:text-nebula-600 dark:hover:text-nebula-400 hover:underline transition-colors truncate max-w-[150px] font-medium text-slate-700 dark:text-slate-300"
                >
                  {part}
                </button>
                {idx < breadcrumbs.length - 1 && (
                  <span className="text-slate-400 dark:text-slate-600 mx-1">/</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-2 border-l border-slate-200 dark:border-dark-border pl-4">
          <button
            onClick={handleUpload}
            className="flex items-center gap-2 px-3 py-1.5 bg-nebula-600 hover:bg-nebula-500 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
          >
            <Upload size={14} />
            <span className="hidden lg:inline">{t('sftp.upload')}</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-dark-border border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 text-xs font-medium rounded-md transition-colors shadow-sm dark:shadow-none">
            <Download size={14} />
            <span className="hidden lg:inline">{t('sftp.download')}</span>
          </button>
        </div>
      </div>

      {/* File List Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-slate-200 dark:border-dark-border text-xs font-semibold text-slate-500 uppercase tracking-wider select-none bg-slate-50 dark:bg-transparent">
        <div className="col-span-6 pl-2">{t('sftp.col_name')}</div>
        <div className="col-span-2 text-right">{t('sftp.col_size')}</div>
        <div className="col-span-3">{t('sftp.col_modified')}</div>
        <div className="col-span-1">{t('sftp.col_type')}</div>
      </div>

      {/* File List Content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0c0c0e]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <RefreshCw size={24} className="animate-spin opacity-50" />
            <span className="text-xs">{t('common.loading')}</span>
          </div>
        ) : (
          <div className="flex flex-col pb-4">
            {/* .. Entry */}
            {currentPath !== '/' && (
              <div
                onDoubleClick={goUp}
                className="grid grid-cols-12 gap-4 px-4 py-2 hover:bg-slate-50 dark:hover:bg-dark-surface/50 cursor-pointer items-center text-sm group transition-colors"
              >
                <div className="col-span-6 flex items-center gap-3">
                  <Folder size={18} className="text-blue-500 fill-blue-500/10" />
                  <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">..</span>
                </div>
              </div>
            )}

            {files.length === 0 && (
              <div className="py-8 text-center text-slate-500 dark:text-slate-600 text-xs italic">{t('sftp.empty')}</div>
            )}

            {files.map((file) => {
              const isSelected = selectedItems.has(file.name);
              const icon = file.type === 'directory'
                ? <Folder size={18} className="text-blue-500 fill-blue-500/10" />
                : <FileText size={18} className="text-slate-400" />;

              return (
                <div
                  key={file.name}
                  onClick={(e) => handleItemClick(file.name, e)}
                  onDoubleClick={() => handleDoubleClick(file)}
                  className={simpleCn(
                    "grid grid-cols-12 gap-4 px-4 py-2 cursor-pointer items-center text-sm border-b border-transparent transition-colors",
                    isSelected
                      ? "bg-nebula-50 dark:bg-nebula-500/10 border-nebula-100 dark:border-transparent"
                      : "hover:bg-slate-50 dark:hover:bg-dark-surface/40"
                  )}
                >
                  <div className="col-span-6 flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">{icon}</div>
                    <span className={simpleCn(
                      "truncate transition-colors font-medium",
                      isSelected ? "text-nebula-700 dark:text-nebula-300" : "text-slate-700 dark:text-slate-300"
                    )}>
                      {file.name}
                    </span>
                  </div>
                  <div className="col-span-2 text-right text-slate-500 font-mono text-xs">
                    {file.size}
                  </div>
                  <div className="col-span-3 text-slate-500 text-xs truncate">
                    {file.lastModified}
                  </div>
                  <div className="col-span-1 text-slate-400 dark:text-slate-600 text-xs capitalize truncate">
                    {file.type === 'directory' ? t('sftp.type_folder') : t('sftp.type_file')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="h-7 bg-slate-50 dark:bg-[#09090b] border-t border-slate-200 dark:border-dark-border flex items-center px-3 justify-between text-[10px] text-slate-500">
        <div className="flex gap-4">
          <span>{files.length} {t('sftp.items')}</span>
          <span>{selectedItems.size} {t('sftp.selected')}</span>
        </div>
        <div className="flex gap-2">
          <span>{t('sftp.protocol')}: SFTP-3</span>
          <span>{t('sftp.mode')}: Passive</span>
        </div>
      </div>
    </div>
  );
};
