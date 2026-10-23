"use client";
import dynamic from 'next/dynamic';
import { useGameView } from '@/lib/catalog/gameStats';

const WordForgeWorld = dynamic(() => import('./WordForgeWorld'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#ffb03a] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs font-bold text-[#ffb03a] uppercase tracking-widest">
                🔥 Loading game…
            </p>
        </div>
    ),
});

export default function WordForgePage() {
    useGameView('word-forge');
    return (
        <div className="fixed inset-0 z-[99999] bg-[#120c08] overflow-hidden font-sans select-none">
            <WordForgeWorld />
        </div>
    );
}
