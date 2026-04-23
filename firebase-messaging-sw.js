importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBywl9QQ14GJ9zr3AljSF5IN9nIumj5aMk",
  authDomain: "sanwa-super.firebaseapp.com",
  projectId: "sanwa-super",
  messagingSenderId: "826299375113",
  appId: "1:826299375113:web:8fd733d62dcc1def4ba2d8"
});

const messaging = firebase.messaging();

// ★ バックグラウンドメッセージ受信時
messaging.onBackgroundMessage(function(payload) {
  console.log("バックグラウンド通知受信:", payload);
  
  const title = payload.notification?.title || "新しい通知";
  const options = {
    body: payload.notification?.body || "",
    icon: "/sanwa-super/sanwa_super_icon_192.png",
    badge: "/sanwa-super/sanwa_super_icon_192.png"
  };
  
  self.registration.showNotification(title, options);
});
