"use client";
import dynamic from 'next/dynamic';
import { useGameView } from '@/lib/gameStats';

const NinjaWorld = dynamic(() => import('./NinjaWorld'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#e0c9a6] border-t-[#3d2a21] rounded-full animate-spin" />
            <p className="font-mono text-xs font-bold text-[#3d2a21] uppercase tracking-widest">🥷 Loading game…</p>
        </div>
    ),
});

export default function TypingNinjaPage() {
    useGameView('typing-ninja');
    return (
        <div className="fixed inset-0 z-[99999] bg-[#f4e0c5] overflow-hidden font-sans select-none">
            <NinjaWorld />
        </div>
    );
}
