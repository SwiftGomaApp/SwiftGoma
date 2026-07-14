const africastalking = require("africastalking");

const { env } = require("./env");

let client = null;

function getSmsClient() {
  if (!client) {
    client = africastalking({
      apiKey: env.africastalking.apiKey,
      username: env.africastalking.username,
    });
  }
  return client;
}

async function sendSms({ to, message }) {
  const sms = getSmsClient().SMS;
  return sms.send({
    to: Array.isArray(to) ? to : [to],
    message,
    ...(env.africastalking.senderId && {
      senderId: env.africastalking.senderId,
    }),
  });
}

async function checkSmsConnection(timeoutMs = 5000) {
  const startedAt = Date.now();
  const application = getSmsClient().APPLICATION;

  const check = application.fetchApplicationData();
  const timeout = new Promise((_resolve, reject) => {
    setTimeout(
      () => reject(new Error(`SMS check timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    await Promise.race([check, timeout]);
    return { connected: true, latencyMs: Date.now() - startedAt, error: null };
  } catch (err) {
    console.error(
      "[sms] Africa's Talking connection check failed:",
      err.message,
    );
    return { connected: false, latencyMs: null, error: err.message };
  }
}

module.exports = { getSmsClient, sendSms, checkSmsConnection };
