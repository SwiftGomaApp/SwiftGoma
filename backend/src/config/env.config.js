require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3001,
  node_env: process.env.NODE_ENV,
  sentry_dsn: process.env.SENTRY_DSN,
  cookie_secret: process.env.COOKIE_SECRET,

  // Email
  email_host: process.env.SMTP_HOST,
  email_port: process.env.EMAIL_PORT,
  email_user: process.env.SMTP_USER,
  email_pass: process.env.SMTP_PASS,
  email_from: process.env.EMAIL_FROM,

  // OTP
  otp_expres_in: process.env.OTP_EXPIRES_IN_MINUTES,

  // Redis
  redis_url: process.env.REDIS_URL,

  // JWT
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,

  // SMS API_KEY
  at_api_key: process.env.AT_API_KEY,
  at_username: process.env.AT_USERNAME,
  at_sender_id: process.env.AT_SENDER_ID,

  // PASSKEYS
  rp_name: process.env.RP_NAME,
  rp_id: process.env.RP_ID,
  origin: process.env.CLIENT_URL,
  challenge_ttl: process.env.CHALLENGE_TTL,

  // PASSKEYS
  google_web_client_id: process.env.GOOGLE_WEB_CLIENT_ID,
  google_android_client_id: process.env.GOOGLE_ANDROID_CLIENT_ID,
  google_ios_client_id: process.env.GOOGLE_IOS_CLIENT_ID,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET,

  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,

  pawapay_production_api_token: process.env.PAWAPAY_PRODUCTION_API_TOKEN,
  pawapay_sandbox_api_token: process.env.PAWAPAY_SANDBOX_API_TOKEN,
  pawapay_environement: process.env.PAWAPAY_ENV,
  pawapay_callback_base_url: process.env.PAWAPAY_CALLBACK_BASE_URL,
  pawapay_signed_requests: process.env.PAWAPAY_SIGNED_REQUESTS,
  pawapay_signed_callbacks: process.env.PAWAPAY_SIGNED_CALLBACKS,
  pawapay_active_countries: process.env.PAWAPAY_ACTIVE_COUNTRIES,

  // pawaPay signing
  pawapay_sign_algorithm: process.env.PAWAPAY_SIGN_ALGORITHM,
  pawapay_signature_validity_seconds:
    process.env.PAWAPAY_SIGNATURE_VALIDITY_SECONDS,

  pawapay_key_id_production: process.env.PAWAPAY_KEY_ID,
  pawapay_private_key_pem_base64_production:
    process.env.PAWAPAY_PRIVATE_KEY_PEM_BASE64,

  pawapay_key_id_sandbox: process.env.PAWAPAY_KEY_ID_SANDBOX,
  pawapay_private_key_pem_base64_sandbox:
    process.env.PAWAPAY_PRIVATE_KEY_PEM_BASE64_SANDBOX,
};
