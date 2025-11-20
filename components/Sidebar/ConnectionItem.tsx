
import React from 'react';
import { Server } from '../../types';
import { Terminal, Play, Pencil, Trash2 } from 'lucide-react';
import { simpleCn } from '../../utils';

interface Props {
  server: Server;
  onClick: () => void;
  onConnect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function ConnectionItemComponent({ server, onClick, onConnect, onEdit, onDelete }: Props) {
  return (
    <div
      className="group relative flex items-center gap-3 p-2 mx-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent"
      onClick={onClick}
    >
      {/* Icon / Color Marker */}
      <div className={simpleCn(
        "flex items-center justify-center w-8 h-8 rounded-md text-xs transition-transform group-hover:scale-105 shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10",
        server.color === 'blue' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
          server.color === 'purple' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
            server.color === 'orange' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
              'bg-nebula-500/10 text-nebula-600 dark:text-nebula-400'
      )}>
        <Terminal size={15} />
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
          {server.name}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={simpleCn(
            "w-1.5 h-1.5 rounded-full",
            server.lastConnected ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-600"
          )} />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono opacity-80 group-hover:opacity-100">
            {server.username}@{server.host}
          </p>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConnect();
          }}
          className="p-1.5 hover:bg-white dark:hover:bg-dark-bg rounded-md text-nebula-600 dark:text-nebula-400 transition-all shadow-sm"
          title="Quick Connect"
        >
          <Play size={12} fill="currentColor" />
        </button>

        {onEdit && server.protocol !== 'local' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 hover:bg-white dark:hover:bg-dark-bg rounded-md text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
        )}

        {onDelete && server.protocol !== 'local' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 hover:bg-white dark:hover:bg-dark-bg rounded-md text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-sm"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

export const ConnectionItem = React.memo(ConnectionItemComponent);
