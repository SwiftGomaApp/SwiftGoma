const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const COPY = {
  en: {
    subject: `New sign-in detected on your ${BRAND.name} account`,
    preheader: (location) =>
      `New sign-in to your ${BRAND.name} account from ${location}.`,
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    intro: (email) =>
      `Your ${BRAND.name} account <strong>${email}</strong> was recently signed in from a new location, device, or browser:`,
    location: "Location:",
    time: "Time:",
    browser: "Browser:",
    device: "Device:",
    ip: "IP:",
    dontRecognize:
      "<strong>Don't recognize this activity?</strong> Review your recent activity below and secure your account.",
    ctaText: "Review recent activity",
    reason:
      "This alert triggers when we detect a sign-in from an unrecognized location, device, or browser. Common causes: traveling, a VPN, or a new browser.",
  },
  fr: {
    subject: `Nouvelle connexion détectée sur votre compte ${BRAND.name}`,
    preheader: (location) =>
      `Nouvelle connexion à votre compte ${BRAND.name} depuis ${location}.`,
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    intro: (email) =>
      `Votre compte ${BRAND.name} <strong>${email}</strong> a été récemment connecté depuis un nouvel emplacement, appareil ou navigateur :`,
    location: "Emplacement :",
    time: "Heure :",
    browser: "Navigateur :",
    device: "Appareil :",
    ip: "IP :",
    dontRecognize:
      "<strong>Vous ne reconnaissez pas cette activité ?</strong> Consultez votre activité récente ci-dessous et sécurisez votre compte.",
    ctaText: "Consulter l'activité récente",
    reason:
      "Cette alerte se déclenche lorsque nous détectons une connexion depuis un emplacement, un appareil ou un navigateur non reconnu. Causes courantes : déplacement, VPN, ou nouveau navigateur.",
  },
};

function loginDetectedEmail(data) {
  const {
    name,
    email,
    location,
    time,
    browser,
    device,
    ip,
    reviewActivityUrl,
    locale = "en",
  } = data;
  const t = COPY[locale] || COPY.en;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0 0 16px 0;">${t.intro(email)}</p>
    <p style="margin: 0 0 4px 0;"><strong>${t.location}</strong> ${location}</p>
    <p style="margin: 0 0 4px 0;"><strong>${t.time}</strong> ${time}</p>
    <p style="margin: 0 0 4px 0;"><strong>${t.browser}</strong> ${browser}</p>
    <p style="margin: 0 0 4px 0;"><strong>${t.device}</strong> ${device}</p>
    <p style="margin: 0 0 16px 0;"><strong>${t.ip}</strong> ${ip}</p>
    <p style="margin: 0;">${t.dontRecognize}</p>
  `;

  const html = renderEmailLayout({
    preheader: t.preheader(location),
    heading: t.subject,
    bodyHtml,
    cta: { text: t.ctaText, url: reviewActivityUrl },
    reason: t.reason,
    locale,
  });

  return { subject: t.subject, html };
}

module.exports = { loginDetectedEmail };
