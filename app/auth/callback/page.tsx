"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signInWithSsoToken, edifyAuthUrl } from "@/lib/auth";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";

/* SSO landing spot: edify-student redirects here as
   /auth/callback#sso_token=<custom token>. Exchanging the token signs the
   student into the shared account; then we go home. The token arrives in
   the URL fragment (never sent to any server) and is stripped from the
   address bar before we use it. */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get("sso_token");
    window.history.replaceState(null, "", window.location.pathname);
    const attempt = token
      ? signInWithSsoToken(token)
      : Promise.reject(new Error("Missing sso_token"));
    attempt
      .then(() => {
        if (!cancelled) router.replace("/");
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[#FAFAFA] text-neutral-900 px-6">
      {failed ? (
        <>
          <p className="text-sm text-neutral-500 text-center max-w-sm">
            {STR.auth.signInFailed[locale]}
          </p>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => window.location.assign(edifyAuthUrl("login"))}
              className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              {STR.auth.tryAgain[locale]}
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 border border-neutral-300 text-sm font-semibold rounded-lg hover:bg-neutral-100 transition-colors"
            >
              {STR.auth.backHome[locale]}
            </Link>
          </div>
        </>
      ) : (
        <>
          <Loader2 size={28} className="animate-spin text-neutral-400" />
          <p className="text-sm font-medium text-neutral-500">
            {STR.auth.signingIn[locale]}
          </p>
        </>
      )}
    </main>
  );
}
