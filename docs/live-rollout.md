# Live OTP checkout rollout

## Current status — 2026-09-08 live rollout

This section supersedes the earlier checklist below.

- Firebase snapshot completed: 444 documents, encrypted with AES-256-GCM and a Windows DPAPI-protected key; saved ciphertext and protected key were decrypted and compared successfully. Backup lives in ignored `auth-migration-private-reports/backup-2026-09-08T06-21-50-107Z`. It covers Firestore, not Auth accounts, Shopify, or Storage. Preserve both backup files and this Windows user's DPAPI access; a database restore has not been exercised.
- Reviewed Firestore rules have now been **published to production**, and the active ruleset was verified. No Firestore document writes/deletions/migrations occurred. Previous release/source information is saved with the backup.
- 42 local regression tests and 5 Firestore emulator tests pass. Local deployment configuration passes.
- Removed the two manual validation booleans from runtime availability. `SHIPROCKET_WEBHOOK_VALIDATED` and `CHECKOUT_ASSOCIATION_VALIDATED` are retired and ignored; keeping them set to false will not block this release. Every webhook still requires the correct signature/token. These code changes do not establish genuine provider delivery.
- `CHECKOUT_ENABLED=false` pauses new checkouts; absent or true permits checkout when credentials/profile/Shopify response/database mapping are valid. Existing orders continue processing while new checkout is paused. Store configuration supports the existing `SHOPIFY_SHOP` slug or `SHOPIFY_STORE` domain.
- Backend deployment verified live on 2026-09-08 after the user reported deployment: `/health` returns 200 with implementation `otp-checkout-v1`; unauthenticated POSTs to `/api/users/me/bootstrap`, `/api/checkout`, and `/api/checkout/status` each return 401 `UNAUTHENTICATED`, with no missing routes. These checks establish deployment and authentication boundaries only. Updated-app OTP/profile/checkout and genuine provider callbacks remain to be verified.
- Testers require the updated app for profile writes/onboarding; old app direct profile/reward writes are denied by the new rules. Existing order ownership/coins have not been moved or reset.

### Live callback boundary check — 2026-09-08

- Both production webhook POST routes reject unsigned requests with 401. With the locally configured Shopify signature / Shiprocket token, an empty payload reaches validation and returns 400 as expected. Empty payloads fail before database writes. This confirms deployed credential agreement and validation, not genuine provider delivery.
- Read-only collection queries (limit 20 each) returned one checkout mapping with no associated order, zero order ownership records, zero unresolved Shopify orders and zero pending tracking events. No completed order association or provider callback can be verified from these records yet; existing legacy user orders were not part of these queries.
- Remaining input: a designated order completed through the updated app, followed by genuine provider delivery evidence. No purchase, shipment, fabricated order or tracking update was created by this check.

### Placed order verification — 2026-09-08

- After the user reported placing an order, read-only checks confirmed order #78416 exists under the UID recorded in its checkout mapping, and `orderOwners` agrees. The profile has no email. Checkout creation timestamp: 2026-09-08T10:51:40.378Z. This establishes a live app checkout-to-order association for an email-free profile.
- This order has no unresolved order record. Its tracking status, AWB, courier and tracking update timestamp are absent; tracking history and matching pending tracking records are empty. Genuine tracking delivery remains unverified.
- Two other unresolved Shopify order records report `unmatched_email`; they were not attributed to this test order or modified.

## Earlier preparation record (superseded above)

Status: code verification completed; production readiness is not established. Live rollout is authorized by the user, but no code push, Render deploy or Firebase rules update has been performed.

## Verified locally

- 41 regression tests pass, including HTTP profile/onboarding, phone-only checkout, signed order ingestion, tracking, optional email updates, account isolation and duplicate delivery rewards.
- TypeScript passes. Backend server and deployment checker syntax checks pass.
- Numeric AWB values become text. Order number `76653` and display value `#76653` both match numeric order number 76653. `channel_order_id` is not substituted speculatively.
- `backend/scripts/checkDeployConfig.js` checks configuration without printing secrets. Run `npm run check:deploy` from `backend`. A zero exit code certifies local configuration only, not provider behavior or live database protection.
- `/health` identifies this implementation as `otp-checkout-v1`. Its HTTP 200 is liveness only, not checkout readiness.

## Current blockers

1. Fresh read of deployed Firestore rules still shows unrestricted wildcard reads/writes. The candidate `firestore.rules` protects new ownership collections but prevents old clients from writing profiles/rewards. Coordinate the updated tester app with the rule change; preserve existing UIDs and data. A code copy is not a database backup. No database backup was created in this verification.
2. `SHIPROCKET_WEBHOOK_VALIDATED` is false. Header type `x-api-key` is supported and the sample passes local tests; genuine delivery and actual order-ID mapping remain unverified.
3. `CHECKOUT_ASSOCIATION_VALIDATED` is false. Genuine Shopify checkout-to-order `cart_token` correspondence has not been observed. Enabling the flag without that check is not validation.
4. Current live profile and checkout routes return 404. The app cannot complete the flow until the new backend is deployed.

## Deployment settings already identified

Render branch: `main`; root directory: `backend`; build: `npm install`; start: `npm start`. Keep the existing service and webhook destinations. Do not disconnect its GitHub repository. Push to `main` may automatically deploy: coordinate environment/rules/app readiness before pushing.

The backend requires Firebase Admin credentials for the existing project, `SHOPIFY_WEBHOOK_SECRET`, `SHIPROCKET_WEBHOOK_TOKEN`, and `SHOPIFY_STOREFRONT_TOKEN`. Checkout reuses `SHOPIFY_STORE` / `SHOPIFY_SHOP` unless `SHOPIFY_STOREFRONT_DOMAIN` is explicitly set. The default Storefront API version is `2026-01`. Preserve Judge.me and other existing settings.

The Shiprocket token previously pasted into chat should be replaced consistently in the provider and both environments before rollout. Never commit .env files or service-account keys.

## Acceptance after coordinated deployment

- Check `/health` for the implementation marker, then unauthenticated POSTs to `/api/users/me/bootstrap`, `/api/checkout` and `/api/checkout/status` for 401 rather than 404.
- In the updated app, verify OTP, profile bootstrap, optional email add/remove, signed-in checkout and preservation of existing UID order history.
- Use a designated controlled provider test to confirm order webhook ownership mapping and tracking. A supplied sample or simulator cannot establish the deployed integration.
- Validate duplicate callbacks and access denial from another account. Do not process the cancelled example shipment or modify a customer's order to test.

No claim is made that an old email-based client remains fully compatible: unverified editable email alone no longer acquires newly placed orders. Existing order documents remain attached to their original UIDs.
