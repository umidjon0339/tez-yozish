"use client";

import Link from "next/link";
import { Mascot } from "@/components/Mascot";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";

export default function NotFound() {
  const { locale } = useLocale();

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[#FAFAFA] text-neutral-900 px-6">
      <Mascot mood="oops" className="w-24 h-24" />
      <p className="font-mono text-6xl font-black text-neutral-200">404</p>
      <h1 className="text-xl font-bold">{STR.notFound.title[locale]}</h1>
      <p className="text-sm text-neutral-500 text-center max-w-sm">
        {STR.notFound.body[locale]}
      </p>
      <div className="flex gap-3 mt-2">
        <Link
          href="/"
          className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
        >
          {STR.notFound.home[locale]}
        </Link>
        <Link
          href="/courses"
          className="px-5 py-2.5 border border-neutral-300 text-sm font-semibold rounded-lg hover:bg-neutral-100 transition-colors"
        >
          {STR.notFound.courses[locale]}
        </Link>
      </div>
    </main>
  );
}
