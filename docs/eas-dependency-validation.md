# Android EAS dependency fix — 2026-09-12

## Root cause aur reproducible evidence

Investigation ke start par HEAD `5dd63a893ee8c6791882e69a5212bf23f4fab859` tha. Root manifest/lock tracked the; sirf `docs/live-rollout.md` pehle se modified tha.

- Root `firebase@11.10.0` ne `@firebase/auth@1.10.8` aur compat branch ka wahi Auth version install kiya tha. Dono ka optional AsyncStorage peer `^1.18.1` tha. Optional hone ka matlab installed incompatible version valid hona nahi hai.
- Root AsyncStorage `2.2.0` tha. Baseline `npm ls` ne `ELSPROBLEMS` aur `invalid` report kiya.
- RNFirebase app `26.1.0` internally `firebase@12.17.0` maangta tha. Isliye old lock mein Firebase 11 aur 12 ke duplicate trees the.
- Original manifest/lock ki empty directory copy par npm `10.8.2` ka actual `npm ci --include=dev` exit 1 hua: `Missing: @react-native-async-storage/async-storage@1.24.0 from lock file` twice. Yeh old Auth ki do branches ke missing peer resolutions hain.
- Local npm `11.16.0` ka dry-run pass tha. Dry-run/offline success actual clean install ka substitute nahi hai.

Baseline log ignored local path `auth-migration-private-reports/dependencies/baseline-ci-npm10.log` mein hai.

## Architecture decision

Root JS SDK abhi required hai. `lib/legacyFirebaseAuth.ts` original default app aur AsyncStorage persistence se old session recover karta hai. `lib/auth.ts` old ID token ko `/api/users/session/native` par exchange karke native custom-token login karta hai, UID equality verify karta hai, aur uske baad old session sign out karta hai. `app/_layout.tsx` startup par yeh recovery chalata hai. Account logout/deletion bhi dual-session sign-out use karte hain.

Native Auth purane JS SDK ke AsyncStorage session ko directly read nahi karta. Bridge remove karne se existing installs ka seamless session migration lose hota. Isliye bridge, original Firebase config aur persistence keys preserve kiye gaye; root Firebase exact `12.17.0` par align kiya gaya. RNFirebase ki internal dependency bhi retained aur deduped hai.

Normal Auth/phone OTP aur Firestore pehle se RNFirebase use karte hain. Analytics bhi native SDK par hai. Backend apna independent `firebase-admin` use karta hai; backend manifest/lock change nahi hue.

## Dependency changes

- Root Firebase: `^11.10.0` → exact `12.17.0`.
- RNFirebase app/auth/analytics: `^26.1.0` → exact `26.1.0`; Firestore already exact `26.1.0` tha. Matching native-module peers ko future partial update se bachaya gaya.
- AsyncStorage exact `2.2.0` unchanged. Installed Expo SDK 54 ke `bundledNativeModules.json` mein bhi `2.2.0` hai. Firebase Auth `1.13.4` ka peer `^2.2.0 || ^3.0.0` isko accept karta hai.
- Lock npm install ne regenerate kiya. Duplicate Firebase branches remove hui. Firebase tree ke bahar sirf grpc/proto-loader dependency `protobufjs` ka allowed patch `7.6.5` → `7.6.6` resolve hua; unrelated top-level versions unchanged hain.
- Koi force, legacy-peer-deps, overrides, manual lock edit ya node_modules patch use nahi hua.

Official references: [Expo SDK 54 AsyncStorage](https://docs.expo.dev/versions/v54.0.0/sdk/async-storage/), [Firebase JS release notes](https://firebase.google.com/support/release-notes/js), [RNFirebase platform implementation](https://rnfirebase.io/platforms).

## Regression coverage

`backend/tests/legacySession.test.js` same-UID recovery, account conflict, failed exchange retry, wrong-UID rollback, already-migrated session aur dual logout cover karta hai. Actual Firebase RN Auth entry aur actual `getLegacyAuth()` bridge Firebase 11 se serialized synthetic fixture restore karte hain. Fixture mein koi real identity, token ya Firebase configuration nahi hai. Network intentionally offline hai.

## EAS source selection

Root mein `package-lock.json` hi applicable npm lock hai; yarn/pnpm lock, `.npmrc`, `.easignore` aur custom EAS install hooks nahi mile. `backend/package-lock.json` separate backend project ka hai; root EAS install usko select nahi karta. Root manifests gitignore se excluded nahi hain.

Failed remote build ka commit/archive access is investigation mein available nahi tha. Current original lock se error independently reproduce hua; stale commit hona root cause prove karne ke liye zaroori nahi hai. Lekin old commit/archive dobara build karne par wahi issue rahega. Updated `package.json` aur `package-lock.json` ek saath build source mein hone chahiye. EAS command repository root se run karein; Git-triggered build ke liye dono files wala commit push hona chahiye.

Local environment Windows, Node `24.14.1` hai; npm `11.16.0` aur isolated npm `10.8.2` use hue. Linux/WSL available nahi hai. Actual EAS Linux native production build aur physical-device OTP smoke test alag validation hain.

## Final validation

| Check | Result |
| --- | --- |
| `npm install` | PASS; npm-generated lock |
| Root `npm ci` | PASS, exit 0 |
| Root `npm ci --include=dev` | PASS, exit 0 |
| Empty-directory npm 10.8.2 `npm ci --include=dev` | PASS, 1156 packages installed; original files par same command FAIL tha |
| Requested Firebase/AsyncStorage `npm ls` | PASS; koi invalid dependency nahi |
| `npm why firebase` / `npm why @react-native-async-storage/async-storage` | PASS; root aur RNFirebase ek Firebase version share karte hain; Auth peer AsyncStorage 2.2.0 accept karta hai |
| Fresh install `npm ls --all --json` | PASS; problems list empty |
| `npm run typecheck` | PASS before aur after; reported Mapbox error current checkout mein reproduce nahi hua |
| `npm run test:auth` | 49/49 PASS, baseline 42/42 tha |
| Firestore emulator | 5/5 PASS; own/cross-account access, protected fields, cart/address/wishlist CRUD, deletion isolation aur realtime order update covered |
| `npm run lint` | Existing 72 errors, 110 warnings before aur after; unrelated JSX/display-name/hooks issues |
| Focused auth/legacy-session test ESLint | PASS after new test ke path resolution correction |
| `npx expo install --check` | PASS: Dependencies are up to date |
| Android Expo export, 2 workers | PASS; Hermes bundle 7.24 MB, `node_modules/.cache/dependency-validation/android` |
| `git diff --check` | PASS |

Actual installs mein normal lifecycle scripts enabled the; koi `--force`, `--legacy-peer-deps` ya `--ignore-scripts` use nahi hua. Initial diagnostic dry-run mein `--ignore-scripts` tha; woh final validation proof nahi hai. npm 11 ne default allow-scripts policy warnings dikhayi; npm 10 fresh install bhi normal lifecycle scripts ke saath pass hua. npm audit ne 34 advisories (23 moderate, 11 high) report ki; audit remediation is dependency fix mein perform nahi hui.

Final lock SHA-256: `0c115d3c7922a58f12d79b8091a45e4ed6160020cebb0834ca485cf8618e0f57`. Independent npm 10 install ke baad bhi same hash hai. Detailed execution logs `auth-migration-private-reports/dependencies/` mein ignored local artifacts hain. Firestore tooling existing test harness ke expected ignored cache mein npm se install hua; application dependencies mein add nahi hua.

Final changes sirf root manifest/lock, new legacy-session test + synthetic fixture, aur yeh report hain. Pehle se modified `docs/live-rollout.md` untouched hai. Firebase config, OTP migration, backend, Shopify/Shiprocket integration aur feature implementation unchanged hain. Automated coverage pass hai; physical-device OTP, live payment/order flow aur EAS native compilation is run mein execute nahi hue.

Dependency/install gate EAS production build attempt ke liye ready hai. Full production release ko sirf local npm/JS export results se certified nahi maana ja sakta. Root se updated source ke saath `eas build --platform android --profile production` run kiya ja sakta hai; old commit/archive rebuild karne se fixed lock use nahi hoga.
