jest.mock("../../src/config/db.config", () => {
  const sellerProfiles = new Map(); // by id
  const sellerProfilesByUserId = new Map(); // userId -> id
  const kycRecords = new Map(); // by sellerProfileId
  let kycIdCounter = 1;

  const kycById = () =>
    new Map([...kycRecords.entries()].map(([spId, k]) => [k.id, k]));

  return {
    prisma: {
      sellerProfile: {
        findUnique: jest.fn(async ({ where: { userId, id } }) => {
          const spId = userId ? sellerProfilesByUserId.get(userId) : id;
          if (!spId) return null;
          const profile = sellerProfiles.get(spId);
          if (!profile) return null;
          return { ...profile, kyc: kycRecords.get(spId) || null };
        }),
        update: jest.fn(async ({ where: { id }, data }) => {
          const updated = { ...sellerProfiles.get(id), ...data };
          sellerProfiles.set(id, updated);
          return updated;
        }),
      },
      kyc: {
        create: jest.fn(async ({ data }) => {
          const record = { id: "kyc_" + kycIdCounter++, ...data };
          kycRecords.set(data.sellerProfileId, record);
          return record;
        }),
        update: jest.fn(async ({ where: { sellerProfileId, id }, data }) => {
          let spId = sellerProfileId;
          if (!spId && id) {
            spId = [...kycRecords.entries()].find(([, k]) => k.id === id)?.[0];
          }
          const updated = { ...kycRecords.get(spId), ...data };
          kycRecords.set(spId, updated);
          return updated;
        }),
        findUnique: jest.fn(async ({ where: { id } }) => {
          const entry = [...kycRecords.entries()].find(([, k]) => k.id === id);
          if (!entry) return null;
          const [spId, kyc] = entry;
          return { ...kyc, sellerProfile: sellerProfiles.get(spId) };
        }),
        findMany: jest.fn(async ({ where, orderBy, skip = 0, take }) => {
          let all = [...kycRecords.entries()]
            .filter(([, k]) => !where?.status || k.status === where.status)
            .map(([spId, k]) => ({
              ...k,
              sellerProfile: {
                ...sellerProfiles.get(spId),
                user: { id: "u_" + spId, name: "Test Seller" },
              },
            }));
          if (orderBy?.submittedAt === "asc") {
            all.sort((a, b) => (a.submittedAt || 0) - (b.submittedAt || 0));
          }
          return all.slice(skip, take ? skip + take : undefined);
        }),
        count: jest.fn(async ({ where }) => {
          return [...kycRecords.values()].filter(
            (k) => !where?.status || k.status === where.status,
          ).length;
        }),
      },
    },
    __debug: {
      seedProfile: (userId, profile) => {
        sellerProfilesByUserId.set(userId, profile.id);
        sellerProfiles.set(profile.id, profile);
      },
      seedKyc: (sellerProfileId, kyc) => {
        kycRecords.set(sellerProfileId, {
          id: "kyc_seed_" + sellerProfileId,
          sellerProfileId,
          ...kyc,
        });
      },
      clear: () => {
        sellerProfiles.clear();
        sellerProfilesByUserId.clear();
        kycRecords.clear();
        kycIdCounter = 1;
      },
      kycRecords,
      sellerProfiles,
    },
  };
});

const {
  submitKyc,
  getKyc,
  listPendingKyc,
  reviewKyc,
} = require("../../src/features/seller/services/seller.kyc.service");
const { __debug } = require("../../src/config/db.config");

const validIndividualPayload = (overrides = {}) => ({
  userId: "u1",
  sellerType: "INDIVIDUAL",
  idType: "NATIONAL_ID",
  idNumber: "ID12345",
  idFrontUrl: "https://cloudinary.com/front.jpg",
  idBackUrl: "https://cloudinary.com/back.jpg",
  selfieUrl: "https://cloudinary.com/selfie.jpg",
  ...overrides,
});

describe("seller.kyc.service — seller-facing", () => {
  beforeEach(() => __debug.clear());

  test("submitKyc: creates KYC for INDIVIDUAL seller", async () => {
    __debug.seedProfile("u1", {
      id: "sp1",
      userId: "u1",
      onboardingStatus: "PENDING_KYC",
    });
    const kyc = await submitKyc(validIndividualPayload());
    expect(kyc.status).toBe("SUBMITTED");
  });

  test("submitKyc: BUSINESS seller requires business fields", async () => {
    __debug.seedProfile("u2", {
      id: "sp2",
      userId: "u2",
      onboardingStatus: "PENDING_KYC",
    });
    await expect(
      submitKyc(
        validIndividualPayload({ userId: "u2", sellerType: "BUSINESS" }),
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("submitKyc: resubmission after REJECTED resets onboardingStatus", async () => {
    __debug.seedProfile("u9", {
      id: "sp9",
      userId: "u9",
      onboardingStatus: "KYC_REJECTED",
    });
    __debug.seedKyc("sp9", {
      status: "REJECTED",
      reviewedBy: "admin1",
      reviewedAt: new Date(),
      note: "Blurry",
    });

    const kyc = await submitKyc(validIndividualPayload({ userId: "u9" }));
    expect(kyc.reviewedBy).toBeNull();
    expect(__debug.sellerProfiles.get("sp9").onboardingStatus).toBe(
      "PENDING_KYC",
    );
  });

  test("getKyc: throws NOT_FOUND when no KYC submitted yet", async () => {
    __debug.seedProfile("u11", {
      id: "sp11",
      userId: "u11",
      onboardingStatus: "PENDING_KYC",
    });
    await expect(getKyc({ userId: "u11" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("seller.kyc.service — staff review", () => {
  beforeEach(() => __debug.clear());

  test("listPendingKyc: returns only SUBMITTED records, with pagination", async () => {
    __debug.seedProfile("s1", { id: "spA", userId: "s1" });
    __debug.seedKyc("spA", {
      status: "SUBMITTED",
      submittedAt: new Date("2026-01-01"),
    });
    __debug.seedProfile("s2", { id: "spB", userId: "s2" });
    __debug.seedKyc("spB", {
      status: "APPROVED",
      submittedAt: new Date("2026-01-02"),
    }); // should be excluded
    __debug.seedProfile("s3", { id: "spC", userId: "s3" });
    __debug.seedKyc("spC", {
      status: "SUBMITTED",
      submittedAt: new Date("2026-01-03"),
    });

    const result = await listPendingKyc({ page: 1, limit: 20 });

    expect(result.items).toHaveLength(2);
    expect(result.items.every((k) => k.status === "SUBMITTED")).toBe(true);
    expect(result.pagination.total).toBe(2);
  });

  test("listPendingKyc: paginates correctly", async () => {
    for (let i = 0; i < 5; i++) {
      __debug.seedProfile(`p${i}`, { id: `sp${i}`, userId: `p${i}` });
      __debug.seedKyc(`sp${i}`, {
        status: "SUBMITTED",
        submittedAt: new Date(2026, 0, i + 1),
      });
    }
    const page1 = await listPendingKyc({ page: 1, limit: 2 });
    const page2 = await listPendingKyc({ page: 2, limit: 2 });

    expect(page1.items).toHaveLength(2);
    expect(page2.items).toHaveLength(2);
    expect(page1.pagination.totalPages).toBe(3);
    expect(page1.items[0].id).not.toBe(page2.items[0].id);
  });

  test("reviewKyc: APPROVE sets status, reviewer, and moves seller to PENDING_SUBSCRIPTION", async () => {
    __debug.seedProfile("s4", {
      id: "spD",
      userId: "s4",
      onboardingStatus: "PENDING_KYC",
    });
    __debug.seedKyc("spD", { status: "SUBMITTED" });
    const kycId = __debug.kycRecords.get("spD").id;

    const result = await reviewKyc({
      kycId,
      reviewerId: "admin1",
      action: "APPROVE",
    });

    expect(result.status).toBe("APPROVED");
    expect(result.reviewedBy).toBe("admin1");
    expect(result.reviewedAt).toBeInstanceOf(Date);
    expect(__debug.sellerProfiles.get("spD").onboardingStatus).toBe(
      "PENDING_SUBSCRIPTION",
    );
  });

  test("reviewKyc: REJECT requires a note", async () => {
    __debug.seedProfile("s5", {
      id: "spE",
      userId: "s5",
      onboardingStatus: "PENDING_KYC",
    });
    __debug.seedKyc("spE", { status: "SUBMITTED" });
    const kycId = __debug.kycRecords.get("spE").id;

    await expect(
      reviewKyc({ kycId, reviewerId: "admin1", action: "REJECT" }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("note est requise"),
    });
  });

  test("reviewKyc: REJECT with note sets status and moves seller to KYC_REJECTED", async () => {
    __debug.seedProfile("s6", {
      id: "spF",
      userId: "s6",
      onboardingStatus: "PENDING_KYC",
    });
    __debug.seedKyc("spF", { status: "SUBMITTED" });
    const kycId = __debug.kycRecords.get("spF").id;

    const result = await reviewKyc({
      kycId,
      reviewerId: "admin1",
      action: "REJECT",
      note: "Blurry ID",
    });

    expect(result.status).toBe("REJECTED");
    expect(__debug.sellerProfiles.get("spF").onboardingStatus).toBe(
      "KYC_REJECTED",
    );
  });

  test("reviewKyc: rejects invalid action", async () => {
    __debug.seedProfile("s7", { id: "spG", userId: "s7" });
    __debug.seedKyc("spG", { status: "SUBMITTED" });
    const kycId = __debug.kycRecords.get("spG").id;

    await expect(
      reviewKyc({ kycId, reviewerId: "admin1", action: "MAYBE" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("reviewKyc: throws NOT_FOUND for unknown kycId", async () => {
    await expect(
      reviewKyc({
        kycId: "does-not-exist",
        reviewerId: "admin1",
        action: "APPROVE",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("reviewKyc: blocks reviewing a KYC that's already been decided", async () => {
    __debug.seedProfile("s8", { id: "spH", userId: "s8" });
    __debug.seedKyc("spH", { status: "APPROVED" });
    const kycId = __debug.kycRecords.get("spH").id;

    await expect(
      reviewKyc({ kycId, reviewerId: "admin1", action: "APPROVE" }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("déjà été traité"),
    });
  });
});
