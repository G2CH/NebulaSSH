import { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';

export interface ContextMenuAction {
    label: string;
    icon?: React.ReactNode;
    action: (selectedText: string) => void;
    requiresSelection?: boolean;
}

export interface ContextMenuPosition {
    x: number;
    y: number;
}

export const useTerminalContextMenu = (
    terminal: Terminal | null,
    actions: ContextMenuAction[]
) => {
    const [menuPosition, setMenuPosition] = useState<ContextMenuPosition | null>(null);
    const [selectedText, setSelectedText] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    const hideMenu = useCallback(() => {
        setMenuPosition(null);
        setSelectedText('');
    }, []);

    useEffect(() => {
        if (!terminal) return;

        const terminalElement = terminal.element;
        if (!terminalElement) return;

        const handleContextMenu = (e: MouseEvent) => {
            const selection = terminal.getSelection();

            e.preventDefault(); // Prevent default browser context menu
            const text = selection ? selection.trim() : '';
            setSelectedText(text);
            setMenuPosition({
                x: e.clientX,
                y: e.clientY
            });
        };

        const handleClick = (e: MouseEvent) => {
            // Close menu if clicking outside
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                hideMenu();
            }
        };

        terminalElement.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', handleClick);

        return () => {
            terminalElement.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('click', handleClick);
        };
    }, [terminal, hideMenu]);

    const executeAction = useCallback((action: ContextMenuAction) => {
        action.action(selectedText);
        hideMenu();
    }, [selectedText, hideMenu]);

    return {
        menuPosition,
        selectedText,
        menuRef,
        hideMenu,
        executeAction,
        actions
    };
};
