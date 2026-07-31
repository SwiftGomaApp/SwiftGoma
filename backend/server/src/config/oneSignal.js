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

async function sendPushNotification({ externalUserIds, title, body, data }) {
  if (!externalUserIds?.length) return null;

  try {
    const res = await client.post("/notifications", {
      app_id: env.oneSignal.appId,
      include_external_user_ids: externalUserIds,
      headings: { en: title, fr: title },
      contents: { en: body, fr: body },
      data: data || {},
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
