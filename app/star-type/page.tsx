"use client";
import dynamic from 'next/dynamic';
import { useGameView } from '@/lib/catalog/gameStats';

const StarTypeWorld = dynamic(() => import('./StarTypeWorld'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#3ff0d0] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs font-bold text-[#3ff0d0] uppercase tracking-widest">
                🛰️ Loading game…
            </p>
        </div>
    ),
});

export default function StarTypePage() {
    useGameView('star-type');
    return (
        <div className="fixed inset-0 z-[99999] bg-[#08181a] overflow-hidden font-sans select-none">
            <StarTypeWorld />
        </div>
    );
}
