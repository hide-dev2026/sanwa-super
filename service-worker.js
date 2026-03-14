const CACHE_NAME = 'simple-pwa-cache-v5';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './apple.jpg',
  './beef.jpg',
];

// インストール
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 古いキャッシュ削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
});

// fetch（キャッシュ優先 + ネットワークフォールバック）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request);
    })
  );
});

// プッシュ通知の受信
self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : {};

  self.registration.showNotification(data.title || "新しい通知", {
    body: data.body || "内容がありません",
    icon: "/icons/icon-192.png" // 実際のパスに合わせて変更
  });
});
