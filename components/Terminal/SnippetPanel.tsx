import React, { useState, useEffect } from 'react';
import { Snippet } from '../../types';
import { simpleCn } from '../../utils';
import { Play, ChevronRight, ChevronDown, Command, Plus, Search, Trash2, Pencil } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { invoke } from '@tauri-apps/api/core';
import { SaveSnippetModal } from './SaveSnippetModal';

interface Props {
  onRunSnippet: (command: string) => void;
  isOpen: boolean;
}

export const SnippetPanel: React.FC<Props> = ({ onRunSnippet, isOpen }) => {
  const { t } = useApp();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Docker', 'System']));
  const [searchTerm, setSearchTerm] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSnippets();
    }
  }, [isOpen]);

  const loadSnippets = async () => {
    try {
      const data = await invoke<Snippet[]>('get_all_snippets');
      setSnippets(data);

      // Auto-expand categories that have snippets
      const categories = new Set(data.map(s => s.category));
      setExpandedCategories(categories);
    } catch (error) {
      console.error('Failed to load snippets:', error);
    }
  };

  const handleDeleteSnippet = async (id: number | null, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;

    if (confirm(t('snippets.delete_confirm'))) {
      try {
        await invoke('delete_snippet', { id });
        await loadSnippets();
      } catch (error) {
        console.error('Failed to delete snippet:', error);
      }
    }
  };

  if (!isOpen) return null;

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCategories(next);
  };

  // Group snippets by category
  const groupedSnippets = snippets.reduce((acc, snippet) => {
    const cat = snippet.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(snippet);
    return acc;
  }, {} as Record<string, Snippet[]>);

  const categories = Object.keys(groupedSnippets).sort();
  const existingCategories = Array.from(new Set(snippets.map(s => s.category)));

  // Helper to translate category names
  const getCategoryName = (cat: string) => {
    switch (cat) {
      case 'Docker': return t('snippets.cat_docker');
      case 'System': return t('snippets.cat_system');
      case 'Git': return t('snippets.cat_git');
      default: return cat;
    }
  };

  return (
    <div className="w-64 bg-slate-50 dark:bg-[#0c0c0e] border-l border-slate-200 dark:border-dark-border flex flex-col h-full transition-all duration-300">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface/30">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Command size={14} className="text-nebula-600 dark:text-nebula-500" />
          {t('snippets.title')}
        </span>
        <button
          onClick={() => setSaveModalOpen(true)}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          title={t('snippets.add_snippet')}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-slate-200 dark:border-dark-border">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={t('snippets.search_ph')}
            className="w-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-md py-1.5 pl-7 pr-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-nebula-500/50 focus:ring-1 focus:ring-nebula-500/20 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {categories.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-xs">{t('sidebar.empty')}</div>
        )}

        {categories.map(category => {
          const filteredSnippets = groupedSnippets[category].filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.command.includes(searchTerm.toLowerCase())
          );

          if (searchTerm && filteredSnippets.length === 0) return null;

          return (
            <div key={category}>
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-surface/50 transition-colors"
              >
                {expandedCategories.has(category) ? <ChevronDown size={12} className="mr-1.5" /> : <ChevronRight size={12} className="mr-1.5" />}
                {getCategoryName(category)}
                <span className="ml-auto text-[10px] text-slate-400">({filteredSnippets.length})</span>
              </button>

              {expandedCategories.has(category) && (
                <div className="space-y-0.5 px-2 pb-2">
                  {filteredSnippets.map(snippet => (
                    <div
                      key={snippet.id}
                      className="group flex items-center justify-between p-2 rounded hover:bg-slate-200 dark:hover:bg-dark-surface cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-dark-border transition-all"
                      onClick={() => onRunSnippet(snippet.command)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate group-hover:text-slate-900 dark:group-hover:text-white">{snippet.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-600 font-mono truncate mt-0.5">{snippet.command}</div>
                        {snippet.description && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-500 italic truncate mt-0.5">{snippet.description}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRunSnippet(snippet.command);
                          }}
                          className="p-1 hover:bg-nebula-100 dark:hover:bg-nebula-900/20 rounded text-nebula-600 dark:text-nebula-400"
                          title={t('history.execute')}
                        >
                          <Play size={10} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSnippet(snippet);
                            setSaveModalOpen(true);
                          }}
                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400"
                          title={t('snippets.edit_snippet')}
                        >
                          <Pencil size={10} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSnippet(snippet.id, e)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
                          title={t('common.close')}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SaveSnippetModal
        isOpen={saveModalOpen}
        onClose={() => {
          setSaveModalOpen(false);
          setEditingSnippet(null);
        }}
        command={editingSnippet ? editingSnippet.command : ""}
        existingCategories={existingCategories}
        onSuccess={loadSnippets}
        initialData={editingSnippet}
      />
    </div>
  );
};