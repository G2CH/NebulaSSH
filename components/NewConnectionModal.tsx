
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Modal } from './Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { ComboBox } from './ui/ComboBox';
import { Server } from '../types';
import { generateId, simpleCn } from '../utils';
import { useApp } from '../contexts/AppContext';
import { Check, Eye, EyeOff, Network } from 'lucide-react';
import { PortForwardingPanel } from './PortForwardingPanel';
import { PortForwardingRule } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (server: Server) => void;
  existingGroups?: string[];
  editingServer?: Server | null;
  servers?: Server[];
}

export const NewConnectionModal: React.FC<Props> = ({ isOpen, onClose, onSave, existingGroups = [], editingServer, servers = [] }) => {
  const { t } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    group: '',
    host: '',
    port: '22',
    username: 'root',
    password: '',
    tags: '',
    color: 'nebula',
    forwarding_rules: [] as PortForwardingRule[],
    jump_host_id: undefined as number | undefined
  });
  const [activeTab, setActiveTab] = useState<'general' | 'tunnels'>('general');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Initialize form data when editing
  useEffect(() => {
    if (isOpen && editingServer) {
      setFormData({
        name: editingServer.name,
        group: editingServer.group || '',
        host: editingServer.host,
        port: editingServer.port?.toString() || '22',
        username: editingServer.username,
        password: editingServer.password || '',
        tags: editingServer.tags?.join(', ') || '',
        color: editingServer.color || 'nebula',
        forwarding_rules: editingServer.forwarding_rules || [],
        jump_host_id: editingServer.jump_host_id
      });
    } else if (isOpen && !editingServer) {
      // Reset form for new connection
      setFormData({ name: '', group: '', host: '', port: '22', username: 'root', password: '', tags: '', color: 'nebula', forwarding_rules: [], jump_host_id: undefined });
      setActiveTab('general');
    }
  }, [isOpen, editingServer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: editingServer?.id || generateId(),
      name: formData.name || formData.host,
      group: formData.group || t('common.general'),
      host: formData.host,
      port: parseInt(formData.port || '22'),
      username: formData.username,
      password: formData.password,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      color: formData.color,
      lastConnected: editingServer?.lastConnected || 0,
      protocol: editingServer?.protocol || 'ssh',
      forwarding_rules: formData.forwarding_rules,
      jump_host_id: formData.jump_host_id
    });
    onClose();
    setFormData({ name: '', group: '', host: '', port: '22', username: 'root', password: '', tags: '', color: 'nebula', forwarding_rules: [], jump_host_id: undefined });
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!formData.host || !formData.username) {
      setTestResult({ success: false, message: 'Host and username are required' });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const message = await invoke<string>('test_ssh_connection', {
        host: formData.host,
        port: parseInt(formData.port || '22'),
        username: formData.username,
        password: formData.password || null,
      });
      setTestResult({ success: true, message });
    } catch (error) {
      setTestResult({ success: false, message: String(error) });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingServer ? t('modal.edit_connection_title') : t('modal.new_connection_title')}>
      <div className="flex gap-4 mb-4 border-b border-slate-200 dark:border-dark-border">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={simpleCn(
            "pb-2 text-sm font-medium transition-colors relative",
            activeTab === 'general'
              ? "text-nebula-600 dark:text-nebula-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          {t('common.general')}
          {activeTab === 'general' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-nebula-500 rounded-t-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tunnels')}
          className={simpleCn(
            "pb-2 text-sm font-medium transition-colors relative flex items-center gap-2",
            activeTab === 'tunnels'
              ? "text-nebula-600 dark:text-nebula-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <Network size={14} />
          Tunnels
          {formData.forwarding_rules.length > 0 && (
            <span className="bg-slate-100 dark:bg-slate-800 text-xs px-1.5 rounded-full">
              {formData.forwarding_rules.length}
            </span>
          )}
          {activeTab === 'tunnels' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-nebula-500 rounded-t-full" />
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={activeTab === 'general' ? 'block space-y-4' : 'hidden'}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('modal.display_name')}
              placeholder={t('modal.display_name_ph')}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <ComboBox
              label={t('modal.group')}
              placeholder={t('modal.group_ph')}
              value={formData.group}
              onChange={(value) => setFormData({ ...formData, group: value })}
              options={existingGroups}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                label={t('modal.host')}
                placeholder={t('modal.host_ph')}
                value={formData.host}
                onChange={e => setFormData({ ...formData, host: e.target.value })}
                required
              />
            </div>
            <div>
              <Input
                label={t('modal.port')}
                placeholder="22"
                value={formData.port}
                onChange={e => setFormData({ ...formData, port: e.target.value })}
              />
            </div>
          </div>

          <Input
            label={t('modal.username')}
            placeholder={t('modal.username_ph')}
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Jump Host / Proxy</label>
            <select
              value={formData.jump_host_id || ''}
              onChange={e => setFormData({ ...formData, jump_host_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-nebula-500/20 focus:border-nebula-500 transition-all"
            >
              <option value="">None (Direct Connection)</option>
              {servers
                .filter(s => s.id !== editingServer?.id && s.protocol !== 'local') // Prevent self-reference and local terminals
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.host})
                  </option>
                ))}
            </select>
          </div>

          <div className="relative">
            <Input
              label={t('modal.password')}
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 bottom-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Input
            label={t('modal.tags')}
            placeholder={t('modal.tags_ph')}
            value={formData.tags}
            onChange={e => setFormData({ ...formData, tags: e.target.value })}
          />

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">{t('modal.color_marker')}</label>
            <div className="flex gap-3">
              {['nebula', 'blue', 'purple', 'orange'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={simpleCn(
                    "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                    formData.color === color
                      ? "border-slate-400 dark:border-white scale-110"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  style={{ backgroundColor: `var(--color-${color}-500)` }}
                >
                  <div className={simpleCn(
                    "w-full h-full rounded-full",
                    color === 'nebula' ? 'bg-teal-500' :
                      color === 'blue' ? 'bg-blue-500' :
                        color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'
                  )}>
                    {formData.color === color && <Check size={14} className="text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={activeTab === 'tunnels' ? 'block' : 'hidden'}>
          <PortForwardingPanel
            rules={formData.forwarding_rules}
            onChange={rules => setFormData({ ...formData, forwarding_rules: rules })}
          />
        </div>

        {testResult && (
          <div className={`p-3 rounded-lg text-sm ${testResult.success
            ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
            {testResult.message}
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
            disabled={isTestingConnection || !formData.host || !formData.username}
          >
            {isTestingConnection ? t('modal.testing') : t('modal.test_connection')}
          </Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
};
