# Security Policy — SwiftGoma

## Reporting a Vulnerability

If you discover a security vulnerability in SwiftGoma, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

### How to report

Send an email to: **security@swiftgoma.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

### What to expect

- Acknowledgement within **48 hours**
- Status update within **7 days**
- Fix deployed within **30 days** for critical issues

We take all security reports seriously and will credit researchers who report valid vulnerabilities responsibly.

---

## Scope

| In scope | Out of scope |
|---|---|
| SwiftGoma API (server) | Third-party services (PawaPay, Cloudinary) |
| Seller Dashboard | Africa's Talking SMS infrastructure |
| Buyer App | Social engineering attacks |
| Deliverer App | DoS / DDoS attacks |

---

## Security Measures

- JWT stored in HttpOnly, Secure, SameSite cookies — never localStorage
- Passwords hashed with bcrypt (12 rounds)
- TOTP 2FA + passkeys (WebAuthn) supported
- Rate limiting on all auth endpoints
- Input validation on all routes
- PawaPay PIN never stored — transactions initiated via secure API
- Sentry error monitoring with PII scrubbing

---

© 2026 SwiftGoma / SWIFTGOMA