"use client";
import dynamic from 'next/dynamic';

const NinjaWorld = dynamic(() => import('./NinjaWorld'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-[#c0bbb5] border-t-[#554e44] rounded-full animate-spin" />
            <p className="font-mono text-xs text-[#554e44] uppercase tracking-widest">Loading game…</p>
        </div>
    ),
});

export default function TypingNinjaPage() {
    return (
        <div className="fixed inset-0 z-[99999] bg-[#f4e0c5] overflow-hidden font-sans select-none">
            <NinjaWorld />
        </div>
    );
}
