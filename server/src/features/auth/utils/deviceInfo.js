const { UAParser } = require("ua-parser-js");

function parseUserAgent(userAgent) {
  if (!userAgent) {
    return { browser: "Unknown browser", device: "Unknown device" };
  }

  const { browser, os, device } = new UAParser(userAgent).getResult();

  const browserLabel = browser.name
    ? `${browser.name} ${browser.version || ""}`.trim()
    : "Unknown browser";
  const osLabel = os.name ? `${os.name} ${os.version || ""}`.trim() : "";
  const fullBrowserLabel = osLabel
    ? `${browserLabel} on ${osLabel}`
    : browserLabel;

  const deviceLabel =
    device.vendor && device.model
      ? `${device.vendor} ${device.model}`
      : device.type
        ? device.type.charAt(0).toUpperCase() + device.type.slice(1)
        : "Desktop";

  return { browser: fullBrowserLabel, device: deviceLabel };
}

function getLocationLabel(_ipAddress) {
  return "Unknown location";
}

function formatLoginTime(locale = "en") {
  return new Date().toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

module.exports = { parseUserAgent, getLocationLabel, formatLoginTime };
