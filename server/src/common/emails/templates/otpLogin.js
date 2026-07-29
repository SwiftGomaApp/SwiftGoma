const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const COPY = {
  en: {
    heading: `Your ${BRAND.name} login code`,
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    intro: `Use this code to finish signing in to your ${BRAND.name} account:`,
    expiry: (mins) =>
      `This code expires in ${mins} minutes. Don't share it with anyone — ${BRAND.name} will never ask you for this code.`,
    subject: (code) => `${code} is your ${BRAND.name} login code`,
    preheader: (code) => `Your ${BRAND.name} login code: ${code}`,
    reason: `You're receiving this because you requested a login code for your ${BRAND.name} account. If you didn't request this, you can safely ignore this email.`,
  },
  fr: {
    heading: `Votre code de connexion ${BRAND.name}`,
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    intro: `Utilisez ce code pour terminer la connexion à votre compte ${BRAND.name} :`,
    expiry: (mins) =>
      `Ce code expire dans ${mins} minutes. Ne le partagez avec personne — ${BRAND.name} ne vous demandera jamais ce code.`,
    subject: (code) => `${code} est votre code de connexion ${BRAND.name}`,
    preheader: (code) => `Votre code de connexion ${BRAND.name} : ${code}`,
    reason: `Vous recevez cet e-mail car vous avez demandé un code de connexion pour votre compte ${BRAND.name}. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.`,
  },
};

function otpLoginEmail(data) {
  const { name, code, expiresInMinutes, locale = "en" } = data;
  const t = COPY[locale] || COPY.en;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; font-family: ${FONT_FAMILY};">
      ${t.hello(name)}
    </p>

    <p style="margin: 0 0 24px 0; font-family: ${FONT_FAMILY};">
      ${t.intro}
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
      <tr>
        <td
          style="
            background-color: #f5f5f5;
            border-radius: 6px;
            padding: 16px 24px;
            font-family: ${FONT_FAMILY};
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

    <p
      style="
        margin: 0;
        font-family: ${FONT_FAMILY};
        color: ${BRAND.colors.muted};
      "
    >
      ${t.expiry(expiresInMinutes)}
    </p>
  `;

  const html = renderEmailLayout({
    preheader: t.preheader(code),
    heading: t.heading,
    bodyHtml,
    cta: null,
    reason: t.reason,
    locale,
  });

  return {
    subject: t.subject(code),
    html,
  };
}

module.exports = {
  otpLoginEmail,
};
