# Collection filters

Filtering and sorting are integrated only in `app/category/[handle].tsx`. Home,
product cards, cart, wishlist, navigation and recommendation ordering are unchanged.

The collection header uses one full-width `Filter | Style | Sort` bar directly
against the header, with no top gap or side margins and a fine bottom divider.
The controls always remain visible at the top of the collection. Away from the
top, they slide under the header after two seconds without activity, and reappear
when scrolling back. Forward scrolling does not hide them immediately. Open sheets pause
auto-hide; screen-reader users keep the controls visible. The bar is an absolute
overlay with a transform-only slide, so showing or hiding it never resizes or
shifts the product grid. A fixed-height list header keeps the first products
clear of the visible controls at the top and scrolls away with the list.
Style appears when the existing menu provides child collections; its sheet contains
All plus those child styles and reuses the existing collection selection path.
Sort/Style sheets dismiss without an animation wait. Collection cards have stable
callbacks during reordering, the grid batches eight cards every 16 ms, and the first
eight result images use the existing preloader. Sorting remains synchronous and local;
no one-second timer or network request is introduced. End-to-end device timing and
uncached image downloads are not guaranteed by these changes.
Opening Sort warms the leading four product images for the available alternative
orders using the existing bounded preloader. Pressing an option promotes its first
eight images ahead of queued offscreen work without duplicating active downloads;
the order update never waits for the preload. Offline skips speculative preloads.

Collection controls use the same translucent ice gradient and soft white overlay as
Home Hot Deals, via `components/catalog/iceTheme.tsx`. Selected options, chips and
the price panel have a pastel ice finish; slider accents use pale frost with fine
borders. Text and selection marks stay dark. Apply retains pink `#F87387`.

The existing collection endpoint adds Shopify `availableForSale`, `createdAt`,
size option values, `productType` and collection membership. Category choices use
the existing menu's subcategory handles. Gender uses membership in the existing
Men/Women/Boys/Girls/Unisex menu branches, never a title substring. Offers and
popularity are omitted because the catalog has no reliable per-product fields.
Newest is available when creation dates exist. Recommended retains API ordering.
Availability means Shopify's sale status, not a fabricated inventory quantity.
Size and availability are product-level filters, not a guarantee a selected size
is available; the existing variant selection and checkout remain authoritative.

No additional catalog requests, store or cache were added. Filters run against
the loaded collection, including offline snapshots. The existing endpoint returns
up to 250 products and has no pagination contract; counts and filters describe
that loaded set. Collections larger than 250 retain this existing limitation.
The menu now uses the same cached query hook on collection pages, allowing stale
cached menu data to remain available offline. Product metadata is indexed only
when the products/menu change, then filtered/sorted only when applied state changes.
Slider movement updates only the sheet draft; no query or full-list scan occurs.

Deploy the backend addition with the mobile change to enable metadata-dependent
filters. Old cached responses still support price and discount; metadata-dependent
facets appear after the normal catalog refresh. No cache migration is necessary.
The additive response follows [Shopify's Product schema](https://shopify.dev/docs/api/storefront/latest/objects/Product).

Apply commits temporary choices; close/Android Back discards them. Clear All in
the sheet is temporary until Apply. Chip removal and Clear Filters are immediate.
Changing collection resets filters and sorting. Prices clamp to ₹299–₹1,500 and
quick ranges share the same tuple as the dual slider. Screen readers can adjust
each handle with increment/decrement actions. Filters combine OR within each
multi-select group and AND between groups. No Discount is a distinct zero value.

Checks: `npm run typecheck`, ESLint on the new filter modules, and
`node --test backend/tests/catalogFilters.test.js backend/tests/catalogCache.test.js backend/tests/networkState.test.js backend/tests/productSwipe.test.js`.
Android production bundling also passed with `npx expo export --platform android
--max-workers 2 --output-dir node_modules/.cache/catalog-filters-export`.

Device acceptance: open a collection, apply multiple sizes and a quick price,
reopen and move both handles (including equal endpoints), cancel and verify the
previous selection, then apply and remove chips. Check no-results recovery,
Recommended restoration, category switching, Android Back, screen reader slider
actions, large text, landscape, cached offline entry and online refresh. Check
card image swiping, wishlist and product navigation after filtering. Native device
interaction and live Shopify metadata still need a deployment/device smoke check.
