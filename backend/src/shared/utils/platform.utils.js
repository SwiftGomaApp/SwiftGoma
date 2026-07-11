const getPlatform = (req) => {
  const header = (req.headers["x-client-platform"] || "").toLowerCase();
  return header === "mobile" ? "MOBILE" : "WEB";
};

const getDeviceId = (req) => {
  return req.headers["x-device-id"] || null;
};

module.exports = { getPlatform, getDeviceId };
