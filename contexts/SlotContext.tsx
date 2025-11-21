import React, { createContext, useContext, useState, useCallback } from 'react';

interface SlotContextType {
    registerSlot: (id: string, element: HTMLElement | null) => void;
    getSlot: (id: string) => HTMLElement | null;
    slots: Record<string, HTMLElement>;
    hiddenContainer: HTMLElement | null;
}

const SlotContext = createContext<SlotContextType | null>(null);

export const SlotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [slots, setSlots] = useState<Record<string, HTMLElement>>({});
    const [hiddenContainer, setHiddenContainer] = useState<HTMLElement | null>(null);

    const registerSlot = useCallback((id: string, element: HTMLElement | null) => {
        setSlots(prev => {
            if (element === null) {
                const { [id]: _, ...rest } = prev;
                return rest;
            }
            if (prev[id] === element) return prev;
            return { ...prev, [id]: element };
        });
    }, []);

    const getSlot = useCallback((id: string) => slots[id] || null, [slots]);

    return (
        <SlotContext.Provider value={{ registerSlot, getSlot, slots, hiddenContainer }}>
            {children}
            <div
                ref={setHiddenContainer}
                style={{ display: 'none', position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
            />
        </SlotContext.Provider>
    );
};

export const useSlot = () => {
    const context = useContext(SlotContext);
    if (!context) throw new Error('useSlot must be used within a SlotProvider');
    return context;
};
