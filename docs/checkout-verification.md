# Checkout verification — 2026-09-07

Latest live-rollout status is in [live-rollout.md](./live-rollout.md): encrypted Firestore backup completed, reviewed rules deployed, 42 service/HTTP tests and 5 emulator tests pass. Older statements below about undeployed rules and manual validation flags are historical.

## Continuation — 2026-09-08

Latest follow-up: **41 tests pass**. Numeric AWBs are converted to strings for mobile display/copy. Tracking accepts numeric order IDs and digit strings with one optional leading `#`; scientific notation, arrays, booleans, unsafe integers and arbitrary prefixes are rejected. A regression confirms `#76653` events received before order creation replay onto order number 76653. This verifies formatting only, not which ID Shiprocket will send in a genuine callback. `channel_order_id` is not guessed or substituted.

Latest local configuration check confirms both webhook secrets are now present (values were not printed), while `SHIPROCKET_WEBHOOK_VALIDATED` and `CHECKOUT_ASSOCIATION_VALIDATED` remain false. Live profile/checkout endpoints still return 404. Whole-backend deployment remains blocked by provider validation and the previously confirmed open Firestore rules. No deployment or flag changes were performed.

- `npm run test:auth`: **39 passed, 0 failed**. Added `backend/tests/checkoutHttp.test.js`, which runs the real user, checkout and webhook routers through a localhost Express server with isolated test adapters. It verifies bootstrap, optional-email onboarding, phone-only checkout, pending/confirmed order status, email add/change/removal, signed Shopify callbacks, authenticated tracking, duplicate delivery rewards, cross-account denial and deletion-state denial. Provider calls, token verification and database persistence are test doubles; this does not validate native OTP, genuine provider payloads or deployed settings.
- Checkout now reuses the existing `SHOPIFY_STORE` or `SHOPIFY_SHOP` setting when `SHOPIFY_STOREFRONT_DOMAIN` is absent, and defaults the API version to the read-verified `2026-01`. Explicit overrides remain supported. The HTTP test verifies the normalized destination URL and default API version. Missing domain/version overrides alone are no longer configuration blockers when the existing store setting is valid.
- Fresh live read-only check: all three profile/checkout endpoints still return 404; the Storefront shop query still succeeds. No production settings were changed.
- Compatibility audit: existing order paths, order numbers and the delivery reward formula are retained. However, the new webhook authentication requirements and verified-email-only legacy ownership fallback differ from the original backend. An old client checking out without a trusted association and with an unverified email may no longer receive newly placed orders. A coordinated tester update/provider setup is still required; this is not a claim of full old-client compatibility.
- Authentication checks were not disabled as a shortcut. Real-order creation, deploys, account changes and rules updates were not performed.

The sections below record the previous day's checks, not fresh reruns of every platform build.

Verdict: local implementation checks pass, but the configured live application is not ready for the OTP → profile → checkout → tracking flow. No live order, payment, account migration, deployment or security-rule update was performed.

| Check | Fresh result | What it proves |
| --- | --- | --- |
| `npm run test:auth` | 38 passed, 0 failed | Mocked service/mobile regressions, including email-free checkout ownership, tracking replay, duplicate delivery rewards, optional email, guest checkout rejection and no unsafe checkout fallback. |
| `npm run typecheck` | Passed | TypeScript compilation. |
| Backend syntax | 28 JS/CJS files passed | Backend source parses successfully. |
| Firestore demo emulator | 5 passed, 0 failed | Candidate rules isolate users, deny protected writes, permit own cart/address/wishlist operations and deliver realtime tracking updates. Does not validate deployed rules. |
| Android export | Passed on retry | Current Android JavaScript and Hermes bundle export. Output: `node_modules/.cache/auth-validation/android-checkout-verified`. |
| iOS export | Passed | Current iOS JavaScript/Hermes export. Output: `node_modules/.cache/auth-validation/ios-checkout-verified`. Not an iOS native build or device test. |
| Current backend, isolated HTTP process | All three endpoints returned 401 `UNAUTHENTICATED` | Routes are registered and protected before customer data access. Does not prove authenticated production operations. |
| Existing service on localhost:3000 | All three endpoints returned 404 | Existing listener does not expose the new routes. It was not stopped or replaced. |
| Configured live Render backend | All three endpoints returned 404 `Cannot POST` | Current mobile profile/checkout flow cannot complete against this deployment. |
| Shopify read-only Storefront query | HTTP 200, valid shop response, API version 2026-01 | Available token can access Storefront. No cart/order created; cart-token webhook matching remains unverified. |
| Firebase project/provider configuration | Project identities match; Phone and password enabled; India SMS allowlist | Correct project and provider configuration. Does not establish quota, billing, release signing or native OTP behavior. |
| Deployed Firestore rules | Failed: wildcard `allow read, write: if true` | Live customer and ownership data are not protected. Candidate rules have not been deployed. |
| Android device | One authorized device connected | Device is available. App was not installed/replaced and OTP/payment actions were not performed. |

Endpoints checked with unauthenticated empty POST requests: `/api/users/me/bootstrap`, `/api/checkout`, `/api/checkout/status`. These requests did not include credentials or customer data.

Local configuration presence checks found missing `SHOPIFY_WEBHOOK_SECRET`, `SHIPROCKET_WEBHOOK_TOKEN`, `SHOPIFY_STOREFRONT_DOMAIN`, and `SHOPIFY_STOREFRONT_API_VERSION`. `CHECKOUT_ASSOCIATION_VALIDATED` and `SHIPROCKET_WEBHOOK_VALIDATED` were not enabled. Storefront token was present and passed the read-only query using the mobile domain as a diagnostic fallback. These are local environment findings, not an inspection of Render's environment variables. No secret values were printed.

Verification required approved retries for Firebase CLI configuration access, live network checks, ADB configuration and local HTTP access. Initial Android export reached the Hermes compiler and crashed; the approved retry with two workers passed. Firebase emulator permission-denied messages were expected negative-test results.

The backend now respects `PORT`, retaining 3000 as its default. This allowed the actual current server to be verified on an isolated free port without interfering with the existing listener. The temporary server was stopped after verification.

## Remaining acceptance work

1. Review and apply production Firestore protection with existing-client compatibility.
2. Configure and deploy the current backend, including profile routes and validated webhook credentials. Recheck unauthenticated endpoints for 401 instead of 404.
3. Verify Shopify permits phone-or-email contact and validate a designated test checkout's cart ID against the genuine signed order webhook's `cart_token`. Do not enable the checkout validation flag based on the read-only shop query.
4. With a designated test account/order, exercise OTP login, optional email save/change, email-free checkout, order arrival, tracking updates and duplicate callbacks. Confirm existing orders remain on their original UID and another account cannot read them.
5. Complete native device validation. Existing APK/native-build results predate the current JavaScript changes; iOS additionally lacks confirmed native app configuration and requires macOS.

Earlier expanded ESLint still has existing screen issues documented in `phone-auth-migration.md`; this verification does not claim a clean repository-wide lint result.
