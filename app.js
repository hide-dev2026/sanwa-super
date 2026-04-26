// ========================================
// 📊 Google Sheets CSV URL
// ========================================
const SALES_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTI_Y9k26KOgoYlZVxD10aPFRiA9_EwD9afFjHHoQiNv0aX1La99VGHRRhMqXVfJKCoJWgEsgiBkFu5/pub?output=csv&gid=0";
const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTI_Y9k26KOgoYlZVxD10aPFRiA9_EwD9afFjHHoQiNv0aX1La99VGHRRhMqXVfJKCoJWgEsgiBkFu5/pub?output=csv&gid=1022873183";
const PRODUCTS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTI_Y9k26KOgoYlZVxD10aPFRiA9_EwD9afFjHHoQiNv0aX1La99VGHRRhMqXVfJKCoJWgEsgiBkFu5/pub?output=csv&gid=142758616";

// ========================================
// 🔔 GAS（購読保存用）
// ========================================
const GAS_DEPLOY_URL = "https://script.google.com/macros/s/AKfycbzNayaMoZRjMtW0flA4UlWCfY6N3A9pIhcnfYfGGDmkS8LdAlvfYtaaNCLA_r_Btvyw/exec";

// ========================================
// 📥 CSV取得
// ========================================
async function fetchCSV(url) {
  const res = await fetch(url);
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
      div.innerHTML = `
        <h3>${name}</h3>
        <p class="price">${price}</p>
      `;
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

    rows.slice(1).forEach(r => {
      const [name, price, img] = r;

      const card = document.createElement("div");
      card.className = "product-item";

      if (img) {
        const imgEl = document.createElement("img");
        imgEl.src = img;
        imgEl.alt = name;
        card.appendChild(imgEl);
      }

      const title = document.createElement("h3");
      title.textContent = name;

      const p = document.createElement("p");
      p.textContent = price;

      card.appendChild(title);
      card.appendChild(p);

      container.appendChild(card);
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
// 🔔 Push通知登録
// ========================================
async function initPush() {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("通知が許可されていません");
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array("BGp9U_uO-3Xh1rHHdGgGH24L3abnjnHd0wkTFTZtAkBCEU1Gkxv01IT911WPmYsOcovvY51ZLp1Gek0RhV6MPmM")
      });
    }

    // GASへ送信
    const res = await fetch(GAS_DEPLOY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "subscribe",
        subscription: subscription
      })
    });

    const result = await res.json();

    if (result.success) {
      alert("通知設定が完了しました");
    } else {
      alert("エラー：" + result.message);
    }

  } catch (err) {
    console.error("Pushエラー:", err);
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
  console.log("ページ読み込み");

  // データ表示
  loadSales();
  loadNotices();
  loadProducts();

  // 通知ボタン
  const btn = document.getElementById("notify-btn");
  if (btn) {
    btn.addEventListener("click", initPush);
  }
});

// ========================================
// 🧱 Service Worker登録
// ========================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sanwa-super/service-worker.js")
      .then(() => console.log("Service Worker登録成功"))
      .catch(err => console.log("Service Worker登録失敗", err));
  });
}