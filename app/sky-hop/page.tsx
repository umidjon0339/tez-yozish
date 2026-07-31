"use client";
import dynamic from 'next/dynamic';

const SkyHopWorld = dynamic(() => import('./SkyHopWorld'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#bfe0f2] border-t-[#14344f] rounded-full animate-spin" />
            <p className="font-mono text-xs font-bold text-[#14344f] uppercase tracking-widest">🎈 Loading game…</p>
        </div>
    ),
});

export default function SkyHopPage() {
    return (
        <div className="fixed inset-0 z-[99999] bg-[#9ed8f6] overflow-hidden font-sans select-none">
            <SkyHopWorld />
        </div>
    );
}
