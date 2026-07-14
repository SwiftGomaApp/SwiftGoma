const cloudinary = require("cloudinary").v2;

const { env } = require("./env");

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

async function checkCloudinaryConnection(timeoutMs = 3000) {
  const startedAt = Date.now();

  const ping = cloudinary.api.ping();
  const timeout = new Promise((_resolve, reject) => {
    setTimeout(
      () =>
        reject(new Error(`Cloudinary check timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    await Promise.race([ping, timeout]);
    return { connected: true, latencyMs: Date.now() - startedAt, error: null };
  } catch (err) {
    console.error("[cloudinary] Connection check failed:", err.message);
    return { connected: false, latencyMs: null, error: err.message };
  }
}

module.exports = { cloudinary, checkCloudinaryConnection };
