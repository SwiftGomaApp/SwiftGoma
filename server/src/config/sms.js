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

// Per Africa's Talking's own status codes: 100/101/102 mean the message
// was actually accepted for delivery (processed/sent/queued). Everything
// else (401+) is a real per-recipient failure — RiskHold, InvalidSenderId,
// InsufficientBalance, UserInBlacklist, etc. Critically, the TOP-LEVEL
// API call resolves successfully even when every recipient fails — the
// failure only shows up inside SMSMessageData.Recipients[].statusCode,
// so skipping this check makes a failed send look identical to a
// successful one.
const SUCCESS_STATUS_CODES = new Set([100, 101, 102]);

/**
 * Sends an SMS to one or more recipients. Phone numbers must be in
 * international format (e.g. "+243xxxxxxxxx").
 *
 * @param {object} params
 * @param {string|string[]} params.to
 * @param {string} params.message
 * @returns {Promise<object>} Africa's Talking's raw response, only once
 *   every recipient has actually succeeded — see SUCCESS_STATUS_CODES.
 * @throws {Error} If the API call itself fails, OR if any recipient's
 *   statusCode indicates the message wasn't actually delivered — the
 *   error message includes the real per-recipient status for diagnosis.
 */
async function sendSms({ to, message }) {
  const sms = getSmsClient().SMS;
  const response = await sms.send({
    to: Array.isArray(to) ? to : [to],
    message,
    ...(env.africastalking.senderId &&
      {
        // senderId: env.africastalking.senderId,
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
    // Defensive — shouldn't normally happen, but an empty Recipients
    // array with no thrown error would otherwise look like a silent
    // success too.
    throw new Error(
      `SMS delivery failed — no recipients in response: ${JSON.stringify(response)}`,
    );
  }

  return response;
}

/**
 * Confirms Africa's Talking is reachable and the configured credentials
 * are valid, via a lightweight authenticated call (fetching app info,
 * e.g. balance) rather than sending an actual SMS. Same timeout-guarded
 * pattern as the other checkXConnection functions.
 *
 * @param {number} [timeoutMs=5000]
 */
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
