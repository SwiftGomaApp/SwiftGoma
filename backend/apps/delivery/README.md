# Swiftgoma — Delivery App

Flutter app for riders to receive and fulfill delivery orders on behalf of the seller they're affiliated with.

See the [root README](../../README.md) for the full product overview.

## What this app does

1. **Invitation & setup** — accept an invite from a seller (link/code), create a lightweight profile (name, phone, photo, vehicle type). No separate KYC — the seller vouches for their own rider.
2. **Availability** — toggle "Available" so the seller can assign orders.
3. **Order assigned** — the seller manually assigns an order directly; there's no accept/decline step, assignment is automatic and final.
4. **Pickup** — collect the order from the seller's shop, mark "Picked up."
5. **En route** — status feeds the buyer's live map tracking.
6. **Delivery & handoff** — scan the buyer's QR code to confirm handoff. For online-paid orders, this triggers the payout to the seller. For Cash on Delivery, collect cash from the buyer here.
7. **Cash return (COD only)** — return collected cash to the seller directly, on the spot.
8. **Completed deliveries** — view delivery history. The app does not process rider pay — that's a private arrangement with the seller.

## Folder Structure

```
lib/
├── features/
│   ├── auth/           # invite-based, lightweight profile
│   ├── orders/            # assigned deliveries
│   ├── navigation/           # Mapbox routing to seller/buyer
│   └── qr_scanner/
├── shared/
└── main.dart
```

## Getting Started

```bash
cd apps/delivery
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

- **One rider = one seller.** A rider only ever sees and fulfills orders from the seller who invited them.
- **No accept/decline.** Once a seller assigns an order to a rider, it's final — build the UI to reflect this (a notification, not a request).
- **QR scan is payout-critical for online orders.** Handle scan failures gracefully — this isn't just a UI nicety, it blocks the seller from getting paid.
