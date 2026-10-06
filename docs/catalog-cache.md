# Product loading cache

Home, category lists, product details, menu and review summaries use
`store/catalogStore.ts` through `hooks/useCatalogQuery.ts`.

- Cached data is selected synchronously on route render. Home shows a compact pink
  spinner on a lightly dimmed UI; category and detail screens use a skeleton.
  Each route preview lasts 100 ms on focus or collection changes (Home's dim layer
  also fades out over 80 ms). Home retains its last products during an uncached fetch. The
  content stays mounted underneath, preserving scroll and image loading. Background
  refresh alone does not start the overlay again. Uncached requests keep their
  skeleton until data or an error arrives; the 100 ms setting is not a network deadline.
- Collections/menu/review summaries are fresh for 5 minutes; full product details
  for 1 minute. Focusing a screen after that interval refreshes its data.
- Home pull-to-refresh bypasses freshness. Concurrent requests for the same route
  share a promise. Each response updates only its own route key.
- AsyncStorage restores the cache during startup, with 24-hour retention, at most
  60 entries, and approximately 1.5 MB of persisted JSON. Large entries may remain
  available only in memory. Cache keys include the API host.
- Failed refreshes retain existing data. Cold request failures show retry controls.
- Product details render independently of recently viewed storage and recommendations.
  Cards and gallery use Expo Image's memory/disk image cache.
- Product ordering no longer reshuffles on each Home fetch or detail revisit.
- Shared product cards follow horizontal finger movement on the UI thread and
  spring to the adjacent image. Active and adjacent images stay mounted with no
  source-swap fade. Home/category viewability events preload card images into
  memory/disk; cards also preload their next neighbours. Prefetch work is deduplicated,
  limited to 3 simultaneous requests and a bounded queue; failed requests can retry.
  Swipe/preload checks: `node --test backend/tests/productSwipe.test.js`.
- NetInfo monitors connectivity app-wide and rechecks on return from device
  settings. An offline notice appears above navigation; an uncached catalog screen
  shows a full no-internet state with Retry. Cached data remains visible. On
  reconnection, focused queries retry automatically. HTTP/server errors are not
  labelled as offline unless the connectivity check confirms it.

First visits, evicted entries, and cleared app storage still require a network
request. This cache does not guarantee a fixed route transition time. Personalized
recommendation POSTs, cart, checkout, and account data are outside this public cache.

Validation: `node --test backend/tests/catalogCache.test.js backend/tests/networkState.test.js`
and `npm run typecheck`. The new store/hook pass ESLint; the
existing screen/component files still report their memo-component display-name
errors and hook/unused-variable warnings.

References: [Zustand persist](https://zustand.docs.pmnd.rs/reference/middlewares/persist)
and [Expo Image caching](https://docs.expo.dev/versions/v54.0.0/sdk/image/).
Connectivity uses Expo SDK 54's supported NetInfo 11.4.1:
[Expo NetInfo documentation](https://docs.expo.dev/versions/v54.0.0/sdk/netinfo/).
The NetInfo package is loaded only when `NativeModules.RNCNetInfo` exists (or on
web). Older installed native builds use foreground HTTP reachability checks instead
of crashing: app `/health` first, then the public Google connectivity endpoint if
the app server cannot be reached. Any HTTP status counts as reachable. Checks run
on startup, resume, Retry and every 15 seconds in the foreground, with 4-second
timeouts and shared in-flight checks. This fallback is an estimate of reachability;
it cannot report native network changes instantly. Reload is enough to use the
fallback; rebuilding installs NetInfo for native network events.

Device smoke checks: open Home -> category -> product -> back, revisit the same
routes offline, switch categories rapidly, pull to refresh, then kill/reopen the
app. Cached routes should reveal their UI after the brief 100 ms overlay; verify
fresh prices after refresh. Test airplane mode with and without cached data, then
restore Wi-Fi/mobile data and check automatic recovery. Physical-device frame
timing has not been measured.
