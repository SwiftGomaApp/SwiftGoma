# SwiftGoma API Inventory

Generated directly from `SwiftGoma-V1/server` route/controller/service source code. 34 folders, 259 endpoints.

Companion to `SwiftGoma.postman_collection.json` — every row here has a matching Postman request with a full description (purpose, auth, roles, parameters, validation, business rules, response, errors).

| Method | Endpoint | Folder | Authentication | Roles | Description |
| ------ | -------- | ------ | -------------- | ----- | ----------- |
| GET | `/health` | Health | No | — | Returns a lightweight liveness/readiness signal for the API, including whether the database connection is currently up. |
| GET | `/health/detailed` | Health | No | — | Returns the connectivity status of every external dependency the API relies on: PostgreSQL, Cloudinary, SMTP mailer, SMS provider, OneSignal push, PawaPay, and MbiyoPay. Results are cached for 10 seconds server-side. |
| POST | `/auth/create-account` | Authentication | No | — | Registers a new SwiftGoma account with name + email, and emails a 6-digit verification OTP to confirm the address. If the email already exists but is unverified, the account is reused and a fresh OTP is issued (no duplicate account created). |
| POST | `/auth/verify-email` | Authentication | No | — | Confirms an account's primary email using the 6-digit OTP sent by Create Account / Resend Verification. |
| POST | `/auth/resend-verification` | Authentication | No | — | Issues a new email-verification OTP, replacing any unexpired one. |
| POST | `/auth/register/google` | Authentication | No | — | Creates a new account from a verified Google ID token (Google Sign-In). Since Google already verifies the email, the account and its session are created in one step — no OTP round-trip. |
| POST | `/auth/login/google` | Authentication | No | — | Logs in an existing account previously linked to this Google identity. |
| POST | `/auth/login/request-otp` | Authentication | No | — | Sends a 6-digit passwordless login code to the given email (email-OTP login flow), independent of any password. |
| POST | `/auth/passkey/login/options` | Authentication | No | — | Generates a WebAuthn authentication challenge for passkey login. Omit `email` for a usernameless (discoverable-credential) flow; provide it to scope the challenge to that account's registered passkeys. |
| POST | `/auth/password/forgot` | Authentication | No | — | Sends a password-reset OTP to the given email, if an active account exists. |
| POST | `/auth/login/verify-otp` | Authentication | No | — | Completes passwordless login by exchanging a valid email-OTP for a session (access + refresh tokens). |
| POST | `/auth/login/password` | Authentication | No | — | Logs in using email + password. |
| POST | `/auth/login/totp` | Authentication | No | — | Completes a login that returned `requiresTotp: true` (from password, Google, or passkey login) by verifying a TOTP code or a one-time backup code. |
| POST | `/auth/passkey/login/verify` | Authentication | No | — | Verifies a signed WebAuthn assertion against the challenge from `POST /auth/passkey/login/options` and logs the user in. |
| POST | `/auth/password/reset` | Authentication | No | — | Sets a new password using the OTP from `POST /auth/password/forgot`. |
| POST | `/auth/password/update` | Authentication | Yes | Any authenticated | Changes the current user's password while authenticated. |
| POST | `/auth/totp/confirm` | Authentication | Yes | Any authenticated | Finalizes TOTP 2FA setup (after `POST /auth/totp/setup`) by verifying the first code from the authenticator app, then enables 2FA and issues 10 one-time backup codes. |
| POST | `/auth/totp/disable` | Authentication | Yes | Any authenticated | Disables TOTP 2FA for the current account, after re-proving control via a TOTP or backup code. |
| POST | `/auth/refresh-token` | Authentication | No | — | Exchanges a valid refresh token for a new access token + refresh token pair (rotation). |
| GET | `/auth/me` | Authentication | Yes | Any authenticated | Returns the authenticated user's full sanitized profile (emails, passkeys, 2FA status). |
| POST | `/auth/logout` | Authentication | Yes | Any authenticated | Revokes the session tied to the current access token and clears the auth cookies. |
| POST | `/auth/logout-all` | Authentication | Yes | Any authenticated | Revokes every active session for the current user (all devices), including the current one, and clears the auth cookies. |
| GET | `/auth/sessions` | Authentication | Yes | Any authenticated | Lists the current user's active (non-revoked, non-expired) sessions — useful for a "devices" / "active sessions" security page. |
| DELETE | `/auth/sessions/{{sessionId}}` | Authentication | Yes | Any authenticated | Revokes one specific session by id (e.g. "log out this device"). |
| POST | `/auth/password/create` | Authentication | Yes | Any authenticated | Sets a password on an account that was created via Google or email-OTP and has none yet, enabling password login going forward. |
| POST | `/auth/totp/setup` | Authentication | Yes | Any authenticated | Starts TOTP 2FA setup: generates a new secret, stores it encrypted (AES-256-GCM), and returns a QR code + manual entry key to scan into an authenticator app. Must be finished with `POST /auth/totp/confirm`. |
| POST | `/auth/totp/regenerate-backup-codes` | Authentication | Yes | Any authenticated | Invalidates all existing 2FA backup codes and issues a fresh set of 10, after re-proving control via a TOTP or backup code. |
| POST | `/auth/passkey/register/options` | Authentication | Yes | Any authenticated | Generates a WebAuthn registration challenge so the browser can create a new passkey for the current account. |
| POST | `/auth/passkey/register/verify` | Authentication | Yes | Any authenticated | Verifies a newly created WebAuthn credential against the registration challenge and stores it as a passkey on the account. |
| GET | `/auth/passkey` | Authentication | Yes | Any authenticated | Lists the current user's registered passkeys (public metadata only — never the public key material). |
| DELETE | `/auth/passkey/{{passkeyId}}` | Authentication | Yes | Any authenticated | Removes one of the current user's registered passkeys. |
| PATCH | `/users/profile` | Users | Yes | Any authenticated | Updates the current user's display name, avatar URL, and/or preferred display currency. |
| POST | `/users/profile/avatar` | Users | Yes | Any authenticated | Uploads and sets a new profile avatar image (stored via Cloudinary). |
| POST | `/users/delete` | Users | Yes | Any authenticated | Soft-deletes the current user's own account, starting a recovery grace period, and immediately clears the auth cookies. |
| POST | `/users/recovery/request` | Users | No | — | Sends a recovery OTP for a soft-deleted account that is still within its recovery grace period. |
| POST | `/users/recovery/verify` | Users | No | — | Confirms the recovery OTP, restores the soft-deleted account, and logs the user in. |
| POST | `/users/phone/request` | Users | Yes | Any authenticated | Sends an SMS OTP to verify the current user's phone number. |
| POST | `/users/phone/verify` | Users | Yes | Any authenticated | Confirms the phone number using the SMS OTP. |
| POST | `/users/phone/update/request` | Users | Yes | Any authenticated | Sends an SMS OTP to verify a new phone number, in order to change the number already on file. |
| POST | `/users/phone/update/verify` | Users | Yes | Any authenticated | Confirms the new phone number OTP and replaces the previous phone number. |
| POST | `/users/email/secondary/request` | Users | Yes | Any authenticated | Sends a verification OTP to add a secondary email address to the account. |
| POST | `/users/email/secondary/verify` | Users | Yes | Any authenticated | Confirms the OTP and attaches the secondary email to the account. |
| DELETE | `/users/email/secondary` | Users | Yes | Any authenticated | Removes the current user's secondary (non-primary) email address. |
| POST | `/users/google/link` | Users | Yes | Any authenticated | Links a Google identity to the current (already logged-in) account, enabling "Login with Google" going forward. |
| POST | `/users/google/unlink` | Users | Yes | Any authenticated | Removes the Google identity link from the current account. |
| GET | `/users?page=1&limit=20&search=&role=` | Users | Yes | ADMIN, SUPPORT | Lists/searches all platform users for admin/support tooling. |
| GET | `/users/{{userId}}` | Users | Yes | ADMIN, SUPPORT | Returns full detail for one user, for admin/support review. |
| POST | `/users/{{userId}}/block` | Users | Yes | ADMIN, SUPPORT | Blocks a user account, preventing login and access-token use. |
| POST | `/users/{{userId}}/unblock` | Users | Yes | ADMIN, SUPPORT | Reverses a block, restoring the user's ability to log in. |
| POST | `/users/{{userId}}/force-logout` | Users | Yes | ADMIN, SUPPORT | Revokes a user's sessions on demand (e.g. suspected compromise). |
| POST | `/users/{{userId}}/verify-email` | Users | Yes | ADMIN, SUPPORT | Marks one of the user's email addresses as verified without requiring the OTP flow (e.g. verified via support call). |
| POST | `/users/{{userId}}/verify-phone` | Users | Yes | ADMIN, SUPPORT | Marks the user's phone number as verified without the SMS OTP flow. |
| POST | `/users/{{userId}}/delete` | Users | Yes | ADMIN | Soft-deletes a user account on behalf of an admin (e.g. policy violation), distinct from the user's own self-delete. |
| POST | `/users/{{userId}}/restore` | Users | Yes | ADMIN | Restores a soft-deleted user account. |
| POST | `/users/{{userId}}/role` | Users | Yes | ADMIN | Changes a user's platform role. |
| GET | `/notifications?page=1&limit=20&unreadOnly=false` | Notifications | Yes | Any authenticated | Lists the current user's notifications, most recent first. |
| POST | `/notifications/read-all` | Notifications | Yes | Any authenticated | Marks every unread notification for the current user as read. |
| GET | `/notifications/preferences` | Notifications | Yes | Any authenticated | Returns the current user's per-type notification channel preferences. |
| PUT | `/notifications/preferences` | Notifications | Yes | Any authenticated | Upserts the channel preference for one notification type. |
| POST | `/notifications` | Notifications | Yes | ADMIN, SUPPORT | Manually creates and delivers a notification to a specific user (announcements, manual support follow-ups, etc.). |
| POST | `/notifications/{{notificationId}}/read` | Notifications | Yes | Any authenticated | Marks a single notification as read. |
| DELETE | `/notifications/{{notificationId}}` | Notifications | Yes | Any authenticated | Deletes a notification belonging to the current user. |
| POST | `/seller` | Seller Profiles & KYC | Yes | SELLER | Creates the business profile for a `SELLER` user — required before creating shops or products. |
| GET | `/seller/my-profile` | Seller Profiles & KYC | Yes | SELLER | Returns the current seller's own business profile. |
| PUT | `/seller` | Seller Profiles & KYC | Yes | SELLER | Updates the current seller's business profile fields and/or replaces the logo/banner. |
| POST | `/seller/{{userId}}/suspend` | Seller Profiles & KYC | Yes | ADMIN, SUPPORT | Suspends a seller's business profile, blocking their selling activity platform-wide. |
| POST | `/seller/{{userId}}/reactivate` | Seller Profiles & KYC | Yes | ADMIN, SUPPORT | Reverses a seller profile suspension. |
| POST | `/seller/kyc` | Seller Profiles & KYC | Yes | SELLER | Submits identity + address + business-registration documents for KYC review, the gate to an `ACTIVE` (published-shop-capable) seller profile. |
| GET | `/seller/kyc/my-kyc` | Seller Profiles & KYC | Yes | SELLER | Returns the current seller's own KYC submission and its status. |
| POST | `/seller/kyc/resubmit` | Seller Profiles & KYC | Yes | SELLER | Resubmits KYC documents after a rejection. |
| GET | `/seller/kyc?page=1&limit=20&status=PENDING` | Seller Profiles & KYC | Yes | ADMIN, SUPPORT | Lists KYC submissions for the moderation queue. |
| GET | `/seller/kyc/{{kycId}}` | Seller Profiles & KYC | Yes | ADMIN, SUPPORT | Returns full detail (including document URLs) for one KYC submission. |
| POST | `/seller/kyc/{{kycId}}/support-review` | Seller Profiles & KYC | Yes | SUPPORT, ADMIN | Records SUPPORT's first-pass review (e.g. after a verification call) and marks the KYC as `SUPPORT_REVIEWED`, queuing it for final ADMIN approval. |
| POST | `/seller/kyc/{{kycId}}/reject` | Seller Profiles & KYC | Yes | ADMIN, SUPPORT | Rejects a KYC submission with a reason, allowing the seller to resubmit. |
| POST | `/seller/kyc/{{kycId}}/approve` | Seller Profiles & KYC | Yes | ADMIN | Gives final approval to a KYC submission, activating the seller's profile (`ACTIVE` status) so they can publish shops. |
| GET | `/seller/shop/slug/{{shopSlug}}` | Shops | No | — | Public storefront lookup: returns a published shop's detail by its slug. |
| GET | `/seller/shops?page=1&limit=20&search=&city=Goma` | Shops | No | — | Public listing of published, non-deleted shops, e.g. for a "Shops" directory page. |
| POST | `/seller/shop` | Shops | Yes | SELLER | Creates a new shop under the current seller's profile. |
| GET | `/seller/shop/me` | Shops | Yes | SELLER | Lists every shop owned by the current seller. |
| PUT | `/seller/shop/{{shopId}}` | Shops | Yes | SELLER | Updates one of the current seller's shops. |
| POST | `/seller/shop/{{shopId}}/publish` | Shops | Yes | SELLER | Publishes the shop, making it publicly visible/orderable. |
| POST | `/seller/shop/{{shopId}}/unpublish` | Shops | Yes | SELLER | Takes a published shop back to draft, hiding it from buyers. |
| POST | `/seller/shop/{{shopId}}/suspend` | Shops | Yes | SELLER | Lets a seller voluntarily suspend their own shop (e.g. going on holiday). |
| POST | `/seller/shop/{{shopId}}/reactivate` | Shops | Yes | SELLER | Reverses a seller-initiated suspension. |
| DELETE | `/seller/shop/{{shopId}}` | Shops | Yes | SELLER | Soft-deletes one of the current seller's shops. |
| GET | `/seller/shops/admin?page=1&limit=20&search=&status=PUBLISHED` | Shops | Yes | ADMIN, SUPPORT | Admin/support listing of all shops (any status, including drafts and suspended), for moderation. |
| POST | `/seller/shop/{{shopId}}/admin/suspend` | Shops | Yes | ADMIN, SUPPORT | Admin/support-initiated shop suspension, independent of the owning seller. |
| POST | `/seller/shop/{{shopId}}/admin/reactivate` | Shops | Yes | ADMIN, SUPPORT | Reverses an admin-initiated shop suspension. |
| DELETE | `/seller/shop/{{shopId}}/admin` | Shops | Yes | ADMIN, SUPPORT | Admin/support soft-delete of any shop (e.g. confirmed policy violation). |
| POST | `/seller/shop/{{shopId}}/restore` | Shops | Yes | ADMIN, SUPPORT | Restores a soft-deleted shop. |
| GET | `/riders` | Riders (Seller-Managed) | Yes | SELLER | Lists all riders created by the current seller. |
| POST | `/riders` | Riders (Seller-Managed) | Yes | SELLER | Creates a new `RIDER` user account tied to the current seller and sends them onboarding credentials. |
| POST | `/riders/{{riderId}}/suspend` | Riders (Seller-Managed) | Yes | SELLER | Suspends a rider, preventing further delivery assignment. |
| POST | `/riders/{{riderId}}/reactivate` | Riders (Seller-Managed) | Yes | SELLER | Reactivates a suspended rider. |
| DELETE | `/riders/{{riderId}}` | Riders (Seller-Managed) | Yes | SELLER | Removes a rider from the current seller's roster. |
| GET | `/riders/me/deliveries?page=1&limit=20` | Riders (Seller-Managed) | Yes | RIDER | Lets a logged-in rider view their own past deliveries. |
| GET | `/products?page=1&limit=20&categoryId=%7B%7BcategoryId%7D%7D&subcategoryId=%7B%7BsubcategoryId%7D%7D&shopId=%7B%7BshopId%7D%7D&minPrice=&maxPrice=&currency=USD&search=&inStockOnly=true&city=Goma&sortBy=recent` | Products | No | — | Public product catalog listing with filtering, search, and sorting — powers the storefront browse/search pages. |
| GET | `/products/popular?page=1&limit=20&categoryId=&shopId=&currency=USD&city=` | Products | No | — | Same as List Products but always sorted by `popularityScore` descending (then newest) — used for "trending"/"popular" shelves. |
| GET | `/products/slug/{{productSlug}}` | Products | No | — | Returns full product detail (all images, all variants, shop, reviews) by its public slug — the product detail page. Also increments the product's view counter (used for popularity ranking). |
| POST | `/products` | Products | Yes | SELLER | Creates a new product (in `DRAFT` status) under one of the seller's shops. |
| GET | `/products/shop/{{shopId}}?page=1&limit=20&status=` | Products | Yes | SELLER | Lists all products (any status) for one of the seller's own shops — the seller's product management table. |
| PUT | `/products/{{productId}}` | Products | Yes | SELLER | Updates a product's core fields (not variants/images/status — see the dedicated endpoints for those). |
| POST | `/products/{{productId}}/status` | Products | Yes | SELLER | Transitions a product between `DRAFT`, `PUBLISHED`, and `ARCHIVED`. |
| POST | `/products/{{productId}}/reviews` | Products | Yes | Any authenticated | Submits a buyer rating + comment for a product. |
| POST | `/products/variants/{{variantId}}/stock` | Products | Yes | SELLER | Adjusts a variant's stock level and records a `StockMovement` entry for the audit trail. |
| GET | `/products/variants/{{variantId}}/stock/history?page=1&limit=20` | Products | Yes | SELLER | Lists the audit trail of stock movements for a variant. |
| GET | `/products/categories?includeInactive=false` | Categories & Subcategories | No | — | Lists all categories with their nested subcategories, for building filter menus. |
| GET | `/products/categories/{{categoryId}}` | Categories & Subcategories | No | — | Returns one category with its subcategories. |
| POST | `/products/categories` | Categories & Subcategories | Yes | ADMIN, SUPPORT | Creates a new top-level category. |
| PUT | `/products/categories/{{categoryId}}` | Categories & Subcategories | Yes | ADMIN, SUPPORT | Updates a category's name, sort order, and/or active flag. |
| POST | `/products/categories/{{categoryId}}/subcategories` | Categories & Subcategories | Yes | ADMIN, SUPPORT | Creates a new subcategory under a category. |
| PUT | `/products/categories/subcategories/{{subcategoryId}}` | Categories & Subcategories | Yes | ADMIN, SUPPORT | Updates a subcategory's name, sort order, and/or active flag. |
| DELETE | `/products/categories/subcategories/{{subcategoryId}}` | Categories & Subcategories | Yes | ADMIN, SUPPORT | Deletes a subcategory. |
| DELETE | `/products/categories/{{categoryId}}` | Categories & Subcategories | Yes | ADMIN, SUPPORT | Deletes a top-level category. |
| GET | `/products/exchange-rates` | Exchange Rates | Yes | ADMIN, SUPPORT | Lists all configured currency exchange rates. |
| GET | `/products/exchange-rates/{{exchangeRateId}}` | Exchange Rates | Yes | ADMIN, SUPPORT | Returns one exchange rate record. |
| POST | `/products/exchange-rates` | Exchange Rates | Yes | ADMIN, SUPPORT | Creates a new currency conversion rate. |
| PUT | `/products/exchange-rates/{{exchangeRateId}}` | Exchange Rates | Yes | ADMIN, SUPPORT | Updates the `rate` value on an existing exchange rate record. |
| PUT | `/products/exchange-rates` | Exchange Rates | Yes | ADMIN, SUPPORT | Creates or updates the rate for a `fromCurrency`/`toCurrency` pair in one call, without needing to know the record id first. |
| DELETE | `/products/exchange-rates/{{exchangeRateId}}` | Exchange Rates | Yes | ADMIN, SUPPORT | Deletes an exchange rate record. |
| POST | `/products/exchange-rates/preview` | Exchange Rates | Yes | ADMIN, SUPPORT | Converts an amount between two currencies using the currently configured rate, without persisting anything. |
| GET | `/products/admin?page=1&limit=20&status=&shopId=&search=` | Products (Admin) | Yes | ADMIN, SUPPORT | Lists every product on the platform (any shop, any status) for moderation. |
| GET | `/products/admin/{{productId}}` | Products (Admin) | Yes | ADMIN, SUPPORT | Returns full detail for one product regardless of status/ownership. |
| POST | `/products/admin/{{productId}}/status` | Products (Admin) | Yes | ADMIN, SUPPORT | Force-changes a product's status as a moderation action (e.g. taking down a listing), bypassing the seller-only transition workflow. |
| POST | `/cart/items` | Cart | Yes | Any authenticated | Adds a product variant to the buyer's cart for the given shop (creating the shop's cart if needed). |
| PUT | `/cart/items/{{cartItemId}}` | Cart | Yes | Any authenticated | Changes the quantity of one cart line item. |
| DELETE | `/cart/items/{{cartItemId}}` | Cart | Yes | Any authenticated | Removes one line item from the cart. |
| GET | `/cart` | Cart | Yes | Any authenticated | Lists every shop-scoped cart the current buyer currently has items in. |
| GET | `/cart/shop/{{shopId}}?currency=USD` | Cart | Yes | Any authenticated | Returns the buyer's cart for one specific shop, with items priced (and optionally converted) in the requested currency. |
| POST | `/cart/shop/{{shopId}}/clear` | Cart | Yes | Any authenticated | Empties the buyer's cart for one shop (all line items removed). |
| POST | `/orders/checkout` | Orders | Yes | Any authenticated | Converts the buyer's cart for one shop into an order, optionally kicking off an online mobile-money payment. |
| GET | `/orders/me?page=1&limit=20&status=` | Orders | Yes | Any authenticated | Lists the current buyer's own orders. |
| POST | `/orders/{{orderId}}/cancel` | Orders | Yes | Any authenticated | Cancels an order (buyer- or seller-initiated, depending on who calls it and the order's current status). |
| POST | `/orders/{{orderId}}/confirm-receipt` | Orders | Yes | Any authenticated | Lets the buyer confirm they physically received the order, moving it to `COMPLETED` and releasing the seller's payout hold. |
| GET | `/orders/{{orderId}}/qr-code` | Orders | Yes | Any authenticated | Returns the order's QR payload/token, e.g. to render as a scannable code the seller or rider verifies in person at pickup/handoff. |
| GET | `/orders/{{orderId}}/messages?page=1&limit=50` | Orders | Yes | Any authenticated | Lists the buyer↔rider chat thread for one order (delivery coordination). |
| POST | `/orders/{{orderId}}/messages` | Orders | Yes | Any authenticated | Sends a chat message on the order's buyer↔rider thread. |
| POST | `/orders/{{orderId}}/messages/read` | Orders | Yes | Any authenticated | Marks the order's chat thread as read for the current user. |
| POST | `/orders/scan` | Orders | Yes | Any authenticated | Resolves a scanned QR token to its order — a generic lookup used by whichever handoff-verification step (pickup/delivery) the scanning party is performing. |
| POST | `/orders/{{orderId}}/accept` | Orders | Yes | SELLER | Seller accepts an incoming order, moving it out of `PENDING_SELLER_REVIEW`. |
| POST | `/orders/{{orderId}}/reject` | Orders | Yes | SELLER | Seller rejects an incoming order (e.g. can't fulfill it). |
| POST | `/orders/{{orderId}}/ready` | Orders | Yes | SELLER | Seller marks the order as prepared and ready for pickup/delivery handoff. |
| POST | `/orders/{{orderId}}/complete-pickup` | Orders | Yes | SELLER | For `PICKUP` fulfillment orders: seller confirms the buyer picked up the order in person, typically by scanning the buyer's QR code. |
| POST | `/orders/{{orderId}}/assign-rider` | Orders | Yes | SELLER | Assigns one of the seller's own riders to deliver a `DELIVERY` fulfillment order. |
| GET | `/orders/shop/{{shopId}}?page=1&limit=20&status=` | Orders | Yes | SELLER | Lists all orders placed against one of the seller's shops — the seller's order management queue. |
| POST | `/orders/{{orderId}}/picked-up` | Orders | Yes | RIDER | Rider confirms they've collected the order from the seller. |
| POST | `/orders/{{orderId}}/on-the-way` | Orders | Yes | RIDER | Rider marks the delivery as en route to the buyer. |
| POST | `/orders/{{orderId}}/complete-delivery` | Orders | Yes | RIDER | Rider confirms successful delivery to the buyer, typically by scanning the buyer's QR code. |
| POST | `/orders/{{orderId}}/failed-delivery` | Orders | Yes | RIDER | Rider reports a failed delivery attempt (buyer unreachable, wrong address, etc.). |
| GET | `/orders/rider/me?page=1&limit=20&status=` | Orders | Yes | RIDER | Lists orders currently or previously assigned to the logged-in rider. |
| GET | `/orders/{{orderId}}` | Orders | Yes | Any authenticated | Returns full detail for one order (items, payment, delivery info, timeline). |
| GET | `/orders/admin?page=1&limit=20&status=&search=` | Orders (Admin) | Yes | ADMIN, SUPPORT, ACCOUNTANT | Lists every order on the platform for support/finance review. |
| GET | `/orders/admin/{{orderId}}` | Orders (Admin) | Yes | ADMIN, SUPPORT, ACCOUNTANT | Returns full order detail regardless of participant, for support/finance investigation. |
| POST | `/orders/admin/{{orderId}}/cancel` | Orders (Admin) | Yes | ADMIN, SUPPORT | Force-cancels an order as an admin/support action, independent of the buyer/seller-initiated cancel workflow. |
| POST | `/orders/admin/{{orderId}}/refund/request-approval` | Orders (Admin) | Yes | ADMIN | Step 1 of the OTP-gated refund flow: requests a one-time confirmation code (emailed to the admin) before a refund can be executed. |
| POST | `/orders/admin/{{orderId}}/refund/confirm` | Orders (Admin) | Yes | ADMIN | Step 2 of the OTP-gated refund flow: confirms the pending refund with the emailed one-time code, executing the actual refund to the buyer. |
| POST | `/orders/admin/{{orderId}}/refund` | Orders (Admin) | Yes | ADMIN | Refunds an order directly, without the OTP request/confirm round-trip — a lower-friction alternative for cases that don't need the extra confirmation step. |
| GET | `/wallet/me` | Wallet | Yes | SELLER | Returns the current seller's wallet balances (per currency). |
| GET | `/wallet/me/transactions?page=1&limit=20&type=&status=` | Wallet | Yes | SELLER | Lists the seller's wallet ledger entries. |
| POST | `/wallet/payout/otp` | Wallet | Yes | SELLER | Sends a one-time code to the seller (step 1 of the payout flow) before they can withdraw funds. |
| POST | `/wallet/payout` | Wallet | Yes | SELLER | Withdraws funds from the seller's wallet to their configured mobile-money payout number, after OTP confirmation. |
| POST | `/wallet-settings` | Wallet Settings | Yes | SELLER | Creates the seller's payout configuration (first-time setup). |
| GET | `/wallet-settings/me` | Wallet Settings | Yes | SELLER | Returns the current seller's payout configuration. |
| PUT | `/wallet-settings` | Wallet Settings | Yes | SELLER | Updates the seller's payout configuration. |
| POST | `/subscriptions` | Subscriptions | Yes | SELLER | Subscribes the current seller to a plan and initiates the corresponding mobile-money payment via PawaPay. |
| POST | `/subscriptions/upgrade` | Subscriptions | Yes | SELLER | Switches the current seller's subscription to a different plan, initiating a new payment for the new plan/cycle. |
| GET | `/subscriptions/me` | Subscriptions | Yes | SELLER | Returns the current seller's active/most recent subscription and its plan. |
| GET | `/subscriptions/me/payments?page=1&limit=20` | Subscriptions | Yes | SELLER | Lists the current seller's subscription payment attempts (PENDING/SUCCEEDED/FAILED). |
| POST | `/subscriptions/me/cancel` | Subscriptions | Yes | SELLER | Cancels the current seller's subscription (turns off auto-renew; access typically continues until the current period ends, per plan logic). |
| POST | `/subscriptions/me/reactivate` | Subscriptions | Yes | SELLER | Reactivates a canceled-but-not-yet-expired subscription (re-enables auto-renew). |
| POST | `/subscriptions/payments/{{depositId}}/check-status` | Subscriptions | Yes | SELLER | Manually polls PawaPay for the current status of a subscription payment's deposit, and applies the result (activates the subscription on success, marks it failed on failure) — a fallback for when the webhook callback hasn't arrived yet. |
| GET | `/subscriptions/stats` | Subscriptions | Yes | ADMIN, ACCOUNTANT | Aggregate subscription counts by plan/status, for the admin dashboard. |
| GET | `/subscriptions/revenue` | Subscriptions | Yes | ADMIN, ACCOUNTANT | Aggregate subscription revenue figures, for the admin/finance dashboard. |
| GET | `/subscriptions/admin?page=1&limit=20&status=&planId=` | Subscriptions (Admin) | Yes | ADMIN, ACCOUNTANT | Lists every seller subscription on the platform. |
| GET | `/subscriptions/admin/{{subscriptionId}}` | Subscriptions (Admin) | Yes | ADMIN, ACCOUNTANT | Returns full detail for one subscription. |
| GET | `/plans?includeInactive=false` | Plans | No | — | Lists all active subscription plans with their prices, for the public pricing page. |
| GET | `/plans/slug/{{planSlug}}` | Plans | No | — | Returns one plan by its slug. |
| GET | `/plans/{{planId}}` | Plans | No | — | Returns one plan by its id. |
| POST | `/plans` | Plans | Yes | ADMIN | Creates a new subscription plan (without prices yet — add those via Update Plan Price). |
| PUT | `/plans/{{planId}}` | Plans | Yes | ADMIN | Updates a plan's limits/metadata. |
| PUT | `/plans/{{planId}}/prices` | Plans | Yes | ADMIN | Creates or updates the price for one billing cycle + currency combination on a plan. |
| POST | `/plans/{{planId}}/active` | Plans | Yes | ADMIN | Activates or deactivates a plan (deactivated plans are hidden from the public pricing list and cannot be newly subscribed to). |
| GET | `/invoices/me?page=1&limit=20` | Invoices | Yes | Any authenticated | Lists the current seller's invoices/receipts. |
| GET | `/invoices/me/download/{{invoiceId}}` | Invoices | Yes | Any authenticated | Returns the download data for one of the current seller's own invoices (PDF content/URL). |
| GET | `/invoices/stats` | Invoices | Yes | ADMIN, ACCOUNTANT | Aggregate invoice/billing statistics for the finance dashboard. |
| GET | `/invoices/admin?page=1&limit=20&type=&sellerProfileId=` | Invoices (Admin) | Yes | ADMIN, ACCOUNTANT | Lists every invoice/receipt on the platform. |
| GET | `/invoices/admin/{{invoiceId}}` | Invoices (Admin) | Yes | ADMIN, ACCOUNTANT | Returns the download data for any invoice on the platform. |
| POST | `/pawapay/deposits` | Payments — PawaPay | Yes | ADMIN | Directly initiates a PawaPay collection (deposit) request — mainly for admin testing/manual use; buyer checkout and subscription flows call the underlying service directly rather than this route. |
| GET | `/pawapay/deposits/{{depositId}}` | Payments — PawaPay | Yes | ADMIN, ACCOUNTANT | Checks a PawaPay deposit's current status directly against PawaPay. |
| POST | `/pawapay/payouts/request-approval` | Payments — PawaPay | Yes | ADMIN | Step 1 of the OTP-gated payout flow: validates and stages a PawaPay payout, emailing the admin a confirmation code. |
| POST | `/pawapay/payouts/confirm` | Payments — PawaPay | Yes | ADMIN | Step 2: confirms the staged payout with the emailed OTP, executing it against PawaPay. |
| GET | `/pawapay/payouts/history?page=1&limit=20&status=` | Payments — PawaPay | Yes | ADMIN, ACCOUNTANT | Lists PawaPay payout records for finance review. |
| GET | `/pawapay/payouts/{{payoutId}}` | Payments — PawaPay | Yes | ADMIN, ACCOUNTANT | Checks one PawaPay payout's current status directly against PawaPay. |
| POST | `/pawapay/refunds/request-approval` | Payments — PawaPay | Yes | ADMIN | Step 1 of the OTP-gated refund flow: stages a refund against a previously completed deposit. |
| POST | `/pawapay/refunds/confirm` | Payments — PawaPay | Yes | ADMIN | Step 2: confirms the staged refund with the emailed OTP, executing it against PawaPay. |
| POST | `/pawapay/refunds` | Payments — PawaPay | Yes | ADMIN | Placeholder direct-refund endpoint. It is intentionally disabled in the current implementation — it always responds with a `422` telling the caller to use `POST /pawapay/refunds/request-approval` then `POST /pawapay/refunds/confirm` instead. |
| GET | `/pawapay/refunds/{{refundId}}` | Payments — PawaPay | Yes | ADMIN, ACCOUNTANT | Checks one PawaPay refund's current status directly against PawaPay. |
| GET | `/pawapay/wallet-balances` | Payments — PawaPay | Yes | ADMIN, ACCOUNTANT | Returns SwiftGoma's PawaPay float/wallet balances per currency. |
| GET | `/pawapay/active-configuration?country=COD&operationType=&currency=USD` | Payments — PawaPay | Yes | ADMIN, ACCOUNTANT | Returns PawaPay's currently active countries/providers/currencies — the authoritative source for valid `country`/`provider`/`currency` values to use on every other PawaPay endpoint. |
| POST | `/pawapay/callbacks/deposit` | Payments — PawaPay Callbacks (Webhooks) | No | — | PawaPay calls this to report a deposit's final status (e.g. a subscription payment succeeding or failing). |
| POST | `/pawapay/callbacks/payout` | Payments — PawaPay Callbacks (Webhooks) | No | — | PawaPay calls this to report a payout's (disbursement) final status — updates the corresponding `AdminPayout` record. |
| POST | `/mbiyopay/payin` | Payments — MbiyoPay | Yes | ADMIN | Directly initiates an MbiyoPay cash-in (pay-in) request. |
| POST | `/mbiyopay/payout/request-approval` | Payments — MbiyoPay | Yes | ADMIN | Step 1 of the OTP-gated MbiyoPay payout flow. |
| POST | `/mbiyopay/payout/confirm` | Payments — MbiyoPay | Yes | ADMIN | Step 2: confirms the staged MbiyoPay payout with the OTP. |
| GET | `/mbiyopay/payout/history?page=1&limit=20` | Payments — MbiyoPay | Yes | ADMIN, ACCOUNTANT | Lists MbiyoPay payout records. |
| GET | `/mbiyopay/transactions/{{mbiyopayTransactionId}}` | Payments — MbiyoPay | Yes | ADMIN, ACCOUNTANT | Checks a MbiyoPay transaction's (payin or payout) current status directly against MbiyoPay. |
| GET | `/mbiyopay/balances?currency=USD` | Payments — MbiyoPay | Yes | ADMIN, ACCOUNTANT | Returns SwiftGoma's MbiyoPay wallet balances. |
| GET | `/mbiyopay/balances/networks?currency=USD&countryCode=CD` | Payments — MbiyoPay | Yes | ADMIN, ACCOUNTANT | Returns balances broken down by mobile-money network — also useful as the authoritative list of currently supported networks. |
| GET | `/mbiyopay/countries?all=true&page=1&limit=20` | Payments — MbiyoPay | Yes | ADMIN, ACCOUNTANT | Returns MbiyoPay's supported countries — the authoritative source for valid `countryCode` values elsewhere in this folder. |
| POST | `/mbiyopay/callbacks` | Payments — MbiyoPay Callbacks (Webhooks) | No | — | MbiyoPay calls this to report the outcome of a cash-in (customer payment) or cash-out (payout/refund) transaction. |
| GET | `/payments/transactions?provider=&page=1&limit=20&status=&search=` | Payments — Transactions & Ledger (Admin) | Yes | ADMIN, ACCOUNTANT | Unified list of admin-initiated payout transactions across both PawaPay and MbiyoPay. |
| GET | `/payments/ledger?page=1&limit=20&from=&to=&source=` | Payments — Transactions & Ledger (Admin) | Yes | ADMIN, ACCOUNTANT | Returns a unified financial ledger combining order payments, subscription payments, and admin payouts, for reconciliation/reporting. |
| GET | `/payments/ledger/export/csv?from=&to=&source=` | Payments — Transactions & Ledger (Admin) | Yes | ADMIN, ACCOUNTANT | Exports the payment ledger as a downloadable CSV file. |
| GET | `/accounting/report?from=&to=` | Accounting | Yes | ADMIN, ACCOUNTANT | Builds and returns a financial report (revenue, payouts, fees, etc.) as JSON for on-screen preview before exporting. |
| GET | `/accounting/report/pdf?from=&to=` | Accounting | Yes | ADMIN, ACCOUNTANT | Generates the report as a downloadable PDF and logs the download as an `AccountantReport` (`source: DOWNLOAD`). |
| GET | `/accounting/report/csv?from=&to=` | Accounting | Yes | ADMIN, ACCOUNTANT | Generates the report as a downloadable CSV. |
| POST | `/accounting/report/email` | Accounting | Yes | ADMIN, ACCOUNTANT | Generates the report and emails it to platform admins; logs the action as an `AccountantReport` (`source: EMAIL`). |
| GET | `/accounting/reports?page=1&limit=20` | Accounting | Yes | ADMIN, ACCOUNTANT | Lists previously generated reports (downloaded, emailed, or scheduled). |
| GET | `/accounting/reports/{{reportId}}/pdf` | Accounting | Yes | ADMIN, ACCOUNTANT | Re-downloads a previously generated report's PDF from storage, without regenerating it. |
| GET | `/expenses/meta` | Expenses | Yes | ADMIN, ACCOUNTANT | Returns the list of valid expense categories, for populating a form dropdown. |
| GET | `/expenses?page=1&limit=20&status=&category=` | Expenses | Yes | ADMIN, ACCOUNTANT | Lists recorded expenses. |
| GET | `/expenses/{{expenseId}}` | Expenses | Yes | ADMIN, ACCOUNTANT | Returns full detail for one expense, including its receipt. |
| POST | `/expenses` | Expenses | Yes | ACCOUNTANT | Records a new operational expense, pending admin approval. |
| PUT | `/expenses/{{expenseId}}` | Expenses | Yes | ACCOUNTANT | Updates an expense's details before it's been approved. |
| POST | `/expenses/{{expenseId}}/reject` | Expenses | Yes | ADMIN | Rejects a pending expense. |
| POST | `/expenses/{{expenseId}}/approve/request` | Expenses | Yes | ADMIN | Step 1 of expense approval: validates the payout details and emails the admin a one-time confirmation code. |
| POST | `/expenses/{{expenseId}}/approve/resend` | Expenses | Yes | ADMIN | Resends the OTP for a pending expense approval. |
| POST | `/expenses/{{expenseId}}/approve/confirm` | Expenses | Yes | ADMIN | Step 2: confirms the expense approval with the OTP, triggering the actual payout to the vendor. |
| GET | `/expenses/export/csv?status=&category=` | Expenses | Yes | ADMIN, ACCOUNTANT | Exports expenses as a downloadable CSV. |
| GET | `/dashboard/support-overview` | Dashboard | Yes | ADMIN, SUPPORT | Summary counts for the support queue (open contact messages, pending KYC, incidents, etc.). |
| GET | `/dashboard/support-metrics?days=30` | Dashboard | Yes | ADMIN, SUPPORT | Time-series/aggregate support metrics over a trailing window. |
| GET | `/dashboard/accountant-overview` | Dashboard | Yes | ADMIN, ACCOUNTANT | Summary financial figures for the finance dashboard (pending expenses, revenue snapshot, etc.). |
| GET | `/dashboard/overview` | Dashboard | Yes | ADMIN | Platform-wide summary counts (users, sellers, orders, revenue, etc.) for the main admin dashboard. |
| GET | `/dashboard/metrics?days=30&currency=USD` | Dashboard | Yes | ADMIN | Time-series/aggregate platform metrics over a trailing window. |
| POST | `/support/contact` | Support | No | — | Public "Contact Us" form submission. |
| GET | `/support/messages?page=1&limit=20&status=` | Support | Yes | ADMIN, SUPPORT | Lists submitted contact messages for the support inbox. |
| GET | `/support/messages/{{contactMessageId}}` | Support | Yes | ADMIN, SUPPORT | Returns one contact message's full detail. |
| PATCH | `/support/messages/{{contactMessageId}}` | Support | Yes | ADMIN, SUPPORT | Updates a contact message's status, read flag, and/or assignment. |
| POST | `/support/messages/{{contactMessageId}}/assign-me` | Support | Yes | ADMIN, SUPPORT | Self-assigns a contact message to the calling admin/support agent, a shortcut for the more general Update Contact Message. |
| GET | `/incidents` | Incidents | No | — | Public status-page feed: lists incidents and the platform's current overall status/severity. |
| POST | `/incidents` | Incidents | Yes | ADMIN, SUPPORT | Publishes a new incident to the public status feed. |
| PATCH | `/incidents/{{incidentId}}` | Incidents | Yes | ADMIN, SUPPORT | Updates an incident's status/description/severity as investigation progresses. |
| PATCH | `/incidents/{{incidentId}}/status` | Incidents | Yes | ADMIN, SUPPORT | Alias of Update Incident, typically used from a UI that only changes the status field. |
| GET | `/blog?page=1&limit=20` | Blog | No | — | Lists published blog posts. |
| GET | `/blog/slug/{{blogSlug}}` | Blog | No | — | Returns one published post's full content by slug. |
| GET | `/blog/admin?page=1&limit=20&status=` | Blog | Yes | ADMIN, SUPPORT | Lists all posts (drafts included) for the blog admin table. |
| GET | `/blog/admin/{{blogPostId}}` | Blog | Yes | ADMIN, SUPPORT | Returns full detail for one post regardless of status. |
| POST | `/blog` | Blog | Yes | ADMIN, SUPPORT | Creates a new blog post. |
| PUT | `/blog/{{blogPostId}}` | Blog | Yes | ADMIN, SUPPORT | Updates a post's content/status and/or replaces its cover image. |
| DELETE | `/blog/{{blogPostId}}` | Blog | Yes | ADMIN, SUPPORT | Deletes a blog post. |
| GET | `/storefront/hero` | Storefront — Hero Slides | No | — | Returns the active hero slides for the homepage carousel. |
| GET | `/storefront/admin/hero-slides` | Storefront — Hero Slides | Yes | ADMIN, SUPPORT | Lists every hero slide (active and inactive) for the storefront admin editor. |
| POST | `/storefront/admin/hero-slides` | Storefront — Hero Slides | Yes | ADMIN, SUPPORT | Creates a new hero slide. |
| PUT | `/storefront/admin/hero-slides/{{heroSlideId}}` | Storefront — Hero Slides | Yes | ADMIN, SUPPORT | Updates a hero slide's content, order, active flag, and/or image. |
| DELETE | `/storefront/admin/hero-slides/{{heroSlideId}}` | Storefront — Hero Slides | Yes | ADMIN, SUPPORT | Deletes a hero slide. |
| GET | `/favorites?page=1&limit=20` | Favorites | Yes | Any authenticated | Lists the current user's favorited products (full product detail). |
| GET | `/favorites/ids` | Favorites | Yes | Any authenticated | Returns just the array of favorited product ids — a lightweight call for marking "favorited" hearts on a product grid without fetching full product data. |
| POST | `/favorites/{{productId}}` | Favorites | Yes | Any authenticated | Adds a product to the current user's favorites. |
| DELETE | `/favorites/{{productId}}` | Favorites | Yes | Any authenticated | Removes a product from the current user's favorites. |
