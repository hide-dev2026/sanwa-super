// ========================================
// ページ表示制御
// showPage() は id を受け取り対象の .page を表示、他は非表示にする。
// 以前は "product" 詳細ページがあったが現在は使わないため該当処理を削除。
// ヘッダタイトルの書き換えもここで行う。
// ========================================
function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.style.display = 'none');

  // 指定されたページ要素があれば表示
  const target = document.getElementById(pageId);
  if (target) {
    target.style.display = 'block';
  }

  // ヘッダタイトル更新
  const header = document.getElementById('header-title');
  if (pageId === 'home') {
    header.textContent = '生鮮館　三和スーパー';
  } else if (pageId === 'store') {
    header.textContent = 'お店情報';
  }
}

// ========================================
// プッシュ通知の初期化
// ========================================
// DOM のロード後にボタンを取得し、イベントを設定する。
window.addEventListener('load', () => {
  const notifyBtn = document.getElementById('notify-btn');
  if (!notifyBtn) return; // 念のため存在確認

  notifyBtn.addEventListener('click', async () => {
    if (!('Notification' in window)) {
      alert('このブラウザは通知に対応していません');
      return;
    }

    // すでに拒否されている場合は再リクエストできない
    if (Notification.permission === 'denied') {
      alert('通知は既に拒否されています。ブラウザの設定をご確認ください。');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('通知が有効になりました！', {
        body: '新着特売情報をお知らせします。',
      });
    } else {
      alert('通知が許可されませんでした');
    }
  });
});

// ========================================
// Google Sheets から CSV を取得し DOM に反映するヘルパー
// ========================================
async function fetchCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const text = await res.text();
  return text.trim().split('\n').map(line => line.split(',').map(cell => cell.trim()));
}

async function loadSales() {
  try {
    const rows = await fetchCSV('https://docs.google.com/spreadsheets/d/e/2PACX-1vTI_Y9k26KOgoYlZVxD10aPFRiA9_EwD9afFjHHoQiNv0aX1La99VGHRRhMqXVfJKCoJWgEsgiBkFu5/pub?output=csv&gid=0');
    const container = document.getElementById('sales-list');
    container.innerHTML = '';
    rows.slice(1).forEach(r => {
      const [name, price] = r;
      const div = document.createElement('div');
      div.className = 'sale-item';
      div.innerHTML = `<span class="name">${name}</span><span class="price">${price}</span>`;
      container.appendChild(div);
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadNotices() {
  try {
    const rows = await fetchCSV('https://docs.google.com/spreadsheets/d/e/2PACX-1vTI_Y9k26KOgoYlZVxD10aPFRiA9_EwD9afFjHHoQiNv0aX1La99VGHRRhMqXVfJKCoJWgEsgiBkFu5/pub?output=csv&gid=1022873183');
    const container = document.getElementById('notice-list');
    container.innerHTML = '';
    rows.slice(1).forEach(r => {
      const p = document.createElement('p');
      p.textContent = r.join(' ');
      container.appendChild(p);
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadProducts() {
  try {
    const rows = await fetchCSV('https://docs.google.com/spreadsheets/d/e/2PACX-1vTI_Y9k26KOgoYlZVxD10aPFRiA9_EwD9afFjHHoQiNv0aX1La99VGHRRhMqXVfJKCoJWgEsgiBkFu5/pub?output=csv&gid=142758616');
    const container = document.getElementById('product-list');
    container.innerHTML = '';
    rows.slice(1).forEach(r => {
      const [name, price, img] = r;
      const card = document.createElement('div');
      card.className = 'card';
      if (img) {
        const imgEl = document.createElement('img');
        imgEl.src = img;
        imgEl.alt = name;
        card.appendChild(imgEl);
      }
      const p = document.createElement('p');
      p.textContent = `${name} ${price}`;
      card.appendChild(p);
      container.appendChild(card);
    });
  } catch (e) {
    console.error(e);
  }
}

// ページロード時にデータを読み込む
window.addEventListener('load', () => {
  loadSales();
  loadNotices();
  loadProducts();
});

// ========================================
// PWA 機能の初期化
// ページ読み込み時に service-worker.js を登録し、
// オフライン対応やプッシュの受信ができるようにする。
// ========================================
if('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('Service Worker登録成功'))
      .catch(err => console.log('Service Worker登録失敗', err));
  });
}

// 通知購読処理
async function subscribeUser() {
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array("BGp9U_uO-3Xh1rHHdGgGH24L3abnjnHd0wkTFTZtAkBCEU1Gkxv01IT911WPmYsOcovvY51ZLp1Gek0RhV6MPmM")
  });

  console.log("購読情報:", JSON.stringify(subscription));

  // 後で作る GAS に送信
  sendSubscriptionToServer(subscription);
}

// GAS に購読情報を送信（仮）
async function sendSubscriptionToServer(subscription) {
  await fetch("Ghttps://script.google.com/macros/s/AKfycbzlZzU27giROzGU0Y95KS6siq53a-tULOdnCpNK-VPEV4DooPH1nqXxspXnwoR50uwd/exec", {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

// 通知ボタンと連動
document.getElementById("notifyButton").addEventListener("click", async () => {
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    subscribeUser();
  } else {
    alert("通知が許可されませんでした");
  }
});
