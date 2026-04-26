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
