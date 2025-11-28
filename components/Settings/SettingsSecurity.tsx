import React, { useState } from 'react';
import { ShieldCheck, Info, Check } from 'lucide-react';
import { simpleCn } from '../../utils';
import { useApp } from '../../contexts/AppContext';
import { AppSettings } from '../../types';
import { Button } from '../ui/Button';
import { invoke } from '@tauri-apps/api/core';

interface SettingsSecurityProps {
    settings: AppSettings;
    setSettings: (settings: AppSettings) => void;
}

export const SettingsSecurity: React.FC<SettingsSecurityProps> = ({ settings, setSettings }) => {
    const { t } = useApp();

    // Change Password State
    const [changePasswordForm, setChangePasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [changePasswordError, setChangePasswordError] = useState('');
    const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleChangePassword = async () => {
        const { oldPassword, newPassword, confirmPassword } = changePasswordForm;
        if (!oldPassword || !newPassword || !confirmPassword) {
            setChangePasswordError(t('security.all_fields_required'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setChangePasswordError(t('security.password_mismatch'));
            return;
        }
        if (newPassword.length < 8) {
            setChangePasswordError(t('security.password_length'));
            return;
        }

        setIsChangingPassword(true);
        setChangePasswordError('');
        setChangePasswordSuccess('');

        try {
            await invoke('change_master_password', { oldPassword, newPassword });
            setChangePasswordSuccess(t('security.change_success'));
            setChangePasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (e: any) {
            setChangePasswordError(typeof e === 'string' ? e : t('security.change_failed'));
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                    <ShieldCheck className="text-green-500" size={20} />
                    {t('settings.security')}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">
                    {t('settings.security_desc')}
                </p>

                <div className="bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-4 transition-all hover:shadow-sm dark:hover:shadow-none dark:hover:border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('security.auto_lock')}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('security.auto_lock_desc')}</p>
                        </div>
                        <button
                            onClick={() => setSettings({
                                ...settings,
                                lock_timeout: settings.lock_timeout === 0 ? 10 : 0
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.lock_timeout > 0
                                ? 'bg-nebula-500'
                                : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.lock_timeout > 0 ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {settings.lock_timeout > 0 && (
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">{t('security.lock_timeout')}</label>
                            <div className="flex gap-2">
                                {[5, 10, 15].map(minutes => (
                                    <button
                                        key={minutes}
                                        onClick={() => setSettings({ ...settings, lock_timeout: minutes })}
                                        className={simpleCn(
                                            "px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-2",
                                            settings.lock_timeout === minutes
                                                ? "bg-nebula-500 text-white border-nebula-500 shadow-sm"
                                                : "bg-white dark:bg-[#0b0b0d] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600"
                                        )}
                                    >
                                        {minutes} {t('security.minutes')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border p-4 transition-all hover:shadow-sm dark:hover:shadow-none dark:hover:border-slate-700">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">{t('security.change_password')}</h4>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('security.current_password')}</label>
                            <input
                                type="password"
                                value={changePasswordForm.oldPassword}
                                onChange={(e) => setChangePasswordForm({ ...changePasswordForm, oldPassword: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-[#0b0b0d] border border-slate-200 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-nebula-500/50 text-slate-900 dark:text-slate-100 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('security.new_password')}</label>
                            <input
                                type="password"
                                value={changePasswordForm.newPassword}
                                onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-[#0b0b0d] border border-slate-200 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-nebula-500/50 text-slate-900 dark:text-slate-100 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('security.confirm_new_password')}</label>
                            <input
                                type="password"
                                value={changePasswordForm.confirmPassword}
                                onChange={(e) => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-[#0b0b0d] border border-slate-200 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-nebula-500/50 text-slate-900 dark:text-slate-100 text-sm"
                            />
                        </div>

                        {changePasswordError && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <Info size={12} /> {changePasswordError}
                            </p>
                        )}
                        {changePasswordSuccess && (
                            <p className="text-xs text-green-500 flex items-center gap-1">
                                <Check size={12} /> {changePasswordSuccess}
                            </p>
                        )}

                        <Button
                            onClick={handleChangePassword}
                            disabled={isChangingPassword}
                            className="w-full mt-2 bg-slate-800 hover:bg-slate-700"
                        >
                            {isChangingPassword ? t('security.changing') : t('security.update_password')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
