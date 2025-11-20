import React, { useEffect, useState } from 'react';
import { Terminal, Sparkles } from 'lucide-react';
import { simpleCn } from '../utils';

interface Props {
    onFinish: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onFinish }) => {
    const [progress, setProgress] = useState(0);
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
        const duration = 2000; // 2 seconds splash
        const interval = 20;
        const steps = duration / interval;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const newProgress = Math.min((currentStep / steps) * 100, 100);
            setProgress(newProgress);

            if (currentStep >= steps) {
                clearInterval(timer);
                // Start fade out
                setOpacity(0);
                setTimeout(onFinish, 500); // Wait for fade out
            }
        }, interval);

        return () => clearInterval(timer);
    }, [onFinish]);

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0c0c0e] transition-opacity duration-500 ease-out"
            style={{ opacity }}
        >
            <div className="relative mb-8">
                {/* Pulsing Glow Effect */}
                <div className="absolute inset-0 bg-nebula-500/20 blur-3xl rounded-full animate-pulse" />

                <div className="relative flex items-center justify-center w-24 h-24 bg-gradient-to-br from-nebula-500 to-purple-600 rounded-2xl shadow-2xl shadow-nebula-500/30 transform transition-transform hover:scale-105 duration-500 overflow-hidden">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Nebula <span className="text-nebula-400">SSH</span>
            </h1>
            <p className="text-slate-400 text-sm mb-12 font-medium tracking-wide">
                Next Generation Terminal
            </p>

            {/* Loading Bar */}
            <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-nebula-500 to-purple-500 transition-all duration-75 ease-linear shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="mt-4 text-xs text-slate-500 font-mono">
                Initializing core services... {Math.floor(progress)}%
            </div>
        </div>
    );
};
