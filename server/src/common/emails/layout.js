const { BRAND } = require("../constants/brand");

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const FOOTER_TEXT = {
  en: {
    reportIssue: "If you'd like to report an issue, reach out to",
    rights: "All rights reserved.",
  },
  fr: {
    reportIssue: "Pour signaler un problème, contactez",
    rights: "Tous droits réservés.",
  },
};

function renderEmailLayout({
  preheader = "",
  heading,
  bodyHtml,
  cta = null,
  reason,
  locale = "fr",
}) {
  const { colors } = BRAND;
  const t = FOOTER_TEXT[locale] || FOOTER_TEXT.fr;

  const ctaHtml = cta
    ? `
    <tr>
      <td align="center" style="padding: 8px 0 28px 0;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="border-radius: 6px; background-color: ${colors.primary};">
              <a href="${cta.url}"
                 style="display: inline-block; padding: 13px 28px; font-family: ${FONT_FAMILY}; font-size: 15px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">
                ${cta.text}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: ${FONT_FAMILY};">
  <!-- Preheader: hidden, shows as inbox preview text -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table
          role="presentation"
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid ${colors.border}; border-radius: 8px;"
        >

          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 32px 32px 16px 32px;">
              <img
                src="${BRAND.logoUrl}"
                alt="${BRAND.name}"
                height="32"
                style="height: 32px; width: auto; display: block;"
              />
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding: 8px 40px 4px 40px;">
              <h1
                style="margin: 0; font-family: ${FONT_FAMILY}; font-size: 20px; font-weight: bold; color: ${colors.text};"
              >
                ${heading}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td
              style="padding: 12px 40px 20px 40px; font-family: ${FONT_FAMILY}; font-size: 14px; line-height: 1.6; color: ${colors.text};"
            >
              ${bodyHtml}
            </td>
          </tr>

          ${ctaHtml}

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr
                style="border: none; border-top: 1px solid ${colors.border}; margin: 0;"
              />
            </td>
          </tr>

          <!-- Why you're receiving this -->
          <tr>
            <td
              style="padding: 20px 40px 8px 40px; font-family: ${FONT_FAMILY}; font-size: 12px; line-height: 1.5; color: ${colors.muted};"
            >
              ${reason}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              style="padding: 16px 40px 32px 40px; font-family: ${FONT_FAMILY}; font-size: 12px; line-height: 1.6; color: ${colors.muted};"
            >
              ${t.reportIssue}
              <a
                href="mailto:${BRAND.supportEmail}"
                style="color: ${colors.muted}; text-decoration: underline;"
              >
                ${BRAND.supportEmail}
              </a>.
              <br /><br />
              <a
                href="${BRAND.social.instagram}"
                style="color: ${colors.muted}; text-decoration: underline;"
              >
                Instagram
              </a>
              &nbsp;&middot;&nbsp;
              <a
                href="${BRAND.social.facebook}"
                style="color: ${colors.muted}; text-decoration: underline;"
              >
                Facebook
              </a>
              &nbsp;&middot;&nbsp;
              <a
                href="${BRAND.social.tiktok}"
                style="color: ${colors.muted}; text-decoration: underline;"
              >
                TikTok
              </a>
              <br /><br />
              &copy; ${new Date().getFullYear()} ${BRAND.name}. ${t.rights}
              <br />
              ${BRAND.address}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { renderEmailLayout };
