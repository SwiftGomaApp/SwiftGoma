const { UAParser } = require("ua-parser-js");

const LOCATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const locationCache = new Map();

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

function isPrivateOrLocalIp(ipAddress) {
  if (!ipAddress) return true;

  const ip = ipAddress.trim().toLowerCase();

  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true;

  return false;
}

function readCachedLocation(ipAddress) {
  const cached = locationCache.get(ipAddress);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > LOCATION_CACHE_TTL_MS) {
    locationCache.delete(ipAddress);
    return null;
  }
  return cached.label;
}

function cacheLocation(ipAddress, label) {
  locationCache.set(ipAddress, { label, cachedAt: Date.now() });
}

async function getLocationLabel(ipAddress) {
  if (isPrivateOrLocalIp(ipAddress)) {
    return "Unknown location";
  }

  const cached = readCachedLocation(ipAddress);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(ipAddress)}`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return "Unknown location";
    }

    const data = await response.json();
    if (!data.success) {
      return "Unknown location";
    }

    const parts = [data.city, data.region, data.country].filter(Boolean);
    const label = parts.length > 0 ? parts.join(", ") : "Unknown location";
    cacheLocation(ipAddress, label);
    return label;
  } catch {
    return "Unknown location";
  }
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
