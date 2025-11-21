import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ShieldCheck, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { simpleCn } from '../../utils';
import { useApp } from '../../contexts/AppContext';

interface SetupMasterPasswordProps {
    onComplete: () => void;
}

export const SetupMasterPassword: React.FC<SetupMasterPasswordProps> = ({ onComplete }) => {
    const { t } = useApp();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || !confirmPassword) return;

        if (password !== confirmPassword) {
            setError(t('security.password_mismatch'));
            return;
        }

        if (password.length < 8) {
            setError(t('security.password_length'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await invoke('setup_encryption', { password });
            onComplete();
        } catch (err) {
            setError(t('security.setup_failed'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-slate-200">
            <div className="w-full max-w-md p-8 bg-slate-900 rounded-xl shadow-2xl border border-slate-800">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="p-4 bg-green-500/10 rounded-full mb-4">
                        <ShieldCheck size={48} className="text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{t('security.setup_title')}</h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        {t('security.setup_desc')}
                    </p>
                </div>

                <form onSubmit={handleSetup} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">{t('security.master_password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('security.enter_password')}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-white placeholder-slate-500"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">{t('security.confirm_password')}</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('security.confirm_password_ph')}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-white placeholder-slate-500"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex items-start gap-2 text-yellow-500/80 text-xs bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                        <p>{t('security.warning_loss')}</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !password || !confirmPassword}
                        className={simpleCn(
                            "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
                            "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20",
                            (isLoading || !password || !confirmPassword) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{t('security.set_password')}</span>
                                <Check size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
