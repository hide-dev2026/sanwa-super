// ページ切替
function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.style.display = 'none');
  document.getElementById(pageId).style.display = 'block';

  const header = document.getElementById('header-title');
  const backBtn = document.getElementById('back-btn');

  if(pageId === 'home') {
    header.textContent = 'Sale Info';
    backBtn.style.display = 'none';
  } else if(pageId === 'product') {
    header.textContent = '商品詳細';
    backBtn.style.display = 'inline-block';
  } else if(pageId === 'store') {
    header.textContent = 'お店情報';
    backBtn.style.display = 'inline-block';
  }
}

// 通知ボタン
const notifyBtn = document.getElementById('notify-btn');
notifyBtn.addEventListener('click', async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if(permission === 'granted') {
      new Notification('通知が有効になりました！', {
        body: '新着特売情報をお知らせします。',
      });
    } else {
      alert('通知が許可されませんでした');
    }
  } else {
    alert('このブラウザは通知に対応していません');
  }
});

// PWA: Service Worker登録
if('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('Service Worker登録成功'))
      .catch(err => console.log('Service Worker登録失敗', err));
  });
}