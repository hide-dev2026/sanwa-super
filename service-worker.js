const CACHE_NAME = 'simple-pwa-cache-v7';
const urlsToCache = [
  '/sanwa-super/',
  '/sanwa-super/index.html',
  '/sanwa-super/style.css',
  '/sanwa-super/app.js',
  '/sanwa-super/manifest.json',
  '/sanwa-super/sanwa_super_icon_192.png',
  '/sanwa-super/sanwa_super_icon_512.png'
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
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// fetch（キャッシュ優先 + ネットワークフォールバック）
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Workerは除外
  if (url.hostname.includes('workers.dev')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request);
    })
  );
});

// ========================================
// 🔔 プッシュ通知の受信
// ========================================
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};

  event.waitUntil(
    self.registration.showNotification(
      data.title || "新しい通知",
      {
        body: data.body || "内容がありません",
        icon: "/sanwa-super/sanwa_super_icon_192.png",

        data: {
          url: data.url || "/"
        }
      }
    )
  );
});

// ========================================
// 🔔 通知クリック時の動作
// ========================================
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/sanwa-super/index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {

        // 既に開いているタブがあればそれを使う
        for (let client of windowClients) {
          if (client.url.includes('/sanwa-super/') && 'focus' in client) {
            return client.focus();
          }
        }

        // なければ新規で開く
        return clients.openWindow(urlToOpen);
      })
  );
});
