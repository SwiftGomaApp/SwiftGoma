jest.mock("../../src/config/db.config", () => ({
  prisma: { totp: { findUnique: jest.fn() } },
}));
jest.mock("../../src/shared/utils/cookie.utils", () => ({
  clearAuthCookies: jest.fn(),
}));
jest.mock("../../src/features/auth/services/auth.service", () => ({
  createLoginSession: jest.fn(),
}));
jest.mock("../../src/features/auth/services/google.service", () => ({
  loginWithGoogle: jest.fn(),
  registerWithGoogle: jest.fn(),
}));
jest.mock("../../src/services/email.service", () => ({
  sendWelcomeEmail: jest.fn(async () => {}),
}));

const { prisma } = require("../../src/config/db.config");
const { clearAuthCookies } = require("../../src/shared/utils/cookie.utils");
const {
  createLoginSession,
} = require("../../src/features/auth/services/auth.service");
const googleService = require("../../src/features/auth/services/google.service");
const controller = require("../../src/features/auth/controllers/google.controller");

const makeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = jest.fn((c) => {
    res.statusCode = c;
    return res;
  });
  res.json = jest.fn((b) => {
    res.body = b;
    return res;
  });
  return res;
};

const flush = () => new Promise((r) => setImmediate(r));

describe("google.controller — 2FA gating + dual auth", () => {
  beforeEach(() => jest.clearAllMocks());

  test("loginWithGoogle: TOTP disabled -> creates session, forwards mobile tokens", async () => {
    prisma.totp.findUnique.mockResolvedValue({ isEnabled: false });
    googleService.loginWithGoogle.mockResolvedValue({
      id: "user1",
      email: "a@b.com",
    });
    createLoginSession.mockResolvedValue({
      user: { id: "user1" },
      accessToken: "acc",
      refreshToken: "ref",
    });

    const req = {
      body: { idToken: "x" },
      headers: { "x-client-platform": "mobile" },
    };
    const res = makeRes();
    await controller.loginWithGoogle(req, res, (e) => {
      throw e;
    });
    await flush();

    expect(createLoginSession).toHaveBeenCalledTimes(1);
    expect(res.body.data.accessToken).toBe("acc");
    expect(res.body.data.refreshToken).toBe("ref");
  });

  test("loginWithGoogle: TOTP ENABLED -> does NOT create a session (bypass fix)", async () => {
    prisma.totp.findUnique.mockResolvedValue({ isEnabled: true });
    googleService.loginWithGoogle.mockResolvedValue({
      id: "user1",
      email: "a@b.com",
    });

    const req = { body: { idToken: "x" }, headers: {} };
    const res = makeRes();
    await controller.loginWithGoogle(req, res, (e) => {
      throw e;
    });
    await flush();

    expect(res.body.requires2fa).toBe(true);
    expect(createLoginSession).not.toHaveBeenCalled();
    expect(clearAuthCookies).toHaveBeenCalledTimes(1);
  });

  test("registerWithGoogle: TOTP enabled on relinked existing account -> requires2fa", async () => {
    prisma.totp.findUnique.mockResolvedValue({ isEnabled: true });
    googleService.registerWithGoogle.mockResolvedValue({
      user: { id: "user2", email: "existing@b.com" },
      isNew: false,
    });

    const req = { body: { idToken: "x", role: "BUYER" }, headers: {} };
    const res = makeRes();
    await controller.registerWithGoogle(req, res, (e) => {
      throw e;
    });
    await flush();

    expect(res.body.requires2fa).toBe(true);
    expect(createLoginSession).not.toHaveBeenCalled();
  });
});
