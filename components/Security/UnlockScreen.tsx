import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { simpleCn } from '../../utils';
import { useApp } from '../../contexts/AppContext';

interface UnlockScreenProps {
    onUnlock: () => void;
}

export const UnlockScreen: React.FC<UnlockScreenProps> = ({ onUnlock }) => {
    const { t } = useApp();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault(); // Keep preventDefault for form submission
        if (!password) return;

        setError('');
        setIsLoading(true); // Use setIsLoading

        try {
            await invoke('unlock_app', { password });
            console.log('Unlock successful');
            onUnlock();
        } catch (err) {
            setError(t('security.incorrect_password')); // Revert to original error message for localization
            setPassword('');
            console.error(err); // Keep original error logging
        } finally {
            setIsLoading(false); // Use setIsLoading
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-slate-200">
            <div className="w-full max-w-md p-8 bg-slate-900 rounded-xl shadow-2xl border border-slate-800">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 bg-nebula-500/10 rounded-full mb-4">
                        <Lock size={48} className="text-nebula-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{t('security.locked_title')}</h1>
                    <p className="text-slate-400 mt-2">{t('security.locked_desc')}</p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('security.master_password')}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-nebula-500 focus:border-transparent transition-all text-white placeholder-slate-500"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !password}
                        className={simpleCn(
                            "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
                            "bg-nebula-600 hover:bg-nebula-500 text-white shadow-lg shadow-nebula-900/20",
                            (isLoading || !password) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{t('security.unlock')}</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
