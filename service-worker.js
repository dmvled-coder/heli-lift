const CACHE_NAME = "heli-game-v1"; // 👉 tăng version khi update

const urlsToCache = [
  "./",
  "./index.html",
  "./game.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// 🧩 INSTALL → cache toàn bộ file
self.addEventListener("install", (event) => {
  self.skipWaiting(); // 👉 update ngay
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 🔄 ACTIVATE → xóa cache cũ + dùng bản mới luôn
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim(); // 👉 app mở là dùng bản mới
});

// 🌐 FETCH → ưu tiên cache, fallback offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          return caches.match("./index.html"); // 👉 offline vẫn chạy
        })
      );
    })
  );
});
