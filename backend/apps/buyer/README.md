# Swiftgoma — Buyer App

Flutter app for local buyers in Goma to browse sellers, place orders, and track delivery.

See the [root README](../../README.md) for the full product overview.

## What this app does

1. **Onboarding** — sign up with phone number, set a delivery location.
2. **Discovery** — browse nearby sellers/categories.
3. **Seller / product page** — view products, prices (USD/CDF), estimated delivery time.
4. **Cart & Checkout** — select payment method (Cash on Delivery, Online Payment, or Swiftgoma Wallet) and fulfillment method (Delivery or Pickup).
5. **Order tracking** — live map tracking of the assigned rider (Delivery), or pickup-ready status (Pickup).
6. **Handoff** — show the one-time QR code to the rider or seller to confirm receipt.
7. **Post-order** — rate the seller/rider, view Order History.

## Folder Structure

```
lib/
├── features/
│   ├── auth/           # phone-based signup
│   ├── discovery/        # sellers, categories, search
│   ├── checkout/           # cart, payment method, fulfillment method
│   ├── orders/               # order status, history
│   ├── wallet/                 # Swiftgoma Wallet top-up/balance
│   └── tracking/                 # live map tracking (Mapbox)
├── shared/                         # widgets, theme, constants
└── main.dart
```

## Getting Started

```bash
cd apps/buyer
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

- **One seller per order** — no multi-seller cart.
- **Delivery or Pickup**, chosen independently of payment method.
- **QR handoff** is how an order gets marked complete — for online payments, this scan is what triggers the payout to the seller.
