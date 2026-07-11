jest.mock("../../src/config/env.config", () => ({
  jwt_access_secret: "test_access_secret",
  jwt_refresh_secret: "test_refresh_secret",
  jwt_access_expires_in: "15m",
  jwt_refresh_expires_in: "7d",
  node_env: "test",
}));

jest.mock("../../src/config/db.config", () => {
  const sessions = new Map();
  const refreshTokens = new Map();
  let idCounter = 1;
  const nextId = () => `id_${idCounter++}`;

  return {
    prisma: {
      session: {
        create: jest.fn(async ({ data }) => {
          const record = { id: nextId(), ...data };
          sessions.set(record.id, record);
          return record;
        }),
        delete: jest.fn(async ({ where: { id } }) => {
          if (!sessions.has(id)) throw new Error("Record not found");
          sessions.delete(id);
        }),
        findMany: jest.fn(async ({ where: { userId } }) =>
          [...sessions.values()].filter((s) => s.userId === userId),
        ),
        deleteMany: jest.fn(async ({ where: { userId } }) => {
          for (const [id, s] of sessions)
            if (s.userId === userId) sessions.delete(id);
        }),
      },
      refreshToken: {
        create: jest.fn(async ({ data }) => {
          const record = {
            id: nextId(),
            revokedAt: null,
            replacedByToken: null,
            ...data,
          };
          refreshTokens.set(record.id, record);
          refreshTokens.set(`token:${record.token}`, record);
          return record;
        }),
        findUnique: jest.fn(async ({ where: { token, id } }) => {
          if (token) return refreshTokens.get(`token:${token}`) || null;
          if (id) return refreshTokens.get(id) || null;
          return null;
        }),
        update: jest.fn(async ({ where: { id }, data }) => {
          const record = refreshTokens.get(id);
          if (!record) throw new Error("Record not found");
          Object.assign(record, data);
          return record;
        }),
        updateMany: jest.fn(async ({ where, data }) => {
          let count = 0;
          for (const [key, r] of refreshTokens) {
            if (key.startsWith("token:")) continue;
            if (where.sessionId && r.sessionId !== where.sessionId) continue;
            if (where.userId && r.userId !== where.userId) continue;
            if (where.revokedAt === null && r.revokedAt !== null) continue;
            Object.assign(r, data);
            count++;
          }
          return { count };
        }),
      },
    },
    __debug: { sessions, refreshTokens },
  };
});

jest.mock("../../src/config/redis.config", () => ({
  keys: { session: (id) => `session:${id}` },
  setEx: jest.fn(async () => {}),
  del: jest.fn(async () => {}),
}));

const { prisma, __debug } = require("../../src/config/db.config");
const {
  createSession,
  rotateRefreshToken,
} = require("../../src/shared/utils/session.utils");

describe("session.utils — createSession", () => {
  test("throws DEVICE_ID_REQUIRED for MOBILE without deviceId", async () => {
    await expect(
      createSession({
        userId: "user1",
        role: "BUYER",
        deviceInfo: {
          os: "iOS",
          browser: null,
          device: "Mobile",
          ip: "1.1.1.1",
        },
        platform: "MOBILE",
        deviceId: null,
      }),
    ).rejects.toMatchObject({ code: "DEVICE_ID_REQUIRED" });
  });

  test("succeeds for MOBILE with deviceId, binds it to the token", async () => {
    const { session, refreshToken } = await createSession({
      userId: "user2",
      role: "BUYER",
      deviceInfo: { os: "iOS", browser: null, device: "Mobile", ip: "1.1.1.1" },
      platform: "MOBILE",
      deviceId: "device-abc",
    });
    expect(session.id).toBeDefined();
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    expect(stored.platform).toBe("MOBILE");
    expect(stored.deviceId).toBe("device-abc");
  });

  test("succeeds for WEB without deviceId", async () => {
    const { refreshToken } = await createSession({
      userId: "user3",
      role: "SUPPORT",
      deviceInfo: {
        os: "macOS",
        browser: "Chrome",
        device: "Desktop",
        ip: "2.2.2.2",
      },
      platform: "WEB",
      deviceId: null,
    });
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    expect(stored.platform).toBe("WEB");
    expect(stored.deviceId).toBeNull();
  });
});

describe("session.utils — rotateRefreshToken (security-critical)", () => {
  test("succeeds on first use and rotates the token", async () => {
    const { refreshToken } = await createSession({
      userId: "user4",
      role: "BUYER",
      deviceInfo: {
        os: "Android",
        browser: null,
        device: "Mobile",
        ip: "3.3.3.3",
      },
      platform: "MOBILE",
      deviceId: "device-xyz",
    });
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    const { refreshToken: rotated } = await rotateRefreshToken({
      storedToken: stored,
      role: "BUYER",
      deviceInfo: {
        os: "Android",
        browser: null,
        device: "Mobile",
        ip: "3.3.3.3",
      },
      platform: "MOBILE",
      deviceId: "device-xyz",
    });

    expect(rotated).not.toBe(refreshToken);
    const afterRotation = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    expect(afterRotation.revokedAt).toBeTruthy();
    expect(afterRotation.replacedByToken).toBeTruthy();
  });

  test("detects REUSE of an already-rotated token and revokes the session", async () => {
    const { session, refreshToken } = await createSession({
      userId: "user5",
      role: "BUYER",
      deviceInfo: {
        os: "Android",
        browser: null,
        device: "Mobile",
        ip: "4.4.4.4",
      },
      platform: "MOBILE",
      deviceId: "device-reuse-test",
    });

    let stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    await rotateRefreshToken({
      storedToken: stored,
      role: "BUYER",
      deviceInfo: {
        os: "Android",
        browser: null,
        device: "Mobile",
        ip: "4.4.4.4",
      },
      platform: "MOBILE",
      deviceId: "device-reuse-test",
    });

    // Attacker replays the original (now-rotated) token
    stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    await expect(
      rotateRefreshToken({
        storedToken: stored,
        role: "BUYER",
        deviceInfo: {
          os: "Android",
          browser: null,
          device: "Mobile",
          ip: "9.9.9.9",
        },
        platform: "MOBILE",
        deviceId: "device-reuse-test",
      }),
    ).rejects.toMatchObject({ code: "TOKEN_REUSE_DETECTED" });

    // whole session should be gone, not just the token
    expect(__debug.sessions.get(session.id)).toBeUndefined();
  });

  test("detects DEVICE_MISMATCH when a valid token is used from a different device", async () => {
    const { refreshToken } = await createSession({
      userId: "user6",
      role: "BUYER",
      deviceInfo: { os: "iOS", browser: null, device: "Mobile", ip: "5.5.5.5" },
      platform: "MOBILE",
      deviceId: "device-original",
    });
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    await expect(
      rotateRefreshToken({
        storedToken: stored,
        role: "BUYER",
        deviceInfo: {
          os: "iOS",
          browser: null,
          device: "Mobile",
          ip: "6.6.6.6",
        },
        platform: "MOBILE",
        deviceId: "device-DIFFERENT",
      }),
    ).rejects.toMatchObject({ code: "DEVICE_MISMATCH" });
  });
});
