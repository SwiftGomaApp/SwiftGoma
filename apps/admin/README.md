# Swiftgoma — Admin Dashboard

Next.js web app for the Swiftgoma team to oversee sellers, buyers, orders, disputes, and payouts.

See the [root README](../../README.md) for the full product overview.

## Access Levels

The dashboard has two access levels — build permission checks server-side, not just hidden in the UI.

| Capability                               | Support                           | Admin                  |
| ---------------------------------------- | --------------------------------- | ---------------------- |
| View orders, users, tickets              | Yes                               | Yes                    |
| Respond to tickets/chats                 | Yes                               | Yes                    |
| Help with stuck orders (e.g. QR issues)  | Yes                               | Yes                    |
| Flag suspicious accounts/listings        | Yes — flags for review            | Yes — flags and acts   |
| Issue refunds                            | Up to a set cap                   | Full authority, no cap |
| Review seller KYC                        | First pass — reviews & recommends | Final approval         |
| Suspend or ban an account                | No                                | Yes                    |
| Manage subscription plans/pricing        | No                                | Yes                    |
| View platform-wide financial reports     | No                                | Yes                    |
| Resolve escalated/high-value disputes    | No — escalates                    | Yes — final call       |
| Configure platform settings              | No                                | Yes                    |
| Manage Support team accounts/permissions | No                                | Yes                    |

## Folder Structure

```
app/
├── (support)/       # Support-level routes
├── (admin)/           # Admin-only routes
├── sellers/
├── orders/
├── disputes/
└── api/
components/
lib/
public/
```

## Getting Started

```bash
cd apps/admin
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_API_BASE_URL=
DATABASE_URL=
JWT_SECRET=
SENTRY_DSN=
```

## Key Concepts

- **Dispute flow:** Trigger (reported in-app) → ticket created → Support reviews (resolves within refund cap, or escalates) → Admin decision (final call) → resolution communicated → closed.
- **KYC flow:** Support reviews submitted documents first and recommends approve/reject; Admin gives the final approval before a seller can go live.
- **Every permission boundary in the table above must be enforced in the API layer**, since this is a web app and client-side checks alone aren't sufficient protection.
