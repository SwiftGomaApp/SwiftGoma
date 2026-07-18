function maskPhone(phone) {
  if (!phone || phone.length < 6) return "••••";
  return phone.slice(0, 3) + "•".repeat(phone.length - 5) + phone.slice(-2);
}

module.exports = { maskPhone };
