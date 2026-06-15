---
name: Vite Fast-Refresh transient runtime errors
description: Why "must be used within Provider" / "Invalid hook call" errors appear mid-edit in this React+Vite app but vanish on full reload
---

Adding a NON-component export (a type, const map, plain function, or a second component/hook) to a file that already exports a React component/hook makes Vite's React plugin give up on Fast Refresh for that module. The console shows `Could not Fast Refresh ("X" export is incompatible)` followed, sometimes, by transient runtime errors like `useI18n must be used within LanguageProvider` or `Invalid hook call` originating from unrelated components (e.g. TopBar).

**Why:** During the failed partial HMR the module is briefly re-evaluated outside the provider tree, so context hooks throw until the next full page reload re-instantiates providers correctly. These are NOT real bugs in the edited code.

**How to apply:** When you see these errors *interleaved with HMR `hot updated`/`invalidate` log lines right after you added an export*, do not chase them. Confirm health with a fresh page load (screenshot the app at `/`) — a clean login render means the errors were transients. Only investigate if they persist on a cold load or appear in typecheck. Common in exam-system.tsx / i18n.tsx where shared symbols are exported alongside components.
