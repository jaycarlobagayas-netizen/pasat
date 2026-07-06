/* PASAT-G service worker
   v2 strategy:
   - Navigations (the app page) and config.js: NETWORK FIRST, so every
     new deploy reaches users immediately; cached copy is the offline
     fallback.
   - Static assets (icons, logo, CDN fonts/css): CACHE FIRST, they are
     immutable and versioned by the cache name below.
   Bump CACHE_NAME whenever assets change. */
const CACHE_NAME = "pasat-g-v3";
const PRECACHE = [
  "./",
  "./index.html",
  "./config.js",
  "./manifest.json",
  "./assets/logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.8.0/dist/tabler-icons.min.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function networkFirst(request) {
  return fetch(request)
    .then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then((c) => c.put(request, copy));
      return resp;
    })
    .catch(() => caches.match(request).then((m) => m || caches.match("./index.html")));
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((resp) => {
      if (request.method === "GET" && resp && resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, copy));
      }
      return resp;
    });
  });
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Never intercept Firebase/Google API traffic — auth and Firestore
  // handle their own offline behavior.
  if (url.hostname.endsWith("googleapis.com") || url.hostname.endsWith("firebaseapp.com") ||
      url.hostname.endsWith("google.com") || url.hostname.endsWith("gstatic.com") && url.pathname.indexOf("firebasejs") !== -1) {
    return;
  }
  if (event.request.mode === "navigate" || url.pathname.endsWith("/config.js")) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  if (event.request.method === "GET") {
    event.respondWith(cacheFirst(event.request));
  }
});
