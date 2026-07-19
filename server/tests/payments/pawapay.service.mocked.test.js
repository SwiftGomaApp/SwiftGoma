jest.mock("../../src/features/payments/config/pawapay.config", () => ({
  client: { post: jest.fn(), get: jest.fn() },
  getBaseUrl: () => "https://api.sandbox.pawapay.io",
  getPrivateKeyPem: () => "",
  getKeyId: () => "",
}));

const { client } = require("../../src/features/payments/config/pawapay.config");
const {
  initiateDeposit,
} = require("../../src/features/payments/services/pawapay.service");

describe("pawapay.service (mocked)", () => {
  beforeEach(() => jest.clearAllMocks());

  test("rejects invalid MSISDN before calling PawaPay", async () => {
    await expect(
      initiateDeposit({
        amount: "1000",
        currency: "RWF",
        country: "RWA",
        provider: "MTN_MOMO_RWA",
        payerPhoneNumber: "+250792398833", // invalide, a un +
        customerMessage: "Test",
      }),
    ).rejects.toThrow();

    expect(client.post).not.toHaveBeenCalled();
  });

  test("initiates deposit with correctly shaped payload", async () => {
    client.get.mockResolvedValueOnce({
      data: {
        countries: [
          {
            country: "RWA",
            providers: [
              {
                provider: "MTN_MOMO_RWA",
                currencies: [
                  {
                    currency: "RWF",
                    operationTypes: { DEPOSIT: { decimalsInAmount: "NONE" } },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    client.post.mockResolvedValueOnce({
      data: { status: "ACCEPTED", created: "2026-07-19T00:00:00Z" },
    });

    const result = await initiateDeposit({
      amount: "1000",
      currency: "RWF",
      country: "RWA",
      provider: "MTN_MOMO_RWA",
      payerPhoneNumber: "250792398833",
      customerMessage: "Test SwiftGoma",
    });

    expect(result.status).toBe("ACCEPTED");
    expect(client.post).toHaveBeenCalledWith(
      "/v2/deposits",
      expect.objectContaining({ amount: "1000", currency: "RWF" }),
    );
  });
});
