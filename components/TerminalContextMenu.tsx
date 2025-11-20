import React from 'react';
import { ContextMenuAction, ContextMenuPosition } from '../hooks/useTerminalContextMenu';
import { simpleCn } from '../utils';

interface Props {
    position: ContextMenuPosition;
    actions: ContextMenuAction[];
    onActionClick: (action: ContextMenuAction) => void;
    menuRef: React.RefObject<HTMLDivElement>;
}

export const TerminalContextMenu: React.FC<Props> = ({ position, actions, onActionClick, menuRef }) => {
    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-dark-border rounded-lg shadow-2xl py-1 min-w-[180px] animate-scale-in"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`
            }}
        >
            {actions.map((action, index) => (
                <button
                    key={index}
                    onClick={() => onActionClick(action)}
                    className={simpleCn(
                        "w-full px-3 py-2 text-left text-sm flex items-center gap-2",
                        "text-slate-700 dark:text-slate-200",
                        "hover:bg-nebula-50 dark:hover:bg-nebula-500/10",
                        "transition-colors"
                    )}
                >
                    {action.icon && <span className="text-nebula-500">{action.icon}</span>}
                    {action.label}
                </button>
            ))}
        </div>
    );
};
