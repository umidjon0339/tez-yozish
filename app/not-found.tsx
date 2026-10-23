"use client";

import Link from "next/link";
import { Mascot } from "@/components/Mascot";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";

export default function NotFound() {
  const { locale } = useLocale();

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[#FAFAFA] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 px-6">
      <Mascot mood="oops" className="w-24 h-24" />
      <p className="font-mono text-6xl font-black text-neutral-200">404</p>
      <h1 className="text-xl font-bold">{STR.notFound.title[locale]}</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm">
        {STR.notFound.body[locale]}
      </p>
      <div className="flex gap-3 mt-2">
        <Link
          href="/"
          className="px-5 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 text-sm font-semibold rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
        >
          {STR.notFound.home[locale]}
        </Link>
        <Link
          href="/courses"
          className="px-5 py-2.5 border border-neutral-300 dark:border-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          {STR.notFound.courses[locale]}
        </Link>
      </div>
    </main>
  );
}
