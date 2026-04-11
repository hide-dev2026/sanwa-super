const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// 管理画面（admin.html）から呼び出す通知送信API
exports.sendNotification = functions.https.onCall(async (data, context) => {
  const token = data.token;
  const title = data.title;
  const body = data.body;

  if (!token) {
    throw new functions.https.HttpsError("invalid-argument", "Token is missing");
  }

  const message = {
    token: token,
    notification: {
      title: title,
      body: body
    }
  };

  await admin.messaging().send(message);

  return { success: true };
});
