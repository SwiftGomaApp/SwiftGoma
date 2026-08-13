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

const SUCCESS_STATUS_CODES = new Set([100, 101, 102]);

async function sendSms({ to, message }) {
  const sms = getSmsClient().SMS;
  const response = await sms.send({
    to: Array.isArray(to) ? to : [to],
    message,
    ...(env.africastalking.senderId &&
      {

      }),
  });

  const recipients = response?.SMSMessageData?.Recipients || [];
  const failed = recipients.filter(
    (r) => !SUCCESS_STATUS_CODES.has(r.statusCode),
  );

  if (failed.length > 0) {
    const details = failed
      .map((r) => `${r.number}: ${r.status} (code ${r.statusCode})`)
      .join("; ");
    throw new Error(`SMS delivery failed — ${details}`);
  }
  if (recipients.length === 0) {

    throw new Error(
      `SMS delivery failed — no recipients in response: ${JSON.stringify(response)}`,
    );
  }

  return response;
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
