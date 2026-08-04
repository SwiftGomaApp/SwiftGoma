export function detectLocale(): "fr" | "en" {
  if (typeof window === "undefined") return "fr";
  const lang = navigator.language.toLowerCase();
  return lang.startsWith("en") ? "en" : "fr";
}
