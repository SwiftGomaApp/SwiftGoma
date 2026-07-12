const crypto = require("crypto");

const { privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
});
const pem = privateKey.export({ type: "pkcs8", format: "pem" });

process.env.PAWAPAY_ENV = "sandbox";
process.env.PAWAPAY_SANDBOX_API_TOKEN = "test_token";
process.env.PAWAPAY_KEY_ID_SANDBOX = "test-key-id";
process.env.PAWAPAY_SIGNED_REQUESTS = "true";
process.env.PAWAPAY_SIGNED_CALLBACKS = "true";
process.env.PAWAPAY_SIGN_ALGORITHM = "ecdsa-p256-sha256";
process.env.PAWAPAY_SIGNATURE_VALIDITY_SECONDS = "60";
process.env.PAWAPAY_CALLBACK_BASE_URL =
  "https://x.ngrok-free.dev/api/v1/callbacks";
process.env.PAWAPAY_ACTIVE_COUNTRIES = "cd,rwa";
process.env.PAWAPAY_PRIVATE_KEY_PEM_BASE64_SANDBOX =
  Buffer.from(pem).toString("base64");
