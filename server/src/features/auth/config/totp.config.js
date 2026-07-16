const { BRAND } = require("../../../common/constants/brand");

const TOTP_CONFIG = {
  issuer: BRAND.name,
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  verificationWindow: 1,
  backupCodeCount: 10,
  backupCodeLength: 10,
};

module.exports = { TOTP_CONFIG };
