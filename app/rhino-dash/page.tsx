"use client";
import dynamic from 'next/dynamic';
import { useGameView } from '@/lib/catalog/gameStats';

const RhinoWorld = dynamic(() => import('./RhinoWorld'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#bfe0f2] border-t-[#14344f] rounded-full animate-spin" />
            <p className="font-mono text-xs font-bold text-[#14344f] uppercase tracking-widest">🦏 Loading game…</p>
        </div>
    ),
});

export default function RhinoDashPage() {
    useGameView('rhino-dash');
    return (
        <div className="fixed inset-0 z-[99999] bg-[#bfe5f8] overflow-hidden font-sans select-none">
            <RhinoWorld />
        </div>
    );
}
