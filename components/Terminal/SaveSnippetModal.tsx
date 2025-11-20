import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ComboBox } from '../ui/ComboBox';
import { useApp } from '../../contexts/AppContext';
import { invoke } from '@tauri-apps/api/core';

import { Snippet } from '../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    command: string;
    existingCategories: string[];
    onSuccess?: () => void;
    initialData?: Snippet | null;
}

export const SaveSnippetModal: React.FC<Props> = ({ isOpen, onClose, command, existingCategories, onSuccess, initialData }) => {
    const { t } = useApp();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setCategory(initialData.category);
                setDescription(initialData.description || '');
            } else {
                setName('');
                setCategory('');
                setDescription('');
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category.trim()) return;

        setSaving(true);
        try {
            if (initialData && initialData.id) {
                await invoke('update_snippet', {
                    id: initialData.id,
                    name: name.trim(),
                    command: command || initialData.command, // Use new command if provided, else keep existing
                    category: category.trim(),
                    description: description.trim() || null,
                });
            } else {
                await invoke('create_snippet', {
                    name: name.trim(),
                    command,
                    category: category.trim(),
                    description: description.trim() || null,
                });
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Failed to save snippet:', error);
            alert(`Failed to save snippet: ${error}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? t('snippets.edit_snippet') : t('history.save_snippet_title')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label={t('snippets.name')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                />

                <ComboBox
                    label={t('snippets.category')}
                    value={category}
                    onChange={setCategory}
                    options={existingCategories}
                />

                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">
                        {t('snippets.description')}
                    </label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-nebula-500/20 resize-none"
                        rows={3}
                        placeholder={t('snippets.description')}
                    />
                </div>

                <div className="bg-slate-50 dark:bg-dark-surface p-3 rounded-lg border border-slate-200 dark:border-dark-border">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Command:</div>
                    <div className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all">{command || initialData?.command}</div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={saving || !name.trim() || !category.trim()}>
                        {saving ? t('common.loading') : t('common.save')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
