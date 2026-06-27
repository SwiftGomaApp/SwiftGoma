const PASSKEY_SELECT = {
  id: true,
  name: true,
  credentialId: true,
  deviceType: true,
  backedUp: true,
  lastUsedAt: true,
  createdAt: true,
};

const SESSION_SELECT = {
  id: true,
  device: true,
  browser: true,
  os: true,
  ip: true,
  location: true,
  lastActiveAt: true,
  createdAt: true,
};

const TOTP_SELECT = {
  id: true,
  isEnabled: true,
  enabledAt: true,
  createdAt: true,
};

const USER_SELECT = {
  id: true,
  role: true,
  name: true,
  email: true,
  phone: true,
  isVerified: true,
  isDeleted: true,
  isEmailVerified: true,
  googleId: true,
  secondaryEmail: true,
  isSecondaryEmailVerified: true,
  isPhoneVerified: true,
  isActive: true,
  isBlocked: true,

  passkeys: {
    select: PASSKEY_SELECT,
  },

  sessions: {
    select: SESSION_SELECT,
  },

  totp: {
    select: TOTP_SELECT,
  },
};

module.exports = {
  USER_SELECT,
  PASSKEY_SELECT,
  SESSION_SELECT,
  TOTP_SELECT,
};
