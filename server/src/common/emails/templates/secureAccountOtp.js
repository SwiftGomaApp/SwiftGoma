const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const COPY = {
  en: {
    heading: `Confirm securing your ${BRAND.name} account`,
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    intro:
      "Use this code to confirm you want to secure your account. This will sign you out of every device and require a new password.",
    expiry: (mins) =>
      `This code expires in ${mins} minutes. If you didn't request this, you can safely ignore this email.`,
    subject: (code) => `${code} is your ${BRAND.name} account security code`,
    preheader: (code) => `Your ${BRAND.name} account security code: ${code}`,
    reason: `You're receiving this because a request to secure your ${BRAND.name} account was made.`,
  },
  fr: {
    heading: `Confirmez la sécurisation de votre compte ${BRAND.name}`,
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    intro:
      "Utilisez ce code pour confirmer que vous souhaitez sécuriser votre compte. Cela vous déconnectera de tous les appareils et nécessitera un nouveau mot de passe.",
    expiry: (mins) =>
      `Ce code expire dans ${mins} minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.`,
    subject: (code) => `${code} est votre code de sécurité ${BRAND.name}`,
    preheader: (code) => `Votre code de sécurité ${BRAND.name} : ${code}`,
    reason: `Vous recevez cet e-mail car une demande de sécurisation de votre compte ${BRAND.name} a été effectuée.`,
  },
};

function secureAccountOtpEmail(data) {
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

module.exports = { secureAccountOtpEmail };
