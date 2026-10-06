import { rankSearchProducts, tokenizeSearch } from "@/backend/lib/searchRelevance";

type Product = { id: string; title: string; handle: string; productType?: string; images: { url: string }[] };
export type SearchSuggestion = { id: string; label: string; query: string; image?: string };
const styles: [RegExp, string][] = [
  [/polo.*t[ -]?shirts?/i, "Polo T-shirts"],
  [/track\s*pants?/i, "Track Pants"],
  [/night\s*suits?/i, "Night Suits"],
  [/kurti/i, "Kurtis"],
  [/kurta/i, "Kurtas"],
  [/shorts/i, "Shorts"],
  [/t[ -]?shirts?/i, "T-shirts"],
  [/shirts?/i, "Shirts"],
  [/tops?/i, "Tops"],
  [/pants?|trousers?/i, "Pants"],
  [/dress(?:es)?/i, "Dresses"],
];

export function buildSearchSuggestions(products: Product[], query: string): SearchSuggestion[] {
  const matches = rankSearchProducts(products, query);
  const tokens = tokenizeSearch(query);
  const suggestions = new Map<string, SearchSuggestion>();
  for (const product of matches) {
    const style = styles.find(([pattern]) => pattern.test(product.title))?.[1] || product.productType;
    if (!style) continue;
    const extra = tokenizeSearch(style).filter((token) => !tokens.includes(token));
    if (!extra.length) continue;
    const nextQuery = `${query.trim()} ${extra.join(" ")}`;
    if (!rankSearchProducts([product], nextQuery).length) continue;
    const id = tokenizeSearch(nextQuery).sort().join(" ");
    suggestions.set(id, { id, label: `${query.trim()} · ${style}`, query: nextQuery, image: product.images?.[0]?.url });
  }
  return [...suggestions.values()].slice(0, 8);
}
