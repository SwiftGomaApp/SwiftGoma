process.env.NODE_ENV = "test";

const request = require("supertest");

jest.mock("../src/common/emails", () => ({
  sendOtpLoginEmail: jest.fn().mockResolvedValue(true),
  sendEmailVerificationOtpEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetOtpEmail: jest.fn().mockResolvedValue(true),
  loginDetectedEmail: jest.fn(() => ({
    subject: "Test - New sign-in",
    html: "<p>test</p>",
  })),
  passwordChangedEmail: jest.fn(() => ({
    subject: "Test - Password changed",
    html: "<p>test</p>",
  })),
  twoFactorChangedEmail: jest.fn(() => ({
    subject: "Test - 2FA changed",
    html: "<p>test</p>",
  })),
}));
jest.mock("../src/config/sms", () => ({
  sendSms: jest.fn().mockResolvedValue(true),
  checkSmsConnection: jest
    .fn()
    .mockResolvedValue({ connected: true, latencyMs: 1, error: null }),
}));
jest.mock("../src/features/notification/services/notification.service", () => ({
  createNotification: jest.fn().mockResolvedValue({
    id: "test-notification-id",
    type: "ACCOUNT_SECURITY",
    title: "Test",
    body: "Test",
    data: {},
    isRead: false,
    createdAt: new Date().toISOString(),
  }),
}));
jest.mock("../src/config/sms", () => ({
  sendSms: jest.fn().mockResolvedValue(true),
  checkSmsConnection: jest
    .fn()
    .mockResolvedValue({ connected: true, latencyMs: 1, error: null }),
}));

const createApp = require("../src/app");
const { getPrismaClient } = require("../src/config/prisma");
const {
  sendOtpLoginEmail,
  sendEmailVerificationOtpEmail,
} = require("../src/common/emails");

const app = createApp();
const prisma = getPrismaClient();

const REALISTIC_UA = "Mozilla/5.0 (Linux; Android 13) SwiftgomaTestRunner/1.0";
function req(method, path) {
  return request(app)[method](path).set("User-Agent", REALISTIC_UA);
}

const TEST_EMAIL = `auth-flow-test-${Date.now()}@example.com`;
const TEST_NAME = "Flow Test User";
const TEST_PASSWORD = "FlowTestPassword123";

let accessToken;
let refreshToken;

function getLastSentCode() {
  const lastCall = sendOtpLoginEmail.mock.calls.at(-1);
  return lastCall ? lastCall[1].code : null;
}

function getLastVerificationCode() {
  const lastCall = sendEmailVerificationOtpEmail.mock.calls.at(-1);
  return lastCall ? lastCall[1].code : null;
}

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { emails: { some: { email: TEST_EMAIL.toLowerCase() } } },
  });
  await prisma.$disconnect();
});

describe("Full auth flow", () => {
  test("POST /create-account creates an unverified account", async () => {
    const res = await req("post", "/api/v1/auth/create-account").send({
      name: TEST_NAME,
      email: TEST_EMAIL,
      role: "BUYER",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(TEST_EMAIL.toLowerCase());
    expect(res.body.data.isEmailVerified).toBe(false);
    expect(res.body.data.password).toBeUndefined(); // never leaked
  });

  test("POST /create-account again on the same unverified email resends rather than duplicating", async () => {
    const res = await req("post", "/api/v1/auth/create-account").send({
      name: TEST_NAME,
      email: TEST_EMAIL,
      role: "BUYER",
    });

    expect(res.status).toBe(201);
    const count = await prisma.user.count({
      where: { emails: { some: { email: TEST_EMAIL.toLowerCase() } } },
    });
    expect(count).toBe(1);
  });

  test("POST /verify-email rejects an incorrect code", async () => {
    const res = await req("post", "/api/v1/auth/verify-email").send({
      email: TEST_EMAIL,
      code: "SWG-WRONG1",
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("OTP_INVALID");
  });

  test("POST /verify-email succeeds with the real code", async () => {
    const code = getLastVerificationCode();
    expect(code).toBeTruthy();

    const res = await req("post", "/api/v1/auth/verify-email").send({
      email: TEST_EMAIL,
      code,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.isEmailVerified).toBe(true);
  });

  test("POST /login/request-otp sends a login code", async () => {
    const res = await req("post", "/api/v1/auth/login/request-otp").send({
      email: TEST_EMAIL,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBeTruthy();
  });

  test("POST /login/verify-otp logs in and issues real, usable tokens", async () => {
    const code = getLastSentCode();
    expect(code).toBeTruthy();

    const res = await req("post", "/api/v1/auth/login/verify-otp")
      .set("X-Client-Type", "mobile")
      .send({ email: TEST_EMAIL, code });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  test("GET /me returns the logged-in user's real profile", async () => {
    const res = await req("get", "/api/v1/auth/me").set(
      "Authorization",
      `Bearer ${accessToken}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_EMAIL.toLowerCase());
    expect(res.body.data.hasPassword).toBe(false);
  });

  test("GET /me fails without a token", async () => {
    const res = await req("get", "/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  test("POST /password/create sets a password on the account", async () => {
    const res = await req("post", "/api/v1/auth/password/create")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.hasPassword).toBe(true);
  });

  test("POST /login/password rejects the wrong password", async () => {
    const res = await req("post", "/api/v1/auth/login/password").send({
      email: TEST_EMAIL,
      password: "TotallyWrongPassword999",
    });

    expect(res.status).toBe(401);
  });

  test("POST /login/password logs in with the real password, issuing a NEW session", async () => {
    const res = await req("post", "/api/v1/auth/login/password")
      .set("X-Client-Type", "mobile")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.accessToken).not.toBe(accessToken); // genuinely a new session
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  test("POST /logout revokes the current session", async () => {
    const res = await req("post", "/api/v1/auth/logout").set(
      "Authorization",
      `Bearer ${accessToken}`,
    );

    expect(res.status).toBe(200);
  });

  test("POST /refresh-token fails with that now-revoked session's refresh token", async () => {
    const res = await req("post", "/api/v1/auth/refresh-token")
      .set("X-Client-Type", "mobile")
      .send({ refreshToken });

    expect(res.status).toBe(401);
  });
});
