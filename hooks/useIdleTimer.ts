import { useEffect, useRef, useCallback } from 'react';

export const useIdleTimer = (
    timeoutMinutes: number,
    onIdle: () => void,
    isActive: boolean = true
) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now();

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (isActive && timeoutMinutes > 0) {
            timerRef.current = setTimeout(() => {
                onIdle();
            }, timeoutMinutes * 60 * 1000);
        }
    }, [timeoutMinutes, onIdle, isActive]);

    useEffect(() => {
        if (!isActive || timeoutMinutes <= 0) {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            return;
        }

        const events = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click'
        ];

        const handleActivity = () => {
            resetTimer();
        };

        // Initial start
        resetTimer();

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isActive, timeoutMinutes, resetTimer]);

    return {
        resetTimer
    };
};
