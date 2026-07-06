# PASAT-G · Deployment Guide (no technical experience needed)

Everything below is free. Total time: about 15 minutes.

## Part 1 — Protect your database (do this first, once)

1. Go to https://console.firebase.google.com and sign in with the Google account that owns the **pasatg-75b45** project, then open that project.
2. In the left menu click **Build → Firestore Database**, then the **Rules** tab.
3. Open the file `firestore.rules` (in this folder) with any text editor, select everything, and copy it.
4. Delete whatever is in the Rules editor on the Firebase page, paste what you copied, and click **Publish**.
5. Still in Firebase: click **Build → Authentication → Settings → Authorized domains**. Make sure the list contains `pasatgv2.netlify.app` and `pasatg-75b45.firebaseapp.com`, and remove anything you don't recognize.
6. On the same Settings page, under **User actions**, turn ON **Email enumeration protection** if it is off.

Your data is now protected even if someone reads your website's source code.

## Part 2 — Deploy the new site to Netlify

**Option A — drag and drop (easiest):**

1. Go to https://app.netlify.com and log in.
2. Open your existing **pasatgv2** site, then click the **Deploys** tab.
3. Drag the entire `pasat-g-v3` folder from your computer onto the page where it says you can drag and drop a site folder.
4. Wait ~30 seconds until it says "Published". Done — the site is live at https://pasatgv2.netlify.app.

**Option B — connect to GitHub (better long-term, enables the commit history):**

1. Create a free account at https://github.com if you don't have one, then create a new repository (e.g. `pasat-g`).
2. Upload all files in `pasat-g-v3` to the repository (GitHub's "Add file → Upload files" works in the browser).
3. In Netlify: **Site configuration → Build & deploy → Link repository**, pick your repo. Build command: leave **empty**. Publish directory: **`.`** (a dot).
4. Every time you edit a file on GitHub, Netlify redeploys automatically.

## Part 3 — Check that everything works (2 minutes)

1. Open https://pasatgv2.netlify.app in a private/incognito window.
2. Sign in (or create an account). You should see the banner "Connected to centralized cloud storage" — not a warning banner.
3. Enter a test participant with a few trial scores and press **SAVE PARTICIPANT**.
4. Sign in on a second device with a Pro-activated account — the record should appear there too.
5. Try "Forgot your password? Reset it by email" on the sign-in screen — you should receive an email within a minute.

If you ever see "⚠️ Cloud access denied", it means Part 1 step 4 wasn't published — redo it.

## Everyday things

- **Change a setting** (admin email, analytics, etc.): edit `config.js` and redeploy (Option A: drag the folder again).
- **Create Pro unlock codes**: double-click `tools/keygen.html` on your computer, paste the `LICENSE_SALT` value from `config.js`, click Generate. This page is intentionally not reachable on the live site.
- **Delete all research data**: sign in as jaycarlobagayas@gmail.com and use the Clear All button. No other account can do this — the database itself refuses.
- **Enable visitor statistics** (optional): create a free account at https://www.goatcounter.com, choose a site code (e.g. `pasatg`), put it in `config.js` as `GOATCOUNTER_CODE = "pasatg"`, redeploy. View stats at `pasatg.goatcounter.com`.

## What you never need to pay for

Netlify hosting, the login system, the database, password-reset emails, and analytics all run on permanent free plans — no trial periods, no credit card. The audit report (`AUDIT-REPORT.md`) has the exact quota numbers.
