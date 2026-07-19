const {
  initiateDeposit,
  checkDepositStatus,
} = require("../../src/features/payments/services/pawapay.service");

const SANDBOX_TEST_MSISDN = "250792398833";

describe("pawapay.service (real sandbox)", () => {
  test("initiates a real deposit against sandbox", async () => {
    const result = await initiateDeposit({
      amount: "1000",
      currency: "RWF",
      country: "RWA",
      provider: "MTN_MOMO_RWA",
      payerPhoneNumber: SANDBOX_TEST_MSISDN,
      customerMessage: "CI sandbox test",
      clientReferenceId: `CI-${Date.now()}`,
    });

    expect(result.status).toBe("ACCEPTED");

    const status = await checkDepositStatus(result.depositId);
    expect(status.status).toBeDefined();
  }, 20000);
});
