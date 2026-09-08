# Phone authentication migration — implementation and release record

**Latest update:** see [live-rollout.md](./live-rollout.md). Production rules have now been deployed after an encrypted Firestore snapshot; the historical release constraints below are superseded where that record says so. Manual provider-validation flags no longer gate runtime behavior; token/signature authentication remains mandatory.

Status: migration remains unreleased; live-data testing and production rollout are blocked on the deployed-rules finding and provider configuration validation below. No production deployment, user migration, account deletion/merge, order reassignment, or data backfill was executed.

Latest verification: see [checkout-verification.md](./checkout-verification.md) for fresh exports, local HTTP checks, live endpoint failures, Firebase configuration and remaining acceptance work.

## Preservation

The pre-implementation baseline is preserved at `node_modules/.cache/auth-migration-baseline-20260906-215430` with base commit, status and SHA256 manifest. Existing working-tree edits were retained. Secrets are excluded. This cache is local and must be retained separately before cleaning dependencies.

## Implemented behavior

- Native Firebase Auth and Firestore share one session. The isolated legacy JS Auth adapter recovers an existing session through a verified-token, same-UID custom-token exchange. Conflicting saved identities stop recovery.
- Phone OTP is primary; existing-account login authenticates email/password ownership before linking a phone credential. Credential collisions stop without merging, deleting or signing into the other account. Phone changes require OTP proof; profile edits cannot set verified identity.
- Pink phone/OTP UI supports India +91, six digits, paste/autofill, native automatic verification callbacks, resend cooldown, change number, request locks, safe errors and optional-email onboarding. Other countries are deliberately not offered pending SMS policy validation.
- Profile bootstrap is transactional/idempotent. Existing fields and balances survive; only genuinely new profiles qualify for onboarding referral rewards. Email is contact information, not order ownership proof.
- UID-scoped listeners and generation/result guards isolate orders, cart, wishlist and profile across logout/account switching. Orders subscribe at the root so direct Order Details navigation works. Failed bootstrap/listeners offer recovery.
- Backend verifies strict Bearer tokens with revocation checking, derives UID, allowlists profile fields and requires recent non-exchanged authentication for deletion. Deletion is resumable and tombstones existing order ownership. The recovery script only processes previously requested pending deletions; it was not executed.
- Order ingestion preserves existing UID/order paths/IDs and tracking fields. Shopify raw-body HMAC and a configuration-gated Shiprocket token check protect webhooks. Unknown ownership queues privately. Delivery coins retain `floor(total / 20)` and are credited in a transaction with the existing reward flag.
- Logged-in checkout always uses the authenticated backend mapping; guest checkout redirects to phone login. There is no direct Storefront fallback or frontend enable flag. New checkout creation remains gated by backend `CHECKOUT_ASSOCIATION_VALIDATED`. Existing associations continue resolving incoming orders if creation is paused. Analytics is best effort; purchase data comes from server-confirmed orders.
- Search analytics preserves the event but replaces raw free text with a length category, preventing contact/address details from entering analytics.

## Material rollout constraints

**Post-OTP failure confirmed (2026-09-07):** an unauthenticated POST to the configured Render backend's `/api/users/me/bootstrap` returned HTTP 404, HTML, and `Cannot POST`. The current mobile app requires this route after Firebase sign-in; the local backend implements it, but the configured live service does not expose it. Retrying OTP cannot fix this deployment mismatch. Deploy the profile routes only after addressing the rules/provider rollout constraints below. The client now distinguishes this missing profile service from an OTP failure. No credentials or customer data were sent by the diagnostic.

**Confirmed critical deployed-rules finding (read-only check, 2026-09-07):** the active Firestore release permits `allow read, write: if true` under `/{document=**}`. It does not protect customer documents or the new server-owned identity/reward/deletion collections. No production rules were changed. Do not enable the migration backend while those collections are client-writable. Coordinate a reviewed rules rollout with old-client compatibility before device tests that use live data. The downloaded rule source and non-secret check summary are stored only in ignored `auth-migration-private-reports/`.

**Do not deploy backend webhook changes with missing/unvalidated secrets.** Shopify rejects invalid signatures. Shiprocket returns unavailable until both its token and validation flag are configured. Deploying prematurely would interrupt ingestion.

**Unverified contact email cannot acquire a new order.** Existing Firestore orders remain attached to their current UID. New orders without a trusted checkout association or matching verified legacy Auth email are retained privately in `unresolvedShopifyOrders`. This differs from insecure editable-email assignment. Phone-only checkout/order display must be tested with the trusted association enabled before rollout; merely adding an email is insufficient proof. No speculative historical-order recovery or automatic account/customer mapping was implemented.

**Older app versions need a coordinated rollout.** Candidate rules deny direct profile/reward writes and protected routes now require tokens. Compare actual deployed rules and old-client usage before applying these rules. Do not deploy the candidate wholesale without that review.

**Tracking event chronology remains a provider validation item.** Duplicate delivery rewards are protected and pending events replay, but a reliable provider event timestamp/order contract has not been established. Out-of-order status events must be tested before promising monotonic tracking; do not invent a status ordering that breaks cancellations/returns.

## Manual Firebase requirements

1. Local configuration comparison confirms native Android, legacy JS and backend Admin credentials identify the same Firebase project. Do not create a replacement project or UID migration.
2. Read-only Auth configuration confirms Phone and email/password providers are enabled and the SMS region allowlist contains India only. SMS billing/quota and designated test numbers still need validation before acceptance testing.
3. Register debug/release/Play App Signing SHA fingerprints for Android. Validate automatic verification and browser fallback on an actual rebuilt app.
4. iOS currently lacks a confirmed bundle identifier and GoogleService-Info.plist configuration. Supply those for the same project, configure APNs/background notifications and reCAPTCHA URL handling, then build and test on macOS/device. JavaScript export alone cannot validate these.
5. Compare deployed Firestore rules with `firestore.rules`, including every collection used by currently released clients. Local emulator tests do not establish deployed protection.
6. Arrange authenticated operational recovery for previously requested deletion jobs via `backend/scripts/resumeRequestedDeletions.js`. Its default is read-only; execution requires both explicit `--execute` and `ALLOW_REQUESTED_DELETION_RECOVERY=true`. Never run it as an account cleanup/migration script.

## Manual Shopify and Shiprocket requirements

- Configure the correct Shopify webhook signing secret and verify an authentic orders/create callback using the original raw request bytes. Preserve current webhook destination/topic and IDs.
- Confirm Storefront credentials/domain/API version and empirically verify that returned cart IDs map to orders/create `cart_token` for this store. Set backend `CHECKOUT_ASSOCIATION_VALIDATED=true` only after validation in a controlled setup. The app now always requires this backend checkout path; do not release the app ahead of it. The former frontend `EXPO_PUBLIC_SECURE_CHECKOUT_ENABLED` flag is no longer used. Test order creation, multiple line items, phone-only/optional-email checkout, ownership isolation and subsequent tracking.
- Confirm Shopify checkout permits phone contact without requiring an email: Settings > Checkout > Customer contact method > Phone number or email ([Shopify documentation](https://help.shopify.com/en/manual/checkout-settings/checkout-form-options)). Backend buyer identity prefills the verified token phone and optional saved profile email ([buyer identity API](https://shopify.dev/docs/api/storefront/latest/objects/cartbuyeridentity)). Changing checkout email does not transfer ownership: the saved checkout association determines the account. Phone/email fields themselves are never accepted as ownership proof.
- Confirm the actual Shiprocket webhook sends the configured secret in `x-api-key`. Replay a genuine provider request before setting `SHIPROCKET_WEBHOOK_VALIDATED=true`. Do not assume a signature/header scheme or change the live provider settings speculatively.
- Review handling/retention and operational monitoring of private unresolved orders and pending tracking, including retries after temporary failures. No Shopify customers or orders are deleted by account deletion.
- Per-process API rate limiting is implemented; multi-instance production needs a shared rate-limit strategy.

## Acceptance work still required

Use explicitly designated test accounts/orders. Verify phone-only signup without email; existing password login and same-UID linking; collision recovery; expiry/rate limits/network failures; skipped/added/changed email; restart during onboarding; OTP reauthentication/deletion retry; old JS-session upgrade; logout/switch during reads/writes; cart/wishlist/address; direct order detail; existing order history and every tracking status/AWB/activity; referral/coin balances; real checkout and duplicate callbacks; Analytics DebugView; Android automatic verification/fallback; iOS fallback. Never use a real customer deletion or order reassignment to test migration.

Native Firebase Firestore requires a new native build; an OTA update alone is insufficient. Validate a signed Play internal-test build and release fingerprints before release. Do not replace an existing device installation or clear its data without an explicitly chosen test setup.

## Reproducible local checks

- `npm run test:auth`: service/adapter regression tests; no production Firebase access.
- `npm run typecheck`: passes after the continuation added the required visible child marker to Mapbox PointAnnotation in `app/Select-Location.tsx`.
- Focused ESLint for `components/auth`, auth/analytics/phone utilities, order subscription and auth/order stores.
- Android and iOS Expo JavaScript exports (not native OTP validation).
- `android/gradlew.bat :app:assembleDebug --offline --console=plain` builds without installation.
- Local candidate rules test: isolated tooling under `node_modules/.cache/auth-validation-tools`, then `firebase emulators:exec --only firestore --project demo-cupid-auth --config firebase.auth-migration.json "node backend/tests/firestoreRules.emulator.cjs"`. Five tests passed, including a realtime order update. Only demo project and localhost are accepted by the test.

The app dependency addition is `@react-native-firebase/firestore@26.1.0`, aligned with existing native Firebase packages. Emulator tooling was installed only in the ignored validation cache (`firebase-tools@14.17.0`, `@firebase/rules-unit-testing@4.0.1`, `firebase@11.10.0`); it does not change application dependencies.

## Final validation results — 2026-09-07

| Check | Result and limit |
| --- | --- |
| Service/mobile-adapter regressions | 38 passed, 0 failed after the OTP checkout continuation. Mocked Auth/Firestore/Shopify adapters; not physical-device OTP or live checkout tests. |
| Candidate Firestore rules emulator | 5 passed, 0 failed, including realtime tracking update. Demo project only. |
| Backend JavaScript syntax | 28 files passed. |
| Focused auth/session/analytics ESLint | Passed. |
| TypeScript | Passed on continuation after adding the required Mapbox marker child in `app/Select-Location.tsx`. |
| Final Android JS export | Passed, `node_modules/.cache/auth-validation/android-final`. |
| Final iOS JS export | Passed, `node_modules/.cache/auth-validation/ios-final`. No iOS native build. |
| Android arm64 debug native build | Passed: `gradlew.bat :app:assembleDebug --offline --max-workers=2 -PreactNativeArchitectures=arm64-v8a --console=plain`. 519 tasks, 9m56s. |
| Android artifact | `android/app/build/outputs/apk/debug/app-debug.apk` (102,271,108 bytes). Not installed. Debug build uses Metro; not a Play release artifact. |
| Project/Phone provider read-only check | Same native/legacy/backend project; Phone and password providers enabled; India SMS allowlist confirmed. |
| Deployed Firestore security | FAILED: active rules allow all reads/writes. No deployment attempted. |
| Production webhook/checkout and native OTP | Not tested; requires validated configuration and designated test accounts/orders. |

Intermediate attempts: sandbox blocked initial emulator download, Gradle-cache access and read-only configuration requests; approved reruns proceeded. One emulator startup timed out under heavy compilation and then passed on retry. An all-platform export and multi-architecture build were interrupted to reduce resource contention; final platform-specific exports and arm64 build passed. An initial shell-inline syntax-check command had quoting errors; the corrected check passed. Gradle emitted deprecation and cross-drive hard-link fallback warnings, with successful final build.

Device readiness: Android artifact is available for a controlled setup, but live-data end-to-end testing is not ready until the deployed rules and backend/provider gates are addressed. iOS additionally requires native app configuration and a macOS build. Production readiness has not been established.

## OTP checkout continuation

- Edit Profile is hidden for guests and direct navigation redirects to phone login. Optional contact email editing remains available after login.
- Both cart checkout actions prompt guests to sign in. Every app checkout creates its UID association on the backend before returning the checkout URL; backend failure never falls back to an unassociated cart.
- Verified token phone and optional profile email prefill buyer identity. Missing/deleting profiles cannot start checkout. Account switching closes the old checkout screen.
- A consumed checkout cannot fall through to email matching for a second order. Previously created checkout mappings still work while new checkout creation is disabled.
- Checkout return opens Orders with a message about delayed order arrival. The realtime order listener supplies confirmed data. Provider tracking text is displayed, and `UNDELIVERED` no longer qualifies as `DELIVERED` in the order list.
- New regression coverage exercises no-email tracking, tracking arriving before order creation, duplicate delivery protection, paused checkout creation, consumed checkout rejection, phone/email prefill, missing profiles, and the absence of client fallback.
- TypeScript passes. Expanded screen ESLint still reports existing display-name, JSX apostrophe, unused-variable and hook-dependency issues in Cart/EditProfile/Orders; this is not a clean whole-screen lint result. Earlier native builds/exports predate these changes and have not been repeated.
- No production backend, Firestore rules, Shopify settings or Shiprocket settings were changed. The missing deployed profile endpoint and live provider validation remain release blockers.

## Exact working-tree file inventory

This includes preserved edits from earlier sessions; it is not a claim that every line was authored during this continuation.

### Modified tracked files

- `.gitignore`
- `app.config.js`
- `app/(tabs)/index.tsx`
- `app/Account.tsx`
- `app/Addresses.tsx`
- `app/Cart.tsx`
- `app/CheckoutWebview.tsx`
- `app/Delivery-Address.tsx`
- `app/EditProfile.tsx`
- `app/Orders.tsx`
- `app/PhoneAuth.tsx`
- `app/ReferAndEarn.tsx`
- `app/Select-Location.tsx`
- `app/Wallet.tsx`
- `app/Wishlist.tsx`
- `app/_layout.tsx`
- `app/order-details/[id].tsx`
- `app/product/[handle].tsx`
- `backend/controllers/userController.js`
- `backend/middleware/verifyFirebaseToken.js`
- `backend/package.json`
- `backend/routes/judgeMeRoutes.js`
- `backend/routes/orderRoutes.js`
- `backend/routes/userRoutes.js`
- `backend/server.js`
- `backend/services/orderService.js`
- `backend/services/userService.js`
- `components/modal/LoginModel.tsx`
- `components/modal/SignUpModel.tsx`
- `components/ui/PhoneAuth.tsx`
- `firebaseConfig.ts`
- `lib/analytics.ts`
- `lib/cart.ts`
- `lib/shopify.ts`
- `package-lock.json`
- `package.json`
- `store/cartStore.ts`
- `store/orderStore.ts`
- `store/userStore.ts`
- `store/wishliststore.ts`

### Added files

- `backend/.env.example`
- `backend/middleware/authPolicy.js`
- `backend/middleware/requestLimit.js`
- `backend/middleware/verifyWebhooks.js`
- `backend/routes/checkoutRoutes.js`
- `backend/scripts/resumeRequestedDeletions.js`
- `backend/services/accountDeletion.js`
- `backend/services/checkoutService.js`
- `backend/services/deletionRecovery.js`
- `backend/services/orderLifecycle.js`
- `backend/services/profileService.js`
- `backend/tests/authMigration.test.js`
- `backend/tests/firestoreRules.emulator.cjs`
- `backend/tests/memoryFirestore.js`
- `backend/tests/mobileAuth.test.js`
- `components/auth/PhoneAuthScreen.tsx`
- `components/auth/PhoneOtpForm.tsx`
- `components/auth/ProfileOnboarding.tsx`
- `components/auth/SessionNotice.tsx`
- `docs/phone-auth-migration.md`
- `firebase.auth-migration.json`
- `firestore.rules`
- `hooks/useOrderSubscription.ts`
- `lib/api.ts`
- `lib/auth.ts`
- `lib/authErrors.ts`
- `lib/checkoutAnalytics.ts`
- `lib/legacyFirebaseAuth.ts`
- `lib/phone.ts`
- `lib/phoneCredential.ts`
- `lib/sessionScope.ts`
- `store/authStore.ts`
