import Link from "next/link";
import { Mascot } from "@/components/Mascot";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[#FAFAFA] text-neutral-900 px-6">
      <Mascot mood="oops" className="w-24 h-24" />
      <p className="font-mono text-6xl font-black text-neutral-200">404</p>
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="text-sm text-neutral-500 text-center max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>
      <div className="flex gap-3 mt-2">
        <Link
          href="/"
          className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
        >
          ← Home
        </Link>
        <Link
          href="/courses"
          className="px-5 py-2.5 border border-neutral-300 text-sm font-semibold rounded-lg hover:bg-neutral-100 transition-colors"
        >
          Courses
        </Link>
      </div>
    </main>
  );
}
