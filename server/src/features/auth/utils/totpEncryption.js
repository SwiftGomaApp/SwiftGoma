const crypto = require("crypto");

const { env } = require("../../../config/env");

const ALGORITHM = "aes-256-gcm";

function getKey() {
  const key = Buffer.from(env.totpSecretEncryptionKey, "hex");
  if (key.length !== 32) {
    throw new Error(
      "TOTP_SECRET_ENCRYPTION_KEY must be a 32-byte hex string. Generate one with: " +
        `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
    );
  }
  return key;
}

function encryptSecret(plainSecret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainSecret, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptSecret(encryptedSecret) {
  const [ivHex, authTagHex, dataHex] = encryptedSecret.split(":");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

module.exports = { encryptSecret, decryptSecret };
