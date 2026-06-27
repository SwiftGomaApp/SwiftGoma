const AfricasTalking = require("africastalking");
const { at_api_key, at_username } = require("../config/env.config");

const africastalking = AfricasTalking({
  apiKey: at_api_key,
  username: at_username,
});

const sms = africastalking.SMS;

const sendSms = async ({ to, message }) => {
  const result = await sms.send({
    to: Array.isArray(to) ? to : [to],
    message,
    // from: process.env.AT_SENDER_ID || undefined,
  });

  console.log("AT SMS result:", JSON.stringify(result, null, 2));

  const recipients = result?.SMSMessageData?.Recipients;
  if (!recipients || recipients.length === 0) {
    throw new Error("SMS failed: no recipients in response");
  }

  const recipient = recipients[0];
  if (recipient.status !== "Success") {
    throw new Error(
      `SMS failed: ${recipient.status} — ${recipient.statusCode}`,
    );
  }

  return result;
};

const sendOtpSms = ({ to, code, expiresIn }) => {
  const message = `Votre code SwiftGoma : ${code}. Valable ${expiresIn || "10 minutes"}. Ne le partagez pas.`;
  return sendSms({ to, message });
};

const checkSmsHealth = async () => {
  const result = await africastalking.APPLICATION.fetchApplicationData();
  return !!result?.UserData;
};

module.exports = { sendSms, sendOtpSms, checkSmsHealth };
