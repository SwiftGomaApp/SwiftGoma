const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const COPY = {
  en: {
    heading: `Your ${BRAND.name} account has been secured`,
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    intro:
      "As requested, we've signed you out of every device on your account and removed your password.",
    removedTwoFactor:
      "We also removed the two-factor authentication method on your account, in case it wasn't set up by you.",
    removedPasskeys: (count) =>
      count === 1
        ? "We also removed 1 passkey on your account, in case it wasn't added by you."
        : `We also removed ${count} passkeys on your account, in case they weren't added by you.`,
    next: "Use this sign-in link to set a new password and get back in.",
    ctaText: "Sign in",
    reason: `You're receiving this as a security notification for your ${BRAND.name} account.`,
  },
  fr: {
    heading: `Votre compte ${BRAND.name} a été sécurisé`,
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    intro:
      "Comme demandé, nous vous avons déconnecté de tous les appareils et supprimé votre mot de passe.",
    removedTwoFactor:
      "Nous avons également supprimé la méthode d'authentification à deux facteurs de votre compte, au cas où elle n'aurait pas été configurée par vous.",
    removedPasskeys: (count) =>
      count === 1
        ? "Nous avons également supprimé 1 clé d'accès de votre compte, au cas où elle n'aurait pas été ajoutée par vous."
        : `Nous avons également supprimé ${count} clés d'accès de votre compte, au cas où elles n'auraient pas été ajoutées par vous.`,
    next: "Utilisez ce lien de connexion pour définir un nouveau mot de passe.",
    ctaText: "Se connecter",
    reason: `Vous recevez cet e-mail à titre de notification de sécurité pour votre compte ${BRAND.name}.`,
  },
};

function accountSecuredEmail(data) {
  const {
    name,
    signInUrl,
    removedTwoFactor = false,
    removedPasskeysCount = 0,
    locale = "en",
  } = data;
  const t = COPY[locale] || COPY.en;

  const extraLines = [
    removedTwoFactor ? t.removedTwoFactor : null,
    removedPasskeysCount > 0 ? t.removedPasskeys(removedPasskeysCount) : null,
  ]
    .filter(Boolean)
    .map((line) => `<p style="margin: 0 0 16px 0;">${line}</p>`)
    .join("");

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0 0 16px 0;">${t.intro}</p>
    ${extraLines}
    <p style="margin: 0;">${t.next}</p>
  `;

  const html = renderEmailLayout({
    preheader: t.heading,
    heading: t.heading,
    bodyHtml,
    cta: { text: t.ctaText, url: signInUrl },
    reason: t.reason,
    locale,
  });

  return { subject: t.heading, html };
}

module.exports = { accountSecuredEmail };
