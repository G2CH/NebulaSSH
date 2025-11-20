
import React, { useState, useEffect } from 'react';
import { simpleCn } from '../../utils';
import { Cpu, HardDrive, Activity, Wifi, Clock, RefreshCw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface MetricProps {
  label: string;
  value: number; // 0-100
  unit: string;
  color: string;
  history?: number[];
}

const MetricCard: React.FC<MetricProps> = ({ label, value, unit, color, history }) => {
  // Filter and validate history data
  const validHistory = history?.filter(v => !isNaN(v) && isFinite(v) && v >= 0 && v <= 100) || [];
  const hasValidData = validHistory.length >= 2;

  // Generate SVG paths only if we have valid data
  let linePath = '';
  let areaPath = '';

  if (hasValidData) {
    const points = validHistory.map((h, i) => {
      const x = (i / (validHistory.length - 1)) * 100;
      const y = Math.max(0, Math.min(64, 64 - (h / 100) * 64));
      return { x, y };
    });

    linePath = `M 0 ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaPath = `M 0 64 L 0 ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ` L 100 64 Z`;
  }

  return (
    <div className="bg-white dark:bg-dark-surface/50 border border-slate-200 dark:border-dark-border rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-nebula-500/30 transition-all duration-500 shadow-sm dark:shadow-none">
      <div className={`absolute top-0 left-0 w-full h-0.5 bg-${color}-500/50`} />
      <div className="flex justify-between items-start z-10">
        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</h3>
        <span className={simpleCn("text-xl font-bold font-mono", `text-${color}-600 dark:text-${color}-400`)}>
          {value.toFixed(1)}{unit}
        </span>
      </div>

      {/* Simple Sparkline SVG */}
      <div className="mt-4 h-16 w-full relative">
        {hasValidData && (
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 64">
            <path
              d={areaPath}
              fill={`var(--color-${color}-500)`}
              fillOpacity="0.1"
              className="transition-all duration-300 ease-linear"
            />
            <path
              d={linePath}
              fill="none"
              stroke={`var(--color-${color}-500)`}
              strokeWidth="2"
              strokeOpacity="0.6"
              vectorEffect="non-scaling-stroke"
              className="transition-all duration-300 ease-linear"
            />
          </svg>
        )}
      </div>
    </div>
  );
};

const CircularGauge: React.FC<{ value: number; label: string; subLabel: string }> = ({ value, label, subLabel }) => {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="bg-white dark:bg-dark-surface/50 border border-slate-200 dark:border-dark-border rounded-xl p-5 flex flex-col items-center justify-center relative shadow-sm dark:shadow-none">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-100 dark:text-dark-border" />
          <circle
            cx="64"
            cy="64"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out text-nebula-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value.toFixed(1)}%</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</div>
        <div className="text-xs text-slate-500">{subLabel}</div>
      </div>
    </div>
  );
};

import { invoke } from '@tauri-apps/api/core';

interface Props {
  sessionId: string;
  isLocal?: boolean;
}

export const SystemDashboard: React.FC<Props> = ({ sessionId, isLocal = false }) => {
  const { t } = useApp();
  // Mock Data State
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(20).fill(0));
  const [memHistory, setMemHistory] = useState<number[]>(Array(20).fill(0));
  const [netInHistory, setNetInHistory] = useState<number[]>(Array(20).fill(0));
  const [uptime, setUptime] = useState(0);
  const [processes, setProcesses] = useState<any[]>([]);
  const [diskUsage, setDiskUsage] = useState({ total: '0G', used: '0G', percent: 0 });
  const [systemInfo, setSystemInfo] = useState({ os: '', cpu: '', cores: 0, mem: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let stats: any;

        if (isLocal) {
          // Local system monitoring
          stats = await invoke<any>('get_local_system_stats');
        } else {
          // SSH system monitoring
          stats = await invoke<any>('get_system_stats', { id: sessionId });
        }

        setCpuHistory(prev => [...prev.slice(1), stats.cpu_usage || 0]);
        setMemHistory(prev => [...prev.slice(1), stats.mem_usage || 0]);
        setNetInHistory(prev => [...prev.slice(1), (stats.net_rx / 1024) % 100]); // Mock scale for now
        setUptime(stats.uptime || 0);
        setProcesses(stats.processes || []);
        setDiskUsage({
          total: stats.disk_total || '0B',
          used: stats.disk_used || '0B',
          percent: stats.disk_usage || 0
        });

        // Update system info (for both local and SSH)
        if (stats.os_version) {
          setSystemInfo({
            os: stats.os_version || '',
            cpu: stats.cpu_model || '',
            cores: stats.cpu_cores || 0,
            mem: stats.mem_total_gb || ''
          });
        }
      } catch (e) {
        console.error("Monitoring Error:", e);
        console.error("Error details:", JSON.stringify(e));
      } finally {
        setIsLoading(false);
      }
    };

    const interval = setInterval(fetchData, 5000); // Poll every 5s
    fetchData(); // Initial fetch

    return () => clearInterval(interval);
  }, [sessionId, isLocal]);

  const formatUptime = (sec: number) => {
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#0d1117] overflow-y-auto p-6 md:p-8 transition-colors">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
          <RefreshCw size={24} className="animate-spin opacity-50" />
          <span className="text-xs">{t('common.loading')}</span>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-300">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Activity className="text-nebula-600 dark:text-nebula-400" />
                {t('dashboard.title')}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {systemInfo.os ? (
                  <>
                    {systemInfo.os} • {systemInfo.cpu} • {systemInfo.cores} Cores • {systemInfo.mem}
                  </>
                ) : isLocal ? (
                  'Local System'
                ) : (
                  'Remote Server'
                )}
              </p>
            </div>
            <div className="bg-white dark:bg-dark-surface px-4 py-2 rounded-lg border border-slate-200 dark:border-dark-border flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-none">
              <Clock size={16} />
              <span className="font-mono text-nebula-600 dark:text-nebula-400">{formatUptime(uptime)}</span>
              <span>{t('dashboard.uptime')}</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              label={t('dashboard.cpu')}
              value={cpuHistory[cpuHistory.length - 1]}
              unit="%"
              color="nebula"
              history={cpuHistory}
            />
            <MetricCard
              label={t('dashboard.memory')}
              value={memHistory[memHistory.length - 1]}
              unit="%"
              color="purple"
              history={memHistory}
            />
            <MetricCard
              label={t('dashboard.network')}
              value={netInHistory[netInHistory.length - 1]}
              unit=" KB/s"
              color="blue"
              history={netInHistory}
            />
          </div>

          {/* Disk & Processes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Disk Usage */}
            <div className="md:col-span-1 space-y-6">
              <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">{t('dashboard.storage')}</h3>
              <CircularGauge value={diskUsage.percent} label="/ (Root)" subLabel={`${diskUsage.used} / ${diskUsage.total}`} />
              <div className="bg-white dark:bg-dark-surface/30 rounded-lg p-4 border border-slate-200 dark:border-dark-border shadow-sm dark:shadow-none">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500 dark:text-slate-400">/</span>
                  <span className="text-slate-700 dark:text-slate-200">{diskUsage.percent}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-dark-bg h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${diskUsage.percent}%` }} />
                </div>
              </div>
            </div>

            {/* Top Processes (Mock Table) */}
            <div className="md:col-span-2 bg-white dark:bg-dark-surface/30 border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{t('dashboard.top_processes')}</h3>
                <button className="text-xs text-nebula-600 dark:text-nebula-400 hover:text-nebula-500 dark:hover:text-nebula-300 font-medium">{t('dashboard.view_all')}</button>
              </div>

              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 border-b border-slate-100 dark:border-dark-border">
                  <tr>
                    <th className="pb-3 font-medium">{t('dashboard.col_pid')}</th>
                    <th className="pb-3 font-medium">{t('dashboard.col_user')}</th>
                    <th className="pb-3 font-medium">{t('dashboard.col_cpu')}</th>
                    <th className="pb-3 font-medium">{t('dashboard.col_mem')}</th>
                    <th className="pb-3 font-medium">{t('dashboard.col_cmd')}</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {processes.map((proc, i) => (
                    <tr key={i} className="border-b border-slate-50 dark:border-dark-border/50 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 text-slate-500 dark:text-slate-400">{proc.pid}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{proc.user}</td>
                      <td className="py-3 text-nebula-600 dark:text-nebula-400">{proc.cpu}%</td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{proc.mem}%</td>
                      <td className="py-3 text-slate-700 dark:text-slate-200 truncate max-w-[150px]" title={proc.command}>{proc.command}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
