# app/auth/ — SSO callback

Read **`docs/auth.md`** before editing. Login/signup UI lives in the parent
app (edify-student, shared Firebase project `scanqr-64512`); this route only
completes the hand-off.

Hard rules:
- The SSO token arrives in the URL **fragment** (`#sso_token=…`) — parse it
  client-side and strip it with `history.replaceState` immediately; it must
  never reach a server or stay in the address bar.
- Sign-in goes through `signInWithSsoToken` in `lib/auth.ts` — the single
  auth integration point.
- Strings via `STR.auth.*` in all three locales.
