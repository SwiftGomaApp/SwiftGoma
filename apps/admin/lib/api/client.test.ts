import { describe, it, expect, vi, beforeEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient, ApiError } from "./client";

const mock = new MockAdapter(apiClient);

describe("apiClient response interceptor", () => {
  beforeEach(() => {
    mock.reset();
    // refreshAuthSession dedupes real refresh calls within a short window via
    // localStorage — clear it so one test's refresh doesn't suppress the next.
    window.localStorage.clear();
  });

  it("passes successful responses through unchanged", async () => {
    mock.onGet("/ping").reply(200, { success: true, data: { ok: true } });

    const res = await apiClient.get("/ping");

    expect(res.data).toEqual({ success: true, data: { ok: true } });
  });

  it("normalizes a { success: false, error } response into ApiError", async () => {
    mock.onGet("/protected").reply(403, {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Accès refusé.",
        details: null,
        requestId: "req-1",
      },
    });

    await expect(apiClient.get("/protected")).rejects.toMatchObject({
      name: "ApiError",
      code: "FORBIDDEN",
      message: "Accès refusé.",
      status: 403,
    });
  });

  it("always normalizes a 429 into a RATE_LIMITED ApiError, regardless of the response body", async () => {
    mock.onGet("/busy").reply(429, "Too Many Requests"); // not even JSON

    const err = await apiClient.get("/busy").catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.status).toBe(429);
  });

  it("rejects with the raw error (not ApiError) when there's no HTTP response at all", async () => {
    mock.onGet("/unreachable").networkError();

    const err = await apiClient.get("/unreachable").catch((e) => e);

    // This is the case AuthProvider specifically checks for via
    // axios.isAxiosError(err) && !err.response — it must NOT get
    // wrapped into an ApiError, or that distinction breaks.
    expect(err).not.toBeInstanceOf(ApiError);
    expect(err.response).toBeUndefined();
  });

  it("on a 401, attempts one refresh then retries the original request", async () => {
    let meAttempts = 0;
    mock.onGet("/auth/me").reply(() => {
      meAttempts += 1;
      // First call: unauthorized. After refresh "succeeds": authorized.
      return meAttempts === 1
        ? [
            401,
            {
              success: false,
              error: {
                code: "UNAUTHORIZED",
                message: "No session",
                details: null,
                requestId: "r1",
              },
            },
          ]
        : [200, { success: true, data: { id: "1" } }];
    });
    mock.onPost("/auth/refresh-token").reply(200, {
      success: true,
      data: { message: "refreshed" },
    });

    const res = await apiClient.get("/auth/me");

    expect(meAttempts).toBe(2);
    expect(res.data.data).toEqual({ id: "1" });
  });

  it("does not attempt to refresh again if the refresh call itself 401s", async () => {
    mock.onGet("/auth/me").reply(401, {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "No session",
        details: null,
        requestId: "r1",
      },
    });
    mock.onPost("/auth/refresh-token").reply(401, {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Aucun refresh token fourni.",
        details: null,
        requestId: "r2",
      },
    });

    const err = await apiClient.get("/auth/me").catch((e) => e);

    // Rejects with the refresh failure — critically, does NOT loop back
    // and try refreshing again.
    expect(err).toBeInstanceOf(ApiError);
    expect(
      mock.history.post.filter((r) => r.url === "/auth/refresh-token"),
    ).toHaveLength(1);
  });

  it("regression: source no longer contains a hard window.location redirect", async () => {
    // This is the exact bug that caused an infinite reload loop: the
    // interceptor used to call `window.location.href = "/login"` on
    // refresh failure, pointing at a route that doesn't exist
    // ("/login" instead of "/auth/login"), landing on a 404 wrapped by
    // the same root layout that runs this same check — looping
    // forever. The fix was to remove that redirect entirely and let
    // callers decide navigation. Checking the source directly instead
    // of mocking window.location, since jsdom's navigation handling is
    // unreliable to intercept in tests.
    const { readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const source = readFileSync(
      path.resolve(process.cwd(), "lib/api/client.ts"),
      "utf-8",
    );
    expect(source).not.toMatch(/window\.location/);
  });

  it("queues a second concurrent 401 while a refresh is already in flight, instead of firing a second refresh", async () => {
    let refreshCalls = 0;
    mock.onPost("/auth/refresh-token").reply(() => {
      refreshCalls += 1;
      return [200, { success: true, data: {} }];
    });
    mock.onGet("/a").replyOnce(401, {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "x",
        details: null,
        requestId: "r1",
      },
    });
    mock.onGet("/a").reply(200, { success: true, data: "a-ok" });
    mock.onGet("/b").replyOnce(401, {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "x",
        details: null,
        requestId: "r2",
      },
    });
    mock.onGet("/b").reply(200, { success: true, data: "b-ok" });

    const [resA, resB] = await Promise.all([
      apiClient.get("/a"),
      apiClient.get("/b"),
    ]);

    expect(resA.data.data).toBe("a-ok");
    expect(resB.data.data).toBe("b-ok");
    expect(refreshCalls).toBe(1);
  });
});
