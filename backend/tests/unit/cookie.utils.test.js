jest.mock("../../src/config/env.config", () => ({
  jwt_access_secret: "test_access_secret",
  jwt_refresh_secret: "test_refresh_secret",
  jwt_access_expires_in: "15m",
  jwt_refresh_expires_in: "7d",
  node_env: "test",
}));

const {
  getBearerToken,
  getAccessToken,
  getRefreshToken,
} = require("../../src/shared/utils/cookie.utils");

describe("cookie.utils — dual auth token extraction", () => {
  test("getBearerToken extracts token from Authorization header", () => {
    const req = { headers: { authorization: "Bearer abc123" } };
    expect(getBearerToken(req)).toBe("abc123");
  });

  test("getBearerToken returns null when header missing", () => {
    expect(getBearerToken({ headers: {} })).toBeNull();
  });

  test("getBearerToken returns null for non-Bearer scheme", () => {
    const req = { headers: { authorization: "Basic abc123" } };
    expect(getBearerToken(req)).toBeNull();
  });

  test("getAccessToken prefers Bearer header over cookie (mobile priority)", () => {
    const req = {
      headers: { authorization: "Bearer mobile_token" },
      cookies: { swg_access: "web_cookie_token" },
    };
    expect(getAccessToken(req)).toBe("mobile_token");
  });

  test("getAccessToken falls back to cookie when no Bearer header (web)", () => {
    const req = { headers: {}, cookies: { swg_access: "web_cookie_token" } };
    expect(getAccessToken(req)).toBe("web_cookie_token");
  });

  test("getAccessToken returns null when neither present", () => {
    expect(getAccessToken({ headers: {}, cookies: {} })).toBeNull();
  });

  test("getRefreshToken prefers body.refreshToken over cookie (mobile)", () => {
    const req = {
      body: { refreshToken: "mobile_refresh" },
      cookies: { swg_refresh: "web_refresh_cookie" },
    };
    expect(getRefreshToken(req)).toBe("mobile_refresh");
  });

  test("getRefreshToken falls back to cookie (web)", () => {
    const req = { body: {}, cookies: { swg_refresh: "web_refresh_cookie" } };
    expect(getRefreshToken(req)).toBe("web_refresh_cookie");
  });
});
