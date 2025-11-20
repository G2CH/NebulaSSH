import { useState, useCallback, useEffect, useRef } from 'react';

interface UseResizableOptions {
    defaultWidth: number;
    minWidth: number;
    maxWidth: number;
    storageKey: string;
}

export const useResizable = ({ defaultWidth, minWidth, maxWidth, storageKey }: UseResizableOptions) => {
    const [width, setWidth] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? parseInt(saved, 10) : defaultWidth;
    });

    const [isResizing, setIsResizing] = useState(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = width;
        e.preventDefault();
    }, [width]);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = startXRef.current - e.clientX; // Reversed for right sidebar
            const newWidth = Math.min(Math.max(startWidthRef.current + delta, minWidth), maxWidth);
            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            localStorage.setItem(storageKey, width.toString());
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, minWidth, maxWidth, storageKey, width]);

    return {
        width,
        isResizing,
        handleMouseDown
    };
};
