const vapidPublicKey = "BGp9U_uO-3Xh1rHHdGgGH24L3abnjnHd0wkTFTZtAkBCEU1Gkxv01IT911WPmYsOcovvY51ZLp1Gek0RhV6MPmM";

// ========================================
// Firebase 初期化
// ========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBywl9QQ14GJ9zr3AljSF5IN9nIumj5aMk",
  authDomain: "sanwa-super.firebaseapp.com",
  projectId: "sanwa-super",
  storageBucket: "sanwa-super.firebasestorage.app",
  messagingSenderId: "826299375113",
  appId: "1:826299375113:web:8fd733d62dcc1def4ba2d8",
  measurementId: "G-HFYX2R00SF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========================================
// ページ表示制御
// ========================================
function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.style.display = 'none');

  const target = document.getElementById(pageId);
  if (target) target.style.display = 'block';

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
window.addEventListener('load', () => {
  const notifyBtn = document.getElementById('notify-btn');
  if (!notifyBtn) return;

  notifyBtn.addEventListener('click', async () => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'denied') {
      alert('通知は既に拒否されています。ブラウザの設定をご確認ください。');
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      try {
        new Notification('通知が有効になりました！', {
          body: '新着特売情報をお知らせします。',
        });
      } catch (e) {}

      await subscribeUser();
    }
  });
});

// ========================================
// Google Sheets CSV 読み込み
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

window.addEventListener('load', () => {
  loadSales();
  loadNotices();
  loadProducts();
});

// ========================================
// Service Worker 登録
// ========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sanwa-super/service-worker.js')
      .then(() => console.log('Service Worker登録成功'))
      .catch(err => console.log('Service Worker登録失敗', err));
  });
}

// ========================================
// 通知購読処理
// ========================================
async function subscribeUser() {
  console.log("subscribeUser開始");

  const registration = await navigator.serviceWorker.ready;

  let subscription;

  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
    console.log("新規購読成功");
  } catch (e) {
    console.log("subscribe失敗（既に購読済みの可能性）", e);
    subscription = await registration.pushManager.getSubscription();
  }

  console.log("購読情報:", JSON.stringify(subscription));

  if (!subscription) {
    console.log("購読情報が取得できていません");
    return;
  }

  await sendSubscriptionToServer(subscription);
  console.log("subscribeUser終了");
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ========================================
// ★ Cloudflare → Firestore 保存に変更
// ========================================
async function sendSubscriptionToServer(subscription) {
  console.log("Firestore にトークン保存開始");

  const token = subscription.endpoint;

  try {
    await setDoc(doc(db, "tokens", "user1"), {
      token: token,
      updatedAt: new Date()
    });

    console.log("Firestore 保存成功");
  } catch (e) {
    console.error("Firestore 保存エラー:", e);
  }
}

// ========================================
// PWA インストール処理
// ========================================
let deferredPrompt = null;

window.addEventListener('load', () => {
  const installBtn = document.getElementById('installBtn');
  if (!installBtn) return;

  installBtn.style.display = 'none';

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt 発火');

    e.preventDefault();
    deferredPrompt = e;

    installBtn.style.display = 'block';
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const choiceResult = await deferredPrompt.userChoice;
    console.log(choiceResult.outcome);

    deferredPrompt = null;
    installBtn.style.display = 'none';
  });
});
