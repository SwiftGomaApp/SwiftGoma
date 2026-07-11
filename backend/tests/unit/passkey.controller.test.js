jest.mock("../../src/config/db.config", () => ({
  prisma: { totp: { findUnique: jest.fn() } },
}));
jest.mock("../../src/shared/utils/cookie.utils", () => ({
  clearAuthCookies: jest.fn(),
}));
jest.mock("../../src/features/auth/services/auth.service", () => ({
  createLoginSession: jest.fn(),
}));
jest.mock("../../src/features/auth/services/passkey.service", () => ({
  verifyAuthentication: jest.fn(),
  getRegistrationOptions: jest.fn(),
  verifyRegistration: jest.fn(),
  getAuthenticationOptions: jest.fn(),
  listPasskeys: jest.fn(),
  requestRemovePasskey: jest.fn(),
  removePasskey: jest.fn(),
}));

const { prisma } = require("../../src/config/db.config");
const {
  createLoginSession,
} = require("../../src/features/auth/services/auth.service");
const passkeyService = require("../../src/features/auth/services/passkey.service");
const controller = require("../../src/features/auth/controllers/passkey.controller");

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

describe("passkey.controller — 2FA gating + dual auth", () => {
  beforeEach(() => jest.clearAllMocks());

  test("verifyAuthentication: TOTP disabled -> creates session with mobile tokens", async () => {
    prisma.totp.findUnique.mockResolvedValue({ isEnabled: false });
    passkeyService.verifyAuthentication.mockResolvedValue({
      id: "user1",
      email: "a@b.com",
    });
    createLoginSession.mockResolvedValue({
      user: { id: "user1" },
      accessToken: "pk_acc",
      refreshToken: "pk_ref",
    });

    const req = {
      body: { credential: { id: "cred1" } },
      headers: { "x-client-platform": "mobile" },
    };
    const res = makeRes();
    await controller.verifyAuthentication(req, res, (e) => {
      throw e;
    });
    await flush();

    expect(res.body.data.accessToken).toBe("pk_acc");
    expect(createLoginSession).toHaveBeenCalledTimes(1);
  });

  test("verifyAuthentication: TOTP ENABLED -> blocks session (bypass fix)", async () => {
    prisma.totp.findUnique.mockResolvedValue({ isEnabled: true });
    passkeyService.verifyAuthentication.mockResolvedValue({
      id: "user1",
      email: "a@b.com",
    });

    const req = { body: { credential: { id: "cred1" } }, headers: {} };
    const res = makeRes();
    await controller.verifyAuthentication(req, res, (e) => {
      throw e;
    });
    await flush();

    expect(res.body.requires2fa).toBe(true);
    expect(createLoginSession).not.toHaveBeenCalled();
  });
});
