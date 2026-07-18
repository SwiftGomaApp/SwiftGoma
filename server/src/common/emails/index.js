const { sendMail } = require("../../config/mailer");
const { loginDetectedEmail } = require("./templates/loginDetected");
const { otpLoginEmail } = require("./templates/otpLogin");
const { paymentReceiptEmail } = require("./templates/paymentReceipt");
const { subscriptionEmail } = require("./templates/subscription");
const { newsEmail } = require("./templates/news");
const { passwordResetOtpEmail } = require("./templates/passwordReset");
const { passwordChangedEmail } = require("./templates/passwordChanged");
const { twoFactorChangedEmail } = require("./templates/twoFactorChanged");
const { phoneChangedEmail } = require("./templates/phoneChanged");
const { accountDeletionEmail } = require("./templates/accountDeletion");
const { accountRecoveryOtpEmail } = require("./templates/accountRecoveryOtp");
const { accountStatusEmail } = require("./templates/accountStatus");
const { sessionsRevokedEmail } = require("./templates/sessionsRevoked");

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

async function sendPasswordResetOtpEmail(to, data) {
  const { subject, html } = passwordResetOtpEmail(data);
  return sendMail({ to, subject, html });
}

async function sendPasswordChangedEmail(to, data) {
  const { subject, html } = passwordChangedEmail(data);
  return sendMail({ to, subject, html });
}

async function sendTwoFactorChangedEmail(to, data) {
  const { subject, html } = twoFactorChangedEmail(data);
  return sendMail({ to, subject, html });
}

async function sendPhoneChangedEmail(to, data) {
  const { subject, html } = phoneChangedEmail(data);
  return sendMail({ to, subject, html });
}

async function sendAccountDeletionEmail(to, data) {
  const { subject, html } = accountDeletionEmail(data);
  return sendMail({ to, subject, html });
}

async function sendAccountRecoveryOtpEmail(to, data) {
  const { subject, html } = accountRecoveryOtpEmail(data);
  return sendMail({ to, subject, html });
}

async function sendAccountStatusEmail(to, data) {
  const { subject, html } = accountStatusEmail(data);
  return sendMail({ to, subject, html });
}

async function sendSessionsRevokedEmail(to, data) {
  const { subject, html } = sessionsRevokedEmail(data);
  return sendMail({ to, subject, html });
}

module.exports = {
  sendLoginDetectedEmail,
  sendOtpLoginEmail,
  sendPaymentReceiptEmail,
  sendSubscriptionEmail,
  sendNewsEmail,
  sendPasswordResetOtpEmail,
  sendPasswordChangedEmail,
  sendTwoFactorChangedEmail,
  sendPhoneChangedEmail,
  sendAccountDeletionEmail,
  sendAccountRecoveryOtpEmail,
  loginDetectedEmail,
  otpLoginEmail,
  paymentReceiptEmail,
  subscriptionEmail,
  newsEmail,
  passwordResetOtpEmail,
  passwordChangedEmail,
  twoFactorChangedEmail,
  phoneChangedEmail,
  accountDeletionEmail,
  accountRecoveryOtpEmail,
  sendAccountStatusEmail,
  sendSessionsRevokedEmail,
};
