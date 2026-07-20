const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const COPY = {
  en: {
    heading: `Reset your ${BRAND.name} password`,
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    intro: `Use this code to reset your ${BRAND.name} password:`,
    expiry: (mins) =>
      `This code expires in ${mins} minutes. If you didn't request a password reset, you can safely ignore this email — your password won't be changed.`,
    subject: (code) => `${code} is your ${BRAND.name} password reset code`,
    preheader: (code) => `Your ${BRAND.name} password reset code: ${code}`,
    reason: `You're receiving this because a password reset was requested for your ${BRAND.name} account.`,
  },
  fr: {
    heading: `Réinitialisez votre mot de passe ${BRAND.name}`,
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    intro: `Utilisez ce code pour réinitialiser votre mot de passe ${BRAND.name} :`,
    expiry: (mins) =>
      `Ce code expire dans ${mins} minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité — votre mot de passe ne sera pas modifié.`,
    subject: (code) =>
      `${code} est votre code de réinitialisation ${BRAND.name}`,
    preheader: (code) =>
      `Votre code de réinitialisation ${BRAND.name} : ${code}`,
    reason: `Vous recevez cet e-mail car une réinitialisation de mot de passe a été demandée pour votre compte ${BRAND.name}.`,
  },
};

function passwordResetOtpEmail(data) {
  const { name, code, expiresInMinutes, locale = "en" } = data;
  const t = COPY[locale] || COPY.en;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0 0 24px 0;">${t.intro}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #f5f5f5; border-radius: 6px; padding: 16px 24px;
                    font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold;
                    letter-spacing: 6px; color: ${BRAND.colors.text};">
          ${code}
        </td>
      </tr>
    </table>
    <p style="margin: 0; color: ${BRAND.colors.muted};">${t.expiry(expiresInMinutes)}</p>
  `;

  const html = renderEmailLayout({
    preheader: t.preheader(code),
    heading: t.heading,
    bodyHtml,
    cta: null,
    reason: t.reason,
    locale,
  });

  return { subject: t.subject(code), html };
}

module.exports = { passwordResetOtpEmail };
