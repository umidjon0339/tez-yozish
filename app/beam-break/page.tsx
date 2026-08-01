"use client";
import dynamic from 'next/dynamic';
import { useGameView } from '@/lib/gameStats';

const BeamBreakWorld = dynamic(() => import('./BeamBreakWorld'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#8fd86a] border-t-[#2b2436] rounded-full animate-spin" />
            <p className="font-mono text-xs font-bold text-[#2b2436] uppercase tracking-widest">
                🛸 Loading game…
            </p>
        </div>
    ),
});

export default function BeamBreakPage() {
    useGameView('beam-break');
    return (
        <div className="fixed inset-0 z-[99999] bg-[#a8dcf2] overflow-hidden font-sans select-none">
            <BeamBreakWorld />
        </div>
    );
}
