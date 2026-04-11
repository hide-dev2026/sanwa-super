const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// 管理画面（admin.html）から呼び出す通知送信API
exports.sendNotification = functions.https.onCall(async (data, context) => {
  const token = data.token;
  const title = data.title;
  const body = data.body;

  console.log("sendNotification呼び出し:", { token: token?.substring(0, 20) + "...", title, body });

  if (!token) {
    console.error("エラー: Token is missing");
    throw new functions.https.HttpsError("invalid-argument", "Token is missing");
  }

  if (!title || !body) {
    console.error("エラー: Title or body is missing");
    throw new functions.https.HttpsError("invalid-argument", "Title or body is missing");
  }

  const message = {
    token: token,
    notification: {
      title: title,
      body: body
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("通知送信成功:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("通知送信エラー:", error);
    throw new functions.https.HttpsError("internal", `Failed to send notification: ${error.message}`);
  }
});
