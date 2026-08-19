const {
  runWithLocale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
} = require("../i18n/context");

function parseAcceptLanguage(header) {
  if (!header || typeof header !== "string") return null;
  const candidates = header
    .split(",")
    .map((part) => part.trim().split(";")[0].toLowerCase().slice(0, 2))
    .filter(Boolean);
  return candidates.find((lang) => SUPPORTED_LOCALES.includes(lang)) || null;
}

function locale(req, res, next) {
  const fromQuery =
    typeof req.query.lang === "string" &&
    SUPPORTED_LOCALES.includes(req.query.lang)
      ? req.query.lang
      : null;
  const fromHeader =
    typeof req.headers["x-locale"] === "string" &&
    SUPPORTED_LOCALES.includes(req.headers["x-locale"])
      ? req.headers["x-locale"]
      : null;
  const resolved =
    fromQuery ||
    fromHeader ||
    parseAcceptLanguage(req.headers["accept-language"]) ||
    DEFAULT_LOCALE;

  req.locale = resolved;
  runWithLocale(resolved, next);
}

module.exports = { locale };
