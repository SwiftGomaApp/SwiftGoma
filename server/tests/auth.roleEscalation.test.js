process.env.NODE_ENV = "test";

jest.mock("../src/features/auth/config/google.config", () => ({
  verifyGoogleIdToken: jest.fn(),
}));
jest.mock("../src/common/emails", () => ({
  sendOtpLoginEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetOtpEmail: jest.fn().mockResolvedValue(true),
  loginDetectedEmail: jest.fn(() => ({ subject: "Test", html: "<p>test</p>" })),
  passwordChangedEmail: jest.fn(() => ({
    subject: "Test",
    html: "<p>test</p>",
  })),
  twoFactorChangedEmail: jest.fn(() => ({
    subject: "Test",
    html: "<p>test</p>",
  })),
}));
jest.mock("../src/features/notification/services/notification.service", () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

const {
  verifyGoogleIdToken,
} = require("../src/features/auth/config/google.config");
const authService = require("../src/features/auth/services/auth.service");
const { getPrismaClient } = require("../src/config/prisma");

const prisma = getPrismaClient();
const RUN_ID = `role-escalation-${Date.now()}`;
const createdUserIds = [];

function mockGoogleProfile(suffix) {
  verifyGoogleIdToken.mockResolvedValue({
    googleId: `google-${RUN_ID}-${suffix}`,
    email: `${RUN_ID}-${suffix}@example.com`,
    emailVerified: true,
    name: `Google Test User ${suffix}`,
    avatarUrl: null,
  });
}

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  for (const userId of createdUserIds) {
    await prisma.userEmail.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  }
  await prisma.$disconnect();
});

describe("registerWithGoogle role assignment", () => {
  test("registering with no role defaults to BUYER", async () => {
    mockGoogleProfile("default-role");

    const result = await authService.registerWithGoogle({
      idToken: "fake-token",
      role: undefined,
      userAgent: "jest",
      ipAddress: "127.0.0.1",
      deviceName: "jest-runner",
    });

    createdUserIds.push(result.user.id);
    expect(result.user.role).toBe("BUYER");
  });

  test("registering with role=SELLER is honored (legitimate self-assignable role)", async () => {
    mockGoogleProfile("seller-role");

    const result = await authService.registerWithGoogle({
      idToken: "fake-token",
      role: "SELLER",
      userAgent: "jest",
      ipAddress: "127.0.0.1",
      deviceName: "jest-runner",
    });

    createdUserIds.push(result.user.id);
    expect(result.user.role).toBe("SELLER");
  });

  test("registering with role=ADMIN is rejected — cannot self-escalate to admin via Google OAuth", async () => {
    mockGoogleProfile("admin-role-attempt");

    await expect(
      authService.registerWithGoogle({
        idToken: "fake-token",
        role: "ADMIN",
        userAgent: "jest",
        ipAddress: "127.0.0.1",
        deviceName: "jest-runner",
      }),
    ).rejects.toMatchObject({ code: "ROLE_NOT_SELF_ASSIGNABLE" });

    // Confirm no privileged account was actually created.
    const created = await prisma.user.findFirst({
      where: {
        emails: { some: { email: `${RUN_ID}-admin-role-attempt@example.com` } },
      },
    });
    expect(created).toBeNull();
  });

  test("registering with role=SUPPORT is rejected — cannot self-escalate to support via Google OAuth", async () => {
    mockGoogleProfile("support-role-attempt");

    await expect(
      authService.registerWithGoogle({
        idToken: "fake-token",
        role: "SUPPORT",
        userAgent: "jest",
        ipAddress: "127.0.0.1",
        deviceName: "jest-runner",
      }),
    ).rejects.toMatchObject({ code: "ROLE_NOT_SELF_ASSIGNABLE" });
  });

  test("registering with an arbitrary/malicious role string is rejected", async () => {
    mockGoogleProfile("hacker-role-attempt");

    await expect(
      authService.registerWithGoogle({
        idToken: "fake-token",
        role: "SUPER_ADMIN_HACKER",
        userAgent: "jest",
        ipAddress: "127.0.0.1",
        deviceName: "jest-runner",
      }),
    ).rejects.toMatchObject({ code: "ROLE_NOT_SELF_ASSIGNABLE" });
  });
});

describe("createAccount (password signup) role assignment — regression guard", () => {
  test("still rejects ADMIN/SUPPORT (pre-existing protection, must not regress)", async () => {
    await expect(
      authService.createAccount({
        name: "Password Signup Test",
        email: `${RUN_ID}-password-admin@example.com`,
        role: "ADMIN",
      }),
    ).rejects.toMatchObject({ code: "ROLE_NOT_SELF_ASSIGNABLE" });
  });

  test("defaults to BUYER when role omitted", async () => {
    const result = await authService.createAccount({
      name: "Password Signup Test",
      email: `${RUN_ID}-password-default@example.com`,
    });
    createdUserIds.push(result.id);
    expect(result.role).toBe("BUYER");
  });
});
