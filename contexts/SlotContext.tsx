import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface SlotContextType {
    getPaneRoot: (id: string) => HTMLElement;
    removePaneRoot: (id: string) => void;
}

const SlotContext = createContext<SlotContextType | null>(null);

export const SlotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const paneRootsRef = useRef<Record<string, HTMLElement>>({});

    const getPaneRoot = useCallback((id: string) => {
        if (!paneRootsRef.current[id]) {
            const div = document.createElement('div');
            div.style.width = '100%';
            div.style.height = '100%';
            div.style.position = 'absolute';
            div.style.top = '0';
            div.style.left = '0';
            paneRootsRef.current[id] = div;
        }
        return paneRootsRef.current[id];
    }, []);

    const removePaneRoot = useCallback((id: string) => {
        const root = paneRootsRef.current[id];
        if (root) {
            root.remove(); // Ensure it's detached
            delete paneRootsRef.current[id];
        }
    }, []);

    return (
        <SlotContext.Provider value={{ getPaneRoot, removePaneRoot }}>
            {children}
        </SlotContext.Provider>
    );
};

export const useSlot = () => {
    const context = useContext(SlotContext);
    if (!context) throw new Error('useSlot must be used within a SlotProvider');
    return context;
};
