"use client";
import dynamic from 'next/dynamic';
import { useGameView } from '@/lib/catalog/gameStats';

const TugWorld = dynamic(() => import('./TugWorld'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#bfe0f2] border-t-[#14344f] rounded-full animate-spin" />
            <p className="font-mono text-xs font-bold text-[#14344f] uppercase tracking-widest">Loading game…</p>
        </div>
    ),
});

export default function TugOfTypingPage() {
    useGameView('tug-of-typing');
    return (
        <div className="fixed inset-0 z-[99999] bg-[#3f8f38] overflow-hidden font-sans select-none">
            <TugWorld />
        </div>
    );
}
