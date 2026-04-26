const CACHE_NAME = 'simple-pwa-cache-v6';
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

  // 👉 WorkerのURLはキャッシュ処理しない
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

// プッシュ通知の受信
self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : {};
  const url = new URL(event.request.url);

  self.registration.showNotification(data.title || "新しい通知", {
    body: data.body || "内容がありません",
    icon: "/sanwa-super/sanwa_super_icon_192.png"
  });

    // ★ Worker除外
  if (url.hostname.includes('workers.dev')) {
    event.respondWith(fetch(event.request));
    return;
  }
  // ★ GAS除外（これ重要）
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ★ Google Spreadsheet系も除外（超重要）
  if (url.hostname.includes('googleusercontent.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request);
    })
  );

  if (url.hostname.includes('docs.google.com')) {
  event.respondWith(fetch(event.request));
  return;
}
});
