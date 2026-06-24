"use client";
import dynamic from 'next/dynamic';

const NinjaWorld = dynamic(() => import('./NinjaWorld'), { ssr: false });

export default function TypingNinjaPage() {
    return (
        <div className="fixed inset-0 z-[99999] bg-[#f4e0c5] overflow-hidden font-sans select-none">
            <NinjaWorld />
        </div>
    );
}
