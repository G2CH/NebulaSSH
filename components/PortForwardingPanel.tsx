import React, { useState } from 'react';
import { PortForwardingRule } from '../types';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { simpleCn, generateId } from '../utils';
import { useApp } from '../contexts/AppContext';
import { Select } from './ui/Select';

interface Props {
    rules: PortForwardingRule[];
    onChange: (rules: PortForwardingRule[]) => void;
}

export const PortForwardingPanel: React.FC<Props> = ({ rules, onChange }) => {
    const { t } = useApp();
    const [newRule, setNewRule] = useState<Partial<PortForwardingRule>>({
        rule_type: 'Local',
        source_port: 8080,
        destination_host: 'localhost',
        destination_port: 80
    });

    const handleAdd = () => {
        if (!newRule.source_port) return;

        const rule: PortForwardingRule = {
            id: generateId(),
            rule_type: newRule.rule_type as 'Local' | 'Remote' | 'Dynamic',
            source_port: newRule.source_port,
            destination_host: newRule.destination_host,
            destination_port: newRule.destination_port
        };

        onChange([...rules, rule]);

        // Reset but keep some defaults for easy entry
        setNewRule({
            ...newRule,
            source_port: (newRule.source_port || 8000) + 1
        });
    };

    const handleRemove = (id: string) => {
        onChange(rules.filter(r => r.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-end gap-2 bg-slate-50 dark:bg-dark-surface p-3 rounded-lg border border-slate-200 dark:border-dark-border">
                <div className="flex-1">
                    <Select
                        size="sm"
                        value={newRule.rule_type}
                        onChange={e => setNewRule({ ...newRule, rule_type: e.target.value as any })}
                        options={[
                            { value: 'Local', label: 'Local (L)' },
                            { value: 'Remote', label: 'Remote (R)' },
                            { value: 'Dynamic', label: 'Dynamic (D)' }
                        ]}
                    />
                </div>

                <div className="w-20 space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase">Src Port</label>
                    <input
                        type="number"
                        value={newRule.source_port}
                        onChange={e => setNewRule({ ...newRule, source_port: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg"
                        placeholder="8080"
                    />
                </div>

                {newRule.rule_type !== 'Dynamic' && (
                    <>
                        <div className="flex items-center justify-center pb-2 text-slate-400">
                            <ArrowRight size={14} />
                        </div>

                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-medium text-slate-500 uppercase">Dest Host</label>
                            <input
                                type="text"
                                value={newRule.destination_host}
                                onChange={e => setNewRule({ ...newRule, destination_host: e.target.value })}
                                className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg"
                                placeholder="localhost"
                            />
                        </div>

                        <div className="w-20 space-y-1">
                            <label className="text-[10px] font-medium text-slate-500 uppercase">Dest Port</label>
                            <input
                                type="number"
                                value={newRule.destination_port}
                                onChange={e => setNewRule({ ...newRule, destination_port: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg"
                                placeholder="80"
                            />
                        </div>
                    </>
                )}

                <button
                    onClick={handleAdd}
                    className="p-1.5 bg-nebula-600 hover:bg-nebula-500 text-white rounded transition-colors mb-[1px]"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="space-y-2">
                {rules.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400 italic">
                        No forwarding rules configured.
                    </div>
                )}

                {rules.map(rule => (
                    <div key={rule.id} className="flex items-center gap-3 p-2 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded text-xs group">
                        <div className={simpleCn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                            rule.rule_type === 'Local' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                rule.rule_type === 'Remote' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                                    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                        )}>
                            {rule.rule_type}
                        </div>

                        <div className="font-mono font-medium">{rule.source_port}</div>

                        {rule.rule_type !== 'Dynamic' && (
                            <>
                                <ArrowRight size={12} className="text-slate-400" />
                                <div className="font-mono text-slate-600 dark:text-slate-400">
                                    {rule.destination_host}:{rule.destination_port}
                                </div>
                            </>
                        )}

                        <button
                            onClick={() => handleRemove(rule.id)}
                            className="ml-auto p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
