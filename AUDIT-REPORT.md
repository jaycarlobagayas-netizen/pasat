# PASAT-G · Technical Audit & Refactor Report

Site: https://pasatgv2.netlify.app · Audited: July 6, 2026

## 1. Current architecture

PASAT-G is a single-file static web app (`index.html`, 238 KB) deployed on Netlify. It uses the Firebase JS SDK 10.12.2 (compat, from CDN) for email/password authentication and Cloud Firestore for a shared `participants` collection. A "Pro" license system (offline-verified unlock codes) gates Cloud Sync and Research Analytics; free users store data in `localStorage`. A service worker and web manifest provide PWA install/offline support. There is no build step, no server code, and no framework — which is the right architecture for this app.

**Good news first:** nothing in this stack inherently requires paid hosting. Netlify Free serves the static files; Firebase's Spark (free) plan covers Auth (unlimited email/password users) and Firestore (1 GiB storage, 50K reads / 20K writes per day — far above pilot-testing needs). The problems found were configuration, security, and reliability issues that would break or degrade the deployment over time.

## 2. Issues found

**Critical**

- **C1 — Firestore security rules.** The app writes to `participants` from the client. If the database was created in "test mode," its rules expire 30 days after creation, after which every cloud read/write fails silently (`sync error` only in console) and the app appears broken. If rules were instead left fully open, anyone on the internet can read, modify, or delete the entire research dataset without an account. Either state is unacceptable; neither is fixed by code on Netlify. → Fixed with `firestore.rules` (see §3).
- **C2 — Admin "Clear All" enforced client-side only.** `resetAllData()` checks `ADMIN_EMAIL` in JavaScript, which anyone can bypass in the browser console. With permissive rules, any signed-in user could delete every record. → Enforced server-side in `firestore.rules` (delete requires the admin's verified email in the auth token).
- **C3 — `ADMIN_EMAIL` was still the placeholder** (`PASTE_YOUR_ADMIN_EMAIL@example.com`), so no account could ever use admin features. → Set to jaycarlobagayas@gmail.com in `config.js`.
- **C4 — `LICENSE_SALT` was still the default** (`CHANGE_THIS_SECRET_SALT_2026`). Anyone reading the page source could mint valid Pro codes. → Replaced with a random secret; a local key-generator tool is included (`tools/keygen.html`), and the old default salt's codes no longer validate.

**High**

- **H1 — Broken PWA / stale-forever caching.** The deployed `manifest.json` points `start_url` at `./PASAT_G.html`, a file that does not exist on the live site (it was renamed `index.html`), and the service worker pre-caches that same missing file — so `cache.addAll()` rejects, the worker never installs, and offline mode silently never works. Worse, the fetch handler is cache-first for *everything*, including the HTML: any user who did get a cached copy would never receive an update you deploy. → New `manifest.json` (`start_url: "./"`) and a rewritten `service-worker.js`: network-first for the app shell and `config.js` (updates arrive immediately; cache is only an offline fallback), cache-first for immutable assets, versioned cache name, and Firebase/Google API traffic is never intercepted.
- **H2 — 238 KB HTML page.** Three PNG images (~157 KB) were embedded as base64, re-downloaded with every page load and every deploy. → Extracted to `assets/logo.png` and `icons/*`; HTML is now **80 KB** (–66%), and images are cached for a year via `netlify.toml` headers.
- **H3 — Render-blocking scripts.** Three Firebase SDK files loaded synchronously in `<head>`, delaying first paint on slow connections. → Moved to the end of `<body>`, immediately before the app script.

**Medium**

- **M1 — No `netlify.toml`.** No security headers (CSP, X-Frame-Options, nosniff…), no cache policy, no redirect for old `PASAT_G.html` PWA installs. → Added.
- **M2 — Cloud save failures lost data.** If a Firestore write failed, the app showed an alert and discarded the record. → Now falls back to saving the record locally so no participant data is ever lost mid-session.
- **M3 — Cloud permission errors were invisible.** Rules failures logged to console only; testers saw an empty table with no explanation. → A clear in-app banner now appears and the app falls back to local data.
- **M4 — No password recovery.** A tester who forgot their password was locked out permanently. → Added "Forgot your password?" using Firebase's built-in reset email (free, no email service needed).
- **M5 — No analytics.** → Optional GoatCounter integration (free, privacy-friendly, no cookie banner needed). Off by default; enable by setting one value in `config.js`.

## 3. Files changed / added

| File | Status | Purpose |
|---|---|---|
| `index.html` | modified | Images externalized; scripts moved out of head; config extracted; password reset; cloud-error banner; local fallback on failed cloud save; optional analytics loader |
| `config.js` | new | All deploy-specific settings in one place (Firebase config, admin email, license salt, analytics code) |
| `manifest.json` | fixed | `start_url`/`scope` point at the real page; correct theme colors |
| `service-worker.js` | rewritten | Network-first app shell, versioned cache, no stale deployments |
| `netlify.toml` | new | Security headers + CSP, cache policy, `/PASAT_G.html` redirect, blocks `/tools/*` from being served |
| `firestore.rules` | new | Auth-required reads; validated, owner-stamped creates; immutable records; admin-only deletes |
| `firebase.json`, `.firebaserc` | new | Lets you publish the rules with one command (or paste them in the console) |
| `icons/`, `assets/` | new | Extracted PNGs (icon-192, icon-512, apple-touch-icon, logo) |
| `tools/keygen.html` | new | Local Pro-code generator matching the app's validation; never served from the live site |

## 4. Environment variables

This is a build-less static site, so there is no server environment. All deploy-specific values live in **`config.js`** (already filled in — no placeholders):

| Setting | Value | Note |
|---|---|---|
| `FIREBASE_CONFIG` | your `pasatg-75b45` project config | Public by design; safety comes from Firestore rules + authorized domains, not secrecy |
| `ADMIN_EMAIL` | `jaycarlobagayas@gmail.com` | Must match the admin email in `firestore.rules` |
| `LICENSE_SALT` | `PASATG-YLZTAJO6QSKR0IW34XMB0T12` | Secret. Also needed by `tools/keygen.html`. Changing it invalidates all issued codes |
| `GOATCOUNTER_CODE` | `""` (disabled) | Set to your GoatCounter site code to enable free analytics |

No Netlify environment variables are required. Netlify build settings: no build command, publish directory = repository root.

## 5. Cost estimate

| Service | Plan | Usage vs. limit | Cost |
|---|---|---|---|
| Netlify (hosting/CDN/SSL) | Free | ~100 MB bandwidth/mo vs 100 GB | $0 |
| Firebase Auth (email/password + reset emails) | Spark | unlimited email/password users | $0 |
| Cloud Firestore (database) | Spark | pilot ≪ 50K reads / 20K writes / day, 1 GiB | $0 |
| Email notifications (password reset) | Firebase built-in | negligible | $0 |
| GoatCounter (analytics, optional) | Free (non-commercial) | well under limits | $0 |
| **Total** | | | **$0 / month** |

No credit card is required by any of these services. A rough capacity check: one saved participant ≈ 1 write + (readers × 1 read); even 100 testers saving 50 records/day with live sync stays inside the free quota.

## 6. Security review

**Fixed in this refactor:** server-side enforcement of who can read/create/delete data (C1, C2); record immutability for research-data integrity; data validation at the database boundary (score range 0–40, 30-trial array, owner e-mail stamp); secret salt rotation (C4); security headers + CSP; admin tool excluded from the deployed site.

**Accepted / known limitations, with reasoning:**

- The Firebase web config in `config.js` is visible to visitors. This is normal and safe *provided* rules are deployed and Authorized Domains is limited (action A2 below).
- The Pro license check runs client-side, so a determined user can bypass it in dev tools. It gates convenience features, not data security (rules protect the data regardless of Pro status). Moving validation server-side would require Cloud Functions (needs the pay-as-you-go plan) — not worth breaking the $0 requirement.
- Any signed-up user can read the shared research dataset — that matches the app's stated "centralized, shared across all accounts" design. If enrollment should be restricted, say the word and I'll add an email allowlist to the rules.
- Passwords are handled entirely by Firebase Auth (scrypt-hashed, never touch your code). Minimum length 6 is Firebase's floor.

**Recommended console actions (5 minutes, in the deployment guide):** A1 — publish `firestore.rules`; A2 — restrict Authorized Domains to `pasatgv2.netlify.app` and `pasatg-75b45.firebaseapp.com`; A3 — enable email-enumeration protection in Firebase Auth settings; A4 — optionally restrict the API key to your domains in Google Cloud console.

## 7. Git commit messages

```
fix(pwa): correct manifest start_url and rebuild service worker with network-first app shell
perf: extract 157KB of base64 images to cacheable files; move Firebase SDK out of <head>
refactor(config): move Firebase config, admin email, and license salt into config.js
feat(auth): add password reset via Firebase email; show cloud-permission errors in-app
fix(data): keep records locally when a cloud save fails instead of discarding them
security(firestore): add auth-required, validated, admin-delete-only security rules
security(license): rotate default LICENSE_SALT; add local-only Pro key generator tool
chore(netlify): add netlify.toml with security headers, CSP, cache policy, and redirects
feat(analytics): optional GoatCounter integration (free, cookie-less), disabled by default
```
