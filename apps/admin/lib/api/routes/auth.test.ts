import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requestLoginOtp,
  verifyLoginOtp,
  loginWithPassword,
  isRequiresTotp,
  verifyLoginTotp,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
} from "./auth";
import { apiClient } from "@/lib/api/client";

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

function successEnvelope<T>(data: T) {
  return { data: { success: true, data } };
}

describe("auth route functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requestLoginOtp posts the email to /auth/login/request-otp", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      successEnvelope({ message: "sent" }),
    );

    const result = await requestLoginOtp({ email: "a@b.com" });

    expect(apiClient.post).toHaveBeenCalledWith("/auth/login/request-otp", {
      email: "a@b.com",
    });
    expect(result).toEqual({ message: "sent" });
  });

  it("verifyLoginOtp posts email + code to /auth/login/verify-otp", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      successEnvelope({
        user: {},
        accessToken: "x",
        refreshToken: "y",
        sessionId: "z",
      }),
    );

    await verifyLoginOtp({ email: "a@b.com", code: "123456" });

    expect(apiClient.post).toHaveBeenCalledWith("/auth/login/verify-otp", {
      email: "a@b.com",
      code: "123456",
    });
  });

  it("loginWithPassword posts email + password to /auth/login/password", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      successEnvelope({
        user: {},
        accessToken: "x",
        refreshToken: "y",
        sessionId: "z",
      }),
    );

    await loginWithPassword({ email: "a@b.com", password: "secret123" });

    expect(apiClient.post).toHaveBeenCalledWith("/auth/login/password", {
      email: "a@b.com",
      password: "secret123",
    });
  });

  it("verifyLoginTotp posts userId + code (no email) to /auth/login/verify-totp", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      successEnvelope({
        user: {},
        accessToken: "x",
        refreshToken: "y",
        sessionId: "z",
      }),
    );

    await verifyLoginTotp({ userId: "u1", code: "654321" });

    expect(apiClient.post).toHaveBeenCalledWith("/auth/login/verify-totp", {
      userId: "u1",
      code: "654321",
    });
  });

  it("forgotPassword posts email + locale to /auth/forgot-password", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      successEnvelope({ message: "if an account exists..." }),
    );

    await forgotPassword({ email: "a@b.com", locale: "fr" });

    expect(apiClient.post).toHaveBeenCalledWith("/auth/password/forgot", {
      email: "a@b.com",
      locale: "fr",
    });
  });

  it("resetPassword posts email/code/newPassword/locale to /auth/reset-password", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(successEnvelope({}));

    await resetPassword({
      email: "a@b.com",
      code: "123456",
      newPassword: "newpass123",
      locale: "en",
    });

    expect(apiClient.post).toHaveBeenCalledWith("/auth/password/reset", {
      email: "a@b.com",
      code: "123456",
      newPassword: "newpass123",
      locale: "en",
    });
  });

  it("getMe fetches GET /auth/me and unwraps the user", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      successEnvelope({ id: "1", name: "Gael" }),
    );

    const me = await getMe();

    expect(apiClient.get).toHaveBeenCalledWith("/auth/me");
    expect(me).toEqual({ id: "1", name: "Gael" });
  });

  it("logout posts to /auth/logout with no body", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      successEnvelope({ message: "Déconnexion réussie." }),
    );

    await logout();

    expect(apiClient.post).toHaveBeenCalledWith("/auth/logout");
  });
});

describe("isRequiresTotp", () => {
  it("returns true for a { requiresTotp: true, userId } response", () => {
    expect(isRequiresTotp({ requiresTotp: true, userId: "u1" })).toBe(true);
  });

  it("returns false for a normal AuthSession response", () => {
    expect(
      isRequiresTotp({
        user: {},
        accessToken: "x",
        refreshToken: "y",
        sessionId: "z",
      }),
    ).toBe(false);
  });
});
