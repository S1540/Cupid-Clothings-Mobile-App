# Search

`app/Search.tsx` contains a stable input, a 48-point microphone button with extra
hit slop, popular searches, and related-style suggestions. Submit or tap a row to
open `app/SearchResults.tsx`; suggestions never link directly to a product.

Search results use `components/catalog/CollectionPage.tsx`, based on the category
layout with the same product-card and filter/sort components, loading/offline
behavior, and similar-product sheet. Product cards open product details normally.
Home and Search placeholders keep "Search" fixed while typing Styles, Plus Size,
and Kids Wear. Animation pauses for entered text, background/inactive screens,
and reduced-motion settings.

The pure matcher in `backend/lib/searchRelevance.js` runs in both the API and app.
All meaningful query terms must match title, handle, type, or vendor. Description
cross-selling and substring matches such as `men` inside `women` are excluded.
Common garment plurals and t-shirt spellings normalize together. The final word
can be a prefix for suggestions. No unrelated fallback fills empty results.

Deploy the backend service changes to return up to 100 ranked results and include
size, availability, date, and collection metadata for result filters. The mobile
matcher also cleans old API/cached responses, but cannot recover relevant products
that an older API omitted. This search remains bounded, without pagination.

Validation: TypeScript, ESLint, search relevance and catalog filter tests, plus
Android visual/navigation checks. Voice transcription requires device permission
and the device speech recognition service.
