const axios = require("axios");
const { env } = require("./env");

const client = axios.create({
  baseURL: env.oneSignal.baseUrl,
  headers: {
    Authorization: `Basic ${env.oneSignal.restApiKey}`,
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// "LivraisonsUrgent" Android channel — created at Android's true
// IMPORTANCE_HIGH (4) so notifications show as a heads-up banner. Verified
// via `adb shell dumpsys notification` against real devices: OneSignal
// dashboard's "High" importance option actually creates the Android channel
// at IMPORTANCE_DEFAULT (3), which never peeks — only "Urgent" produces a
// channel at IMPORTANCE_HIGH (4). Don't "fix" this by switching back to a
// channel configured with "High" without re-verifying via adb.
const ANDROID_CHANNEL_ID = "46df37d6-6f02-4a25-9c5c-960609982e2c";

async function sendPushNotification({ externalUserIds, title, body, data }) {
  if (!externalUserIds?.length) return null;

  try {
    const res = await client.post("/notifications", {
      app_id: env.oneSignal.appId,
      include_external_user_ids: externalUserIds,
      android_channel_id: ANDROID_CHANNEL_ID,
      headings: { en: title, fr: title },
      contents: { en: body, fr: body },
      data: data || {},
      chrome_web_icon:
        "https://res.cloudinary.com/dx3wclabo/image/upload/v1788178502/safari-icon-256x256_gxyvjj.png",
      firefox_icon:
        "https://res.cloudinary.com/dx3wclabo/image/upload/v1788178502/safari-icon-256x256_gxyvjj.png",
    });
    return res.data;
  } catch (err) {
    console.error(
      "[oneSignal] Failed to send push notification:",
      err.response?.data || err.message,
    );
    throw err;
  }
}

async function checkOneSignalConnection() {
  const start = Date.now();
  try {
    await client.get(`/apps/${env.oneSignal.appId}`);
    return { connected: true, latencyMs: Date.now() - start, error: null };
  } catch (err) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

module.exports = { sendPushNotification, checkOneSignalConnection };
