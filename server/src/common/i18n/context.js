const { AsyncLocalStorage } = require("async_hooks");

const DEFAULT_LOCALE = "fr";
const SUPPORTED_LOCALES = ["fr", "en"];

const storage = new AsyncLocalStorage();

function runWithLocale(locale, fn) {
  const safeLocale = SUPPORTED_LOCALES.includes(locale)
    ? locale
    : DEFAULT_LOCALE;
  return storage.run({ locale: safeLocale }, fn);
}

function getLocale() {
  return storage.getStore()?.locale || DEFAULT_LOCALE;
}

module.exports = {
  runWithLocale,
  getLocale,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
};
