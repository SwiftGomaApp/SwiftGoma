const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const COPY = {
  en: {
    heading: `Verify your email address`,
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    intro: `Use this code to verify your email address on ${BRAND.name}:`,
    expiry: (mins) =>
      `This code expires in ${mins} minutes. Don't share it with anyone — ${BRAND.name} will never ask you for this code.`,
    subject: (code) => `${code} is your ${BRAND.name} verification code`,
    preheader: (code) => `Your ${BRAND.name} verification code: ${code}`,
    reason: `You're receiving this because this email address was used to sign up or was added to a ${BRAND.name} account. If you didn't request this, you can safely ignore this email.`,
  },
  fr: {
    heading: `Vérifiez votre adresse e-mail`,
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    intro: `Utilisez ce code pour vérifier votre adresse e-mail sur ${BRAND.name} :`,
    expiry: (mins) =>
      `Ce code expire dans ${mins} minutes. Ne le partagez avec personne — ${BRAND.name} ne vous demandera jamais ce code.`,
    subject: (code) => `${code} est votre code de vérification ${BRAND.name}`,
    preheader: (code) => `Votre code de vérification ${BRAND.name} : ${code}`,
    reason: `Vous recevez cet e-mail car cette adresse a été utilisée pour une inscription ou ajoutée à un compte ${BRAND.name}. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.`,
  },
};

function emailVerificationOtpEmail(data) {
  const { name, code, expiresInMinutes, locale = "en" } = data;
  const t = COPY[locale] || COPY.en;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0 0 24px 0;">${t.intro}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
      <tr>
        <td
          style="
            background-color: #f5f5f5;
            border-radius: 6px;
            padding: 16px 24px;
            font-family: 'Courier New', monospace;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            color: ${BRAND.colors.text};
          "
        >
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

module.exports = { emailVerificationOtpEmail };
