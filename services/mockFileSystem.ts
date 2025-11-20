import { FileSystemNode } from '../types';

const mockFS: Record<string, FileSystemNode> = {
  'home': {
    type: 'directory',
    name: 'home',
    lastModified: '2023-10-01 10:00',
    size: '4 KB',
    children: {
      'user': {
        type: 'directory',
        name: 'user',
        lastModified: '2023-10-05 14:20',
        size: '4 KB',
        children: {
          'projects': {
            type: 'directory',
            name: 'projects',
            lastModified: '2023-11-12 09:15',
            size: '4 KB',
            children: {
              'nebula-ssh': { type: 'directory', name: 'nebula-ssh', lastModified: 'Today 10:00', size: '4 KB', children: {} },
              'website': { type: 'directory', name: 'website', lastModified: 'Yesterday 16:40', size: '4 KB', children: {} },
            }
          },
          'documents': {
            type: 'directory',
            name: 'documents',
            lastModified: '2023-09-20 11:00',
            size: '4 KB',
            children: {
              'todo.txt': { type: 'file', name: 'todo.txt', content: '...', size: '1.2 KB', lastModified: 'Today 08:30' },
              'notes.md': { type: 'file', name: 'notes.md', content: '...', size: '3.5 KB', lastModified: 'Yesterday 14:00' },
              'budget.xlsx': { type: 'file', name: 'budget.xlsx', content: '', size: '24 KB', lastModified: '2023-10-20' }
            }
          },
          '.config': {
            type: 'directory',
            name: '.config',
            lastModified: '2023-01-01 00:00',
            size: '4 KB',
            children: {
              'settings.json': { type: 'file', name: 'settings.json', content: '{ "theme": "dark" }', size: '240 B', lastModified: '2023-05-15' }
            }
          },
          'downloads': {
            type: 'directory',
            name: 'downloads',
            lastModified: 'Today 11:20',
            size: '4 KB',
            children: {
              'installer.sh': { type: 'file', name: 'installer.sh', size: '8.4 MB', lastModified: 'Today 11:15' },
              'archive.tar.gz': { type: 'file', name: 'archive.tar.gz', size: '124 MB', lastModified: 'Today 11:10' }
            }
          }
        }
      }
    }
  },
  'var': {
    type: 'directory',
    name: 'var',
    lastModified: '2023-01-01',
    size: '4 KB',
    children: {
      'log': { type: 'directory', name: 'log', lastModified: 'Today 12:00', size: '4 KB', children: {
        'syslog': { type: 'file', name: 'syslog', size: '42 MB', lastModified: 'Today 12:01' },
        'auth.log': { type: 'file', name: 'auth.log', size: '1.2 MB', lastModified: 'Today 11:58' }
      }}
    }
  },
  'etc': {
    type: 'directory',
    name: 'etc',
    lastModified: '2022-12-12',
    size: '4 KB',
    children: {
      'hosts': { type: 'file', name: 'hosts', content: '127.0.0.1 localhost', size: '2 KB', lastModified: '2023-01-10' },
      'nginx': { type: 'directory', name: 'nginx', size: '4 KB', lastModified: '2023-03-04', children: {} }
    }
  }
};

export class VirtualFileSystem {
  private root: Record<string, FileSystemNode> = mockFS;

  resolvePath(currentPath: string, targetPath: string): string {
    if (targetPath.startsWith('/')) return this.normalizePath(targetPath);
    if (targetPath === '~') return '/home/user';
    return this.normalizePath(`${currentPath}/${targetPath}`);
  }

  normalizePath(path: string): string {
    const parts = path.split('/').filter(p => p.length > 0);
    const stack: string[] = [];
    
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        stack.pop();
      } else {
        stack.push(part);
      }
    }
    
    return '/' + stack.join('/');
  }

  getNode(path: string): FileSystemNode | null {
    if (path === '/') return { type: 'directory', name: 'root', children: this.root };
    
    const parts = path.split('/').filter(Boolean);
    let current: FileSystemNode | undefined = { type: 'directory', name: 'root', children: this.root };

    for (const part of parts) {
      if (current?.children && current.children[part]) {
        current = current.children[part];
      } else {
        return null;
      }
    }
    return current || null;
  }

  ls(path: string): string[] {
    const node = this.getNode(path);
    if (!node) throw new Error(`ls: cannot access '${path}': No such file or directory`);
    if (node.type === 'file') return [node.name];
    return node.children ? Object.keys(node.children) : [];
  }

  // New method for SFTP
  getDirContents(path: string): FileSystemNode[] {
    const node = this.getNode(path);
    if (!node || node.type !== 'directory' || !node.children) return [];
    
    return Object.values(node.children).map(child => ({
      ...child,
      // Ensure these have fallbacks if not in mock data
      size: child.size || (child.type === 'directory' ? '4 KB' : '0 B'),
      lastModified: child.lastModified || '-'
    }));
  }
}

export const vfs = new VirtualFileSystem();