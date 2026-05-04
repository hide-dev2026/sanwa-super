// ========================================
// 📊 Google Sheets CSV URL
// ========================================
const SALES_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTI_Y9k26KOgoYlZVxD10aPFRiA9_EwD9afFjHHoQiNv0aX1La99VGHRRhMqXVfJKCoJWgEsgiBkFu5/pub?output=csv&gid=0";
const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTI_Y9k26KOgoYlZVxD10aPFRiA9_EwD9afFjHHoQiNv0aX1La99VGHRRhMqXVfJKCoJWgEsgiBkFu5/pub?output=csv&gid=1022873183";
const PRODUCTS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTI_Y9k26KOgoYlZVxD10aPFRiA9_EwD9afFjHHoQiNv0aX1La99VGHRRhMqXVfJKCoJWgEsgiBkFu5/pub?output=csv&gid=142758616";

// ========================================
// 🔔 GAS（購読保存用）
// ========================================
const GAS_DEPLOY_URL = "https://script.google.com/macros/s/AKfycbxm4pJu4amNHF45LFB4et9KvNuOszduUWQkpIP1PDTMKugNYDHNulFj1YhfsPhx66Lg/exec";

// ========================================
// 📥 CSV取得
// ========================================
async function fetchCSV(url) {
  const res = await fetch(url + "&nocache=" + Date.now());
  const text = await res.text();
  return text.trim().split("\n").map(line => line.split(","));
}

// ========================================
// 🛒 特売情報
// ========================================
async function loadSales() {
  try {
    const rows = await fetchCSV(SALES_CSV_URL);
    const container = document.getElementById("sales-list");
    container.innerHTML = "";

    rows.slice(1).forEach(r => {
      const [name, price] = r;

      const div = document.createElement("div");
      div.className = "sale-item";

      const nameEl = document.createElement("span");
      nameEl.className = "name";
      nameEl.textContent = name;

      const priceEl = document.createElement("span");
      priceEl.className = "price";
      priceEl.textContent = price;

      div.appendChild(nameEl);
      div.appendChild(priceEl);

      container.appendChild(div);
    });

  } catch (e) {
    console.error("特売取得エラー:", e);
  }
}

// ========================================
// 📢 お知らせ
// ========================================
async function loadNotices() {
  try {
    const rows = await fetchCSV(NEWS_CSV_URL);
    const container = document.getElementById("notice-list");
    container.innerHTML = "";

    rows.slice(1).forEach(r => {
      const p = document.createElement("p");
      p.textContent = r.join(" ");
      container.appendChild(p);
    });

  } catch (e) {
    console.error("お知らせ取得エラー:", e);
  }
}

// ========================================
// 📦 商品情報
// ========================================
async function loadProducts() {
  try {
    const rows = await fetchCSV(PRODUCTS_CSV_URL);
    const container = document.getElementById("product-list");
    container.innerHTML = "";

    rows.slice(1).forEach(cols => {
      if (!cols || cols.length < 2) return;

      const name = cols[0]?.trim();
      const price = cols[1]?.trim();

      if (!name || !price) return;

      const priceNumber = parseInt(price.replace(/[^\d]/g, ""), 10);
      const priceFormatted = isNaN(priceNumber)
        ? price
        : priceNumber.toLocaleString("ja-JP");

      const div = document.createElement("div");
      div.className = "product";

      const nameEl = document.createElement("span");
      nameEl.className = "name";
      nameEl.textContent = name;

      const priceEl = document.createElement("span");
      priceEl.className = "price";
      priceEl.textContent = priceFormatted + "円";

      div.appendChild(nameEl);
      div.appendChild(priceEl);

      container.appendChild(div);
    });

  } catch (e) {
    console.error("商品取得エラー:", e);
  }
}
// ========================================
// 📄 ページ切り替え
// ========================================
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.style.display = "none";
  });

  const target = document.getElementById(pageId);
  if (target) target.style.display = "block";
}

// ========================================
// 🔔 Push通知登録（JSONP版）
// ========================================
async function initPush() {
  try {
    console.log("① initPush開始");

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("通知が許可されていません");
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    // ========================================
    // 🔄 ここが重要：古いsubscriptionを必ず破棄
    // ========================================
    const oldSub = await registration.pushManager.getSubscription();
    if (oldSub) {
      console.log("古いsubscriptionを削除");
      await oldSub.unsubscribe();
    }

    // ========================================
    // 🆕 新規subscriptionを作成
    // ========================================
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        "BGp9U_uO-3Xh1rHHdGgGH24L3abnjnHd0wkTFTZtAkBCEU1Gkxv01IT911WPmYsOcovvY51ZLp1Gek0RhV6MPmM"
      )
    });

    console.log("新しいsubscription作成:", subscription);

    // GASへ送信
    sendSubscription(subscription);

  } catch (err) {
    console.error("Pushエラー:", err);
  }
}

async function sendSubscription(subscription) {
  console.log("② POST送信開始");

  const res = await fetch(GAS_DEPLOY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain"
    },
    body: JSON.stringify({
      action: "subscribe",
      subscription: subscription
    })
  });

  const text = await res.text();
  console.log("生レスポンス:", text);

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.warn("JSONパース失敗 → 成功扱いにする");
  }

  // 👇ここがポイント
  if (data.success === false) {
    alert("保存に失敗: " + (data.message || "不明エラー"));
  } else {
    alert("通知設定が完了しました");
  }
}

// ========================================
// 🔑 VAPIDキー変換
// ========================================
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

// ========================================
// 🚀 初期処理
// ========================================
window.addEventListener("load", () => {
  loadSales();
  loadNotices();
  loadProducts();

  const btn = document.getElementById("notify-btn");
  if (btn) btn.addEventListener("click", initPush);
});

// ========================================
// 🧱 Service Worker登録
// ========================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sanwa-super/service-worker.js");
  });
}