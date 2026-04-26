// ========================================
// 📊 データ取得設定
// ========================================
const DATA_GAS_URL = "https://script.google.com/macros/s/AKfycbwwoDYIGjBY0bohpISePnho2tzOlC8WXa6Z_iQMSZ4yQvbdLYv9KDvmzmDWEhWsUMM4/exec";

// ========================================
// 🌐 データ取得と表示
// ========================================
async function loadData() {
  try {
    console.log("📥 データ取得開始...");
    
    const response = await fetch(DATA_GAS_URL + "?action=sale");
    console.log("📬 レスポンス:", response.status);
    
    const result = await response.json();
    console.log("📊 データ:", result);

    if (result.success && result.data) {
      displaySale(result.data.sale || []);
      displayNews(result.data.news || []);
      displayProducts(result.data.products || []);
    } else {
      console.log("❌ エラー:", result.message);
    }
  } catch (err) {
    console.error("❌ データ取得エラー:", err);
  }
}

// ========================================
// 特売情報を表示
// ========================================
function displaySale(items) {
  const container = document.getElementById("sales-list");
  if (!container) return;

  container.innerHTML = "";
  if (!items || items.length === 0) {
    container.innerHTML = "<p>特売情報はありません</p>";
    return;
  }

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "sale-item";
    div.innerHTML = `
      <h3>${item.商品名 || item.title || ""}</h3>
      <p class="price">${item.価格 || item.price || ""}</p>
      <p class="description">${item.説明 || item.description || ""}</p>
    `;
    container.appendChild(div);
  });
}

// ========================================
// お知らせを表示
// ========================================
function displayNews(items) {
  const container = document.getElementById("notice-list");
  if (!container) return;

  container.innerHTML = "";
  if (!items || items.length === 0) {
    container.innerHTML = "<p>お知らせはありません</p>";
    return;
  }

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "notice-item";
    div.innerHTML = `
      <h3>${item.タイトル || item.title || ""}</h3>
      <p>${item.内容 || item.content || ""}</p>
    `;
    container.appendChild(div);
  });
}

// ========================================
// 商品情報を表示
// ========================================
function displayProducts(items) {
  const container = document.getElementById("product-list");
  if (!container) return;

  container.innerHTML = "";
  if (!items || items.length === 0) {
    container.innerHTML = "<p>商品情報は 없습니다</p>";
    return;
  }

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "product-item";
    div.innerHTML = `
      <h3>${item.商品名 || item.name || ""}</h3>
      <p class="price">${item.価格 || item.price || ""}</p>
      <p>${item.説明 || item.description || ""}</p>
    `;
    container.appendChild(div);
  });
}

// ページ読み込み時にデータ取得
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔄 ページ読み込み完了");
  loadData();
});

// ========================================
// ページ切り替え
// ========================================
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.style.display = "none";
  });
  const target = document.getElementById(pageId);
  if (target) {
    target.style.display = "block";
  }
}

// ========================================
// Web Push 初期化（購読情報をGASで管理）
// ========================================
const GAS_DEPLOY_URL = "https://script.google.com/macros/s/AKfycbzNayaMoZRjMtW0flA4UlWCfY6N3A9pIhcnfYfGGDmkS8LdAlvfYtaaNCLA_r_Btvyw/exec";

// ========================================
// プッシュ通知 初期化
// ========================================
async function initPush() {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("通知が許可されていません");
      return;
    }

    // ★ Service Worker 登録確認
    const registration = await navigator.serviceWorker.ready;
    console.log("✓ Service Worker 登録済み");

    // ★ 購読情報を取得
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log("📱 新規購読情報を生成中...");
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array("BGp9U_uO-3Xh1rHHdGgGH24L3abnjnHd0wkTFTZtAkBCEU1Gkxv01IT911WPmYsOcovvY51ZLp1Gek0RhV6MPmM")
      });
    }

    console.log("🔥 購読情報:", subscription);

    // ★ GAS API に購読情報を送信
    const response = await fetch(GAS_DEPLOY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "subscribe",
        subscription: subscription
      })
    });

    const result = await response.json();
    console.log("GAS レスポンス:", result);

    if (result.success) {
      alert("通知設定が完了しました");
    } else {
      alert("エラー: " + result.message);
    }

  } catch (err) {
    console.error("❌ エラー:", err);
    alert("エラーが発生しました: " + err.message);
  }
}

// ★ VAPID キー用のヘルパー関数
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

// ボタン押したら通知許可
window.addEventListener('load', () => {
  const notifyBtn = document.getElementById('notify-btn');
  if (!notifyBtn) return;

  notifyBtn.addEventListener('click', () => {
    initPush();
  });
});

// ========================================
// PWA Service Worker登録
// ========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sanwa-super/service-worker.js')
      .then(() => console.log('Service Worker登録成功'))
      .catch(err => console.log('Service Worker登録失敗', err));
  });
}
