const { sendMail } = require("../../config/mailer");
const { loginDetectedEmail } = require("./templates/loginDetected");
const { otpLoginEmail } = require("./templates/otpLogin");
const { paymentReceiptEmail } = require("./templates/paymentReceipt");
const { subscriptionEmail } = require("./templates/subscription");
const { newsEmail } = require("./templates/news");

async function sendLoginDetectedEmail(to, data) {
  const { subject, html } = loginDetectedEmail(data);
  return sendMail({ to, subject, html });
}

async function sendOtpLoginEmail(to, data) {
  const { subject, html } = otpLoginEmail(data);
  return sendMail({ to, subject, html });
}

async function sendPaymentReceiptEmail(to, data) {
  const { subject, html, attachments } = paymentReceiptEmail(data);
  return sendMail({ to, subject, html, attachments });
}

async function sendSubscriptionEmail(to, data) {
  const { subject, html } = subscriptionEmail(data);
  return sendMail({ to, subject, html });
}

async function sendNewsEmail(to, data) {
  const { subject, html } = newsEmail(data);
  return sendMail({ to, subject, html });
}

module.exports = {
  sendLoginDetectedEmail,
  sendOtpLoginEmail,
  sendPaymentReceiptEmail,
  sendSubscriptionEmail,
  sendNewsEmail,
  loginDetectedEmail,
  otpLoginEmail,
  paymentReceiptEmail,
  subscriptionEmail,
  newsEmail,
};
