const {
  isValidAmount,
  formatAmount,
  isValidMsisdn,
  isValidStatementDescription,
  buildMetadata,
} = require("../../src/features/payments/utils/pawapay.utils");

describe("pawapay.utils", () => {
  describe("isValidAmount", () => {
    test("accepts positive numbers", () => {
      expect(isValidAmount(1000)).toBe(true);
      expect(isValidAmount("1000")).toBe(true);
    });
    test("rejects zero, negative, non-numeric", () => {
      expect(isValidAmount(0)).toBe(false);
      expect(isValidAmount(-5)).toBe(false);
      expect(isValidAmount("abc")).toBe(false);
    });
  });

  describe("formatAmount", () => {
    test("rounds to integer when decimalsInAmount is NONE", () => {
      expect(formatAmount(1000.4, "NONE")).toBe("1000");
    });
    test("keeps two decimals otherwise", () => {
      expect(formatAmount(1000, "TWO_PLACES")).toBe("1000.00");
    });
  });

  describe("isValidMsisdn", () => {
    test("accepts digits-only international format", () => {
      expect(isValidMsisdn("250792398833")).toBe(true);
    });
    test("rejects a leading +", () => {
      expect(isValidMsisdn("+250792398833")).toBe(false);
    });
  });

  describe("buildMetadata", () => {
    test("caps at 10 items", () => {
      const entries = {};
      for (let i = 0; i < 11; i++) entries[`key${i}`] = "value";
      expect(() => buildMetadata(entries)).toThrow();
    });
  });
});
