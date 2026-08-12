export function detectDeviceName() {
  if (typeof navigator === "undefined") return "Device";

  const ua = navigator.userAgent;
  const os = /android/i.test(ua)
    ? "Android"
    : /iphone|ipad/i.test(ua)
      ? "iOS"
      : /mac/i.test(ua)
        ? "Mac"
        : /windows/i.test(ua)
          ? "Windows"
          : /linux/i.test(ua)
            ? "Linux"
            : "Device";

  const browser = /edg/i.test(ua)
    ? "Edge"
    : /chrome/i.test(ua)
      ? "Chrome"
      : /firefox/i.test(ua)
        ? "Firefox"
        : /safari/i.test(ua)
          ? "Safari"
          : "Browser";

  return `${browser} on ${os}`;
}
