jest.mock("../../src/config/db.config", () => {
  const users = new Map();
  const sellerProfiles = new Map(); // keyed by userId

  return {
    prisma: {
      user: {
        findUnique: jest.fn(async ({ where: { id } }) => users.get(id) || null),
      },
      sellerProfile: {
        findUnique: jest.fn(
          async ({ where: { userId } }) => sellerProfiles.get(userId) || null,
        ),
        create: jest.fn(async ({ data }) => {
          const record = { id: "sp_" + data.userId, ...data };
          sellerProfiles.set(data.userId, record);
          return record;
        }),
      },
    },
    __debug: { users, sellerProfiles },
  };
});

const {
  createSellerProfile,
  getSellerProfile,
} = require("../../src/features/seller/services/seller.profile.service");
const { __debug } = require("../../src/config/db.config");

const validUser = (overrides = {}) => ({
  role: "SELLER",
  isActive: true,
  isDeleted: false,
  isVerified: true,
  ...overrides,
});

describe("seller-profile.service", () => {
  beforeEach(() => {
    __debug.users.clear();
    __debug.sellerProfiles.clear();
  });

  test("creates a profile with country + acceptedSubMerchantTerms only (no business contact)", async () => {
    __debug.users.set("u1", { id: "u1", ...validUser() });

    const profile = await createSellerProfile({
      userId: "u1",
      country: "COD",
      acceptedSubMerchantTerms: true,
    });

    expect(profile.country).toBe("COD");
    expect(profile.businessPhone).toBeNull();
    expect(profile.businessEmail).toBeNull();
    expect(profile.pawapaySubMerchantAgreementAcceptedAt).toBeInstanceOf(Date);
  });

  test("creates a profile with businessPhone + businessEmail, both normalized", async () => {
    __debug.users.set("u2", { id: "u2", ...validUser() });

    const profile = await createSellerProfile({
      userId: "u2",
      country: "RWA",
      acceptedSubMerchantTerms: true,
      businessPhone: "+250788123456",
      businessEmail: "  Shop@Example.com  ",
    });

    expect(profile.businessPhone).toBe("+250788123456");
    expect(profile.businessEmail).toBe("shop@example.com"); // trimmed + lowercased
  });

  test("rejects when acceptedSubMerchantTerms is missing", async () => {
    __debug.users.set("u3", { id: "u3", ...validUser() });
    await expect(
      createSellerProfile({ userId: "u3", country: "COD" }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("accepter les conditions"),
    });
  });

  test("rejects when acceptedSubMerchantTerms is false", async () => {
    __debug.users.set("u3b", { id: "u3b", ...validUser() });
    await expect(
      createSellerProfile({
        userId: "u3b",
        country: "COD",
        acceptedSubMerchantTerms: false,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("accepter les conditions"),
    });
  });

  test("rejects invalid businessPhone", async () => {
    __debug.users.set("u4", { id: "u4", ...validUser() });
    await expect(
      createSellerProfile({
        userId: "u4",
        country: "COD",
        acceptedSubMerchantTerms: true,
        businessPhone: "not-a-phone",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("rejects invalid businessEmail", async () => {
    __debug.users.set("u5", { id: "u5", ...validUser() });
    await expect(
      createSellerProfile({
        userId: "u5",
        country: "COD",
        acceptedSubMerchantTerms: true,
        businessEmail: "not-an-email",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("rejects invalid country", async () => {
    __debug.users.set("u6", { id: "u6", ...validUser() });
    await expect(
      createSellerProfile({
        userId: "u6",
        country: "FR",
        acceptedSubMerchantTerms: true,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("rejects unverified account", async () => {
    __debug.users.set("u7", { id: "u7", ...validUser({ isVerified: false }) });
    await expect(
      createSellerProfile({
        userId: "u7",
        country: "COD",
        acceptedSubMerchantTerms: true,
      }),
    ).rejects.toMatchObject({ message: expect.stringContaining("vérifié") });
  });

  test("rejects BUYER role", async () => {
    __debug.users.set("u8", { id: "u8", ...validUser({ role: "BUYER" }) });
    await expect(
      createSellerProfile({
        userId: "u8",
        country: "COD",
        acceptedSubMerchantTerms: true,
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("vendeurs"),
    });
  });

  test("rejects duplicate profile creation", async () => {
    __debug.users.set("u9", { id: "u9", ...validUser() });
    __debug.sellerProfiles.set("u9", {
      id: "sp_u9",
      userId: "u9",
      country: "COD",
    });
    await expect(
      createSellerProfile({
        userId: "u9",
        country: "COD",
        acceptedSubMerchantTerms: true,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("existe déjà"),
    });
  });

  test("getSellerProfile: returns the profile when it exists", async () => {
    __debug.sellerProfiles.set("u10", {
      id: "sp_u10",
      userId: "u10",
      country: "RWA",
    });
    const profile = await getSellerProfile({ userId: "u10" });
    expect(profile.country).toBe("RWA");
  });

  test("getSellerProfile: throws NOT_FOUND when no profile exists yet", async () => {
    await expect(
      getSellerProfile({ userId: "no-profile-user" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
