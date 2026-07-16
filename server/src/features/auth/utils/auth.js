const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const SALT_ROUNDS = 12;

function isValidName(name) {
  if (typeof name !== "string") return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone) {
  if (typeof phone !== "string") return false;
  return /^\+[1-9]\d{7,14}$/.test(phone.trim());
}

function isValidPassword(password) {
  if (typeof password !== "string") return false;
  return password.length >= 8;
}

const OTP_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const OTP_CODE_LENGTH = 6;
const OTP_PREFIX = "SWG-";

function generateOtpCode() {
  let code = "";
  for (let i = 0; i < OTP_CODE_LENGTH; i++) {
    code += OTP_CHARSET[crypto.randomInt(0, OTP_CHARSET.length)];
  }
  return `${OTP_PREFIX}${code}`;
}

function generateAuthOtp() {
  return generateOtpCode();
}

function generateVerificationOtp() {
  return generateOtpCode();
}

function getOtpExpiry(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function isOtpExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}

/** @param {string} password @returns {Promise<string>} */
function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** @param {string} password @param {string} hash @returns {Promise<boolean>} */
function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  isValidName,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  generateAuthOtp,
  generateVerificationOtp,
  getOtpExpiry,
  isOtpExpired,
  hashPassword,
  comparePassword,
};
