const CACHE_NAME = "helicopter-game-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/game.js",
  "/icon-192.png",
  "/icon-512.png"
];

// Cache khi cài
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Load từ cache nếu offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});