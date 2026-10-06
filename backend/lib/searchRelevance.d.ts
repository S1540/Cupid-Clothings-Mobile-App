export type SearchableProduct = {
  id: string;
  title: string;
  handle?: string;
  productType?: string;
  vendor?: string;
};
export function normalizeSearch(value: string): string;
export function tokenizeSearch(value: string): string[];
export function scoreSearchProduct(product: SearchableProduct, tokens: string[]): number;
export function rankSearchProducts<T extends SearchableProduct>(products: T[], query: string): T[];
