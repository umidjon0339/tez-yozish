# Auth — Firebase SSO with edify-student

tez-yozish does **not** host its own login UI. It shares the Firebase Auth
project of the parent app *edify-student* (project id `scanqr-64512`, one
shared account pool) and receives sessions via a custom-token SSO hand-off.

## Flow

1. Signed-out user clicks **Log in / Sign up** in the NavBar →
   `window.location.assign(edifyAuthUrl("login" | "signup"))`.
2. `edifyAuthUrl(page)` (`lib/auth.ts`) builds
   `${NEXT_PUBLIC_EDIFY_URL}/auth/${page}?returnTo=<origin>/auth/callback`.
   Env fallback is `http://localhost:3001` (dev); production is
   `https://edify.uz` (`.env.local`).
3. edify-student authenticates the user, mints a **custom token**, and
   redirects back to `/auth/callback#sso_token=<token>` — the token rides
   the **URL fragment**, so it is never sent to any server.
4. `app/auth/callback/page.tsx` parses the fragment, immediately strips it
   via `history.replaceState`, then calls `signInWithSsoToken(token)`
   (`signInWithCustomToken`). Success → `router.replace("/")`; failure →
   localized error with a "Try again" link back to edify login. A
   `cancelled` flag guards the async result after unmount.
5. From then on Firebase persists the session locally;
   `onAuthStateChanged` restores it on revisit.

## Modules

- **`lib/firebase.ts`** — standard modular init, idempotent
  (`getApps().length ? getApp() : initializeApp`). Config entirely from
  `NEXT_PUBLIC_FIREBASE_*` env vars (see `.env.local`). Exports `auth`.
- **`lib/auth.ts`** — module-singleton external store (same
  `useSyncExternalStore` idiom as `lib/locale.tsx`):
  - `useAuth(): { user: User | null, ready: boolean }` — `ready` stays
    false until Firebase has restored or ruled out a session. The
    `onAuthStateChanged` subscription starts lazily on first subscribe.
  - `logout()` → `signOut(auth)`.
  - `signInWithSsoToken(token)` → `signInWithCustomToken(auth, token)`.
  - `edifyAuthUrl(page)` as above.
- **`components/UserMenu.tsx`** — signed-in dropdown (avatar/initial, first
  name, chevron; panel with full name, email, localized Log out). Same
  hover-open + outside-click/Escape pattern as `LanguageSwitcher`.
- **NavBar gating** — `!ready` → render nothing (prevents flashing "Log in"
  at a signed-in student); `user` → `UserMenu`; else login/signup buttons.

## Invariants

- The SSO token must stay in the URL **fragment** and be stripped from the
  address bar immediately after parsing.
- Auth state is only consumed through `useAuth()` — don't create extra
  `onAuthStateChanged` listeners.
- Gate any auth-dependent UI on `ready` before branching on `user`.
- Firebase config keys are `NEXT_PUBLIC_*` env vars — never hardcode them.
- Roadmap context (see memory / premium initiative): step 1 is this shared
  project + edify-hosted login; step 2 is deeper custom-token SSO. Keep
  `lib/auth.ts` the single integration point.
