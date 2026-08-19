const { getLocale, DEFAULT_LOCALE } = require("./context");

const dictionaries = {
  fr: require("./translations/fr"),
  en: require("./translations/en"),
};

function lookup(dict, key) {
  return key
    .split(".")
    .reduce(
      (node, part) =>
        node && typeof node === "object" ? node[part] : undefined,
      dict,
    );
}

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name)
      ? String(vars[name])
      : match,
  );
}

function t(key, vars) {
  const locale = getLocale();
  const primary = lookup(dictionaries[locale], key);
  if (typeof primary === "string") return interpolate(primary, vars);

  const fallback = lookup(dictionaries[DEFAULT_LOCALE], key);
  if (typeof fallback === "string") return interpolate(fallback, vars);

  return key;
}

module.exports = { t };
