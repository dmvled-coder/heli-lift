const CACHE_NAME = "heli-game-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/game.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// Cài đặt
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Lấy dữ liệu
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
