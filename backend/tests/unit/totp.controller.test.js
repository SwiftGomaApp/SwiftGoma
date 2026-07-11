jest.mock("../../src/config/db.config", () => ({ prisma: {} }));
jest.mock("../../src/shared/utils/otp.utils", () => ({
  createOtp: jest.fn(),
  verifyOtp: jest.fn(),
}));
jest.mock("../../src/services/email.service", () => ({
  sendOtpEmail: jest.fn(),
}));
jest.mock("../../src/services/sms.service", () => ({ sendOtpSms: jest.fn() }));
jest.mock("../../src/features/auth/services/auth.service", () => ({
  createLoginSession: jest.fn(),
}));
jest.mock("../../src/features/auth/services/totp.service", () => ({
  setupTotp: jest.fn(),
  enableTotp: jest.fn(),
  verifyTotp: jest.fn(),
  disableTotpDirect: jest.fn(),
  disableTotp: jest.fn(),
  regenerateBackupCodesDirect: jest.fn(),
  regenerateBackupCodes: jest.fn(),
}));

const {
  createLoginSession,
} = require("../../src/features/auth/services/auth.service");
const totpService = require("../../src/features/auth/services/totp.service");
const controller = require("../../src/features/auth/controllers/totp.controller");

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

describe("totp.controller — 2FA completion returns a real session", () => {
  beforeEach(() => jest.clearAllMocks());

  test("verifyTotp: completes login, returns user + tokens for mobile", async () => {
    totpService.verifyTotp.mockResolvedValue({
      user: { id: "user1", email: "a@b.com" },
      usedBackupCode: false,
    });
    createLoginSession.mockResolvedValue({
      user: { id: "user1" },
      accessToken: "totp_acc",
      refreshToken: "totp_ref",
    });

    const req = {
      body: { userId: "user1", code: "482913" },
      headers: { "x-client-platform": "mobile" },
    };
    const res = makeRes();
    await controller.verifyTotp(req, res, (e) => {
      throw e;
    });
    await flush();

    expect(res.body.data.accessToken).toBe("totp_acc");
    expect(res.body.data.refreshToken).toBe("totp_ref");
    expect(res.body.data.usedBackupCode).toBe(false);
    expect(createLoginSession).toHaveBeenCalledTimes(1);
  });

  test("verifyTotp: reports usedBackupCode flag correctly", async () => {
    totpService.verifyTotp.mockResolvedValue({
      user: { id: "user1", email: "a@b.com" },
      usedBackupCode: true,
    });
    createLoginSession.mockResolvedValue({ user: { id: "user1" } });

    const req = { body: { userId: "user1", code: "BACKUP01" }, headers: {} };
    const res = makeRes();
    await controller.verifyTotp(req, res, (e) => {
      throw e;
    });
    await flush();

    expect(res.body.data.usedBackupCode).toBe(true);
  });
});
