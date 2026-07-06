/* ============================================================
   PASAT-G configuration
   Separate from the app code so settings can change without
   touching index.html.
   NOTE: A Firebase *web* config is public by design. Security is
   enforced by Firestore security rules (firestore.rules) and the
   authorized-domains list in the Firebase console, NOT by hiding
   these values.
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBHrklbDIMhHXGPA5zJ2EoCgq6jvBlJ8OY",
  authDomain: "pasatg-75b45.firebaseapp.com",
  projectId: "pasatg-75b45",
  storageBucket: "pasatg-75b45.firebasestorage.app",
  messagingSenderId: "96394761068",
  appId: "1:96394761068:web:e64be2adbce88c71e89949"
};

/* Only this account sees the "Clear All" (delete everything) button.
   Must match the email you sign in with, and the admin email inside
   firestore.rules. */
const ADMIN_EMAIL = "jaycarlobagayas@gmail.com";

/* Secret used to generate/validate Pro unlock codes.
   Generate codes with tools/keygen.html (open it on your computer;
   netlify.toml blocks it from the live site). If you change this
   salt, previously issued codes stop working. */
const LICENSE_SALT = "PASATG-YLZTAJO6QSKR0IW34XMB0T12";

/* Free, privacy-friendly analytics (optional).
   1. Create a free account at https://www.goatcounter.com
   2. Put the site code you chose here, e.g. "pasatg"
   Leave empty ("") to disable analytics entirely. */
const GOATCOUNTER_CODE = "";
