# Swiftgoma — Seller App

Flutter app for sellers in Goma to manage their shop, orders, riders, and payouts.

See the [root README](../../README.md) for the full product overview.

## What this app does

**Onboarding:**

1. Create account (Seller role)
2. Create Seller Profile
3. Submit KYC (reviewed by Support, approved by Admin)
4. Choose Subscription (Starter, Business, or Enterprise)
5. Set up Seller Wallet
6. Create Shop
7. Create Products

**Day-to-day:**

- Dashboard — pending orders, today's sales, wallet balance, low-stock alerts.
- Product management — add/edit/remove products, stock levels.
- Order review — accept or reject incoming orders.
- Fulfillment — manually assign one of your own riders (Delivery), or mark "Ready for pickup."
- Handoff — mark rider pickup, or scan the buyer's QR code in-store for Pickup orders.
- Wallet & payouts — view balance, withdraw to mobile money.
- Rider management — invite or remove your own riders.

## Folder Structure

```
lib/
├── features/
│   ├── auth/
│   ├── onboarding/        # KYC, subscription, shop setup
│   ├── products/
│   ├── orders/
│   ├── riders/                # invite/manage own riders
│   └── wallet/
├── shared/
└── main.dart
```

## Getting Started

```bash
cd apps/seller
flutter pub get
cp .env.example .env   # fill in real values
flutter run
```

## Environment Variables

```
API_BASE_URL=
MAPBOX_ACCESS_TOKEN=
FCM_SENDER_ID=
SENTRY_DSN=
```

## Key Decisions (v1)

- **Riders belong to the seller, not to Swiftgoma.** You invite and manage your own riders; how you compensate them is a private arrangement outside the platform.
- **Delivery fee is set by each seller** — Swiftgoma doesn't set or take a cut of it.
- **0% commission on orders** — you keep 100% of the sale price. Swiftgoma earns via your subscription and Swiftgoma Wallet transactions.
- **Manual rider assignment** — for Delivery orders, you pick which of your riders gets each order; there's no auto-assignment or accept/decline step on the rider's side.
