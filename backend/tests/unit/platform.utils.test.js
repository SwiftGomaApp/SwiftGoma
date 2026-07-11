const {
  getPlatform,
  getDeviceId,
} = require("../../src/shared/utils/platform.utils");

describe("platform.utils", () => {
  test("getPlatform returns MOBILE for x-client-platform: mobile", () => {
    expect(getPlatform({ headers: { "x-client-platform": "mobile" } })).toBe(
      "MOBILE",
    );
  });

  test("getPlatform is case-insensitive", () => {
    expect(getPlatform({ headers: { "x-client-platform": "Mobile" } })).toBe(
      "MOBILE",
    );
  });

  test("getPlatform defaults to WEB when header absent", () => {
    expect(getPlatform({ headers: {} })).toBe("WEB");
  });

  test("getDeviceId reads x-device-id header", () => {
    const req = { headers: { "x-device-id": "device-uuid-123" } };
    expect(getDeviceId(req)).toBe("device-uuid-123");
  });

  test("getDeviceId returns null when absent", () => {
    expect(getDeviceId({ headers: {} })).toBeNull();
  });
});
