/** Metadata is optional so older persisted catalog entries remain usable. */
export type FilterableProduct = {
  price: string | number;
  compareAtPrice?: string | number | null;
  discountPercent?: number | null;
  sizes?: string[];
  availableForSale?: boolean;
  createdAt?: string;
  productType?: string;
  collections?: { handle: string; title: string }[];
};
export type CatalogMenu = {
  title: string;
  handle: string;
  subcategories?: {
    title: string;
    handle: string;
    children?: { title: string; handle: string }[];
  }[];
};
export const MIN_PRICE = 299;
export const MAX_PRICE = 1500;
export const QUICK_PRICES: [number, number][] = [
  [299, 499],
  [500, 749],
  [750, 999],
  [1000, 1249],
  [1250, 1500],
];
export const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
export type MultiKey =
  "sizes" | "categories" | "genders" | "availability" | "types";
export type FilterKey = "price" | "discount" | MultiKey;
export type CatalogFilters = {
  price: [number, number] | null;
  discount: number | null;
} & Record<MultiKey, string[]>;
export const emptyFilters = (): CatalogFilters => ({
  price: null,
  discount: null,
  sizes: [],
  categories: [],
  genders: [],
  availability: [],
  types: [],
});
export type SortOrder =
  "recommended" | "newest" | "priceAsc" | "priceDesc" | "discount";
export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "priceAsc", label: "Price: Low to High" },
  { value: "priceDesc", label: "Price: High to Low" },
  { value: "discount", label: "Discount: High to Low" },
];
export function clampRange(min: number, max: number): [number, number] {
  const lower = Math.round(
    Math.max(
      MIN_PRICE,
      Math.min(MAX_PRICE, Number.isFinite(min) ? min : MIN_PRICE),
    ),
  );
  return [
    lower,
    Math.round(
      Math.max(
        lower,
        Math.min(MAX_PRICE, Number.isFinite(max) ? max : MAX_PRICE),
      ),
    ),
  ];
}
export function discountOf(product: FilterableProduct) {
  const original = Number(product.compareAtPrice),
    price = Number(product.price);
  if (original > 0 && Number.isFinite(price) && price >= 0)
    return Math.max(0, Math.round(((original - price) / original) * 100));
  return Math.max(0, Math.min(100, product.discountPercent ?? 0));
}
export type Facet = {
  key: FilterKey;
  title: string;
  options: { value: string; label: string }[];
};
export function indexCatalog<T extends FilterableProduct>(
  products: T[],
  menu: CatalogMenu[],
) {
  const categoryLabels = new Map<string, string>();
  const genderGroups = menu.filter((top) =>
    /^(men|women|boys|girls|unisex)$/i.test(top.title.trim()),
  );
  for (const top of menu)
    for (const sub of top.subcategories ?? []) {
      categoryLabels.set(sub.handle, sub.title);
      for (const child of sub.children ?? [])
        categoryLabels.set(child.handle, child.title);
    }
  const groups = genderGroups.map((top) => ({
    title: top.title,
    handles: new Set([
      top.handle,
      ...(top.subcategories ?? []).flatMap((sub) => [
        sub.handle,
        ...(sub.children ?? []).map((child) => child.handle),
      ]),
    ]),
  }));
  const rows = products.map((product) => {
    const handles = (product.collections ?? []).map(
      (collection) => collection.handle,
    );
    return {
      product,
      price: Number(product.price),
      discount: discountOf(product),
      date: Date.parse(product.createdAt ?? "") || 0,
      sizes: product.sizes ?? [],
      categories: handles.filter((handle) => categoryLabels.has(handle)),
      genders: groups
        .filter((group) => handles.some((handle) => group.handles.has(handle)))
        .map((group) => group.title),
      availability:
        typeof product.availableForSale === "boolean"
          ? [product.availableForSale ? "in" : "out"]
          : [],
      types: product.productType?.trim() ? [product.productType.trim()] : [],
    };
  });
  const unique = (key: MultiKey) =>
    [...new Set(rows.flatMap((row) => row[key]))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  const facets: Facet[] = [{ key: "price", title: "Price", options: [] }];
  const add = (key: MultiKey, title: string) => {
    const values = unique(key);
    if (values.length)
      facets.push({
        key,
        title,
        options: values.map((value) => ({
          value,
          label: key === "categories" ? categoryLabels.get(value)! : value,
        })),
      });
  };
  add("sizes", "Size");
  add("categories", "Category");
  add("genders", "Gender");
  if (rows.some((row) => row.availability.length))
    facets.push({
      key: "availability",
      title: "Availability",
      options: [
        { value: "in", label: "In Stock" },
        { value: "out", label: "Out of Stock" },
      ],
    });
  facets.push({
    key: "discount",
    title: "Discount",
    options: [0, 10, 20, 30, 40, 50].map((value) => ({
      value: String(value),
      label: value ? `${value}%+` : "No Discount",
    })),
  });
  add("types", "Product Type");
  return { rows, facets, hasDates: rows.some((row) => row.date > 0) };
}
export function selectCatalog<T extends FilterableProduct>(
  index: ReturnType<typeof indexCatalog<T>>,
  filters: CatalogFilters,
  sort: SortOrder,
) {
  const range = filters.price ? clampRange(...filters.price) : null;
  const selected = index.rows.filter((row) => {
    if (
      range &&
      (!Number.isFinite(row.price) ||
        row.price < range[0] ||
        row.price > range[1])
    )
      return false;
    if (
      filters.discount !== null &&
      (filters.discount === 0
        ? row.discount !== 0
        : row.discount < filters.discount)
    )
      return false;
    return (
      ["sizes", "categories", "genders", "availability", "types"] as MultiKey[]
    ).every(
      (key) =>
        !filters[key].length ||
        filters[key].some((value) => row[key].includes(value)),
    );
  });
  if (sort !== "recommended")
    selected.sort((a, b) => {
      if (sort === "newest") return b.date - a.date;
      if (sort === "discount") return b.discount - a.discount;
      if (!Number.isFinite(a.price)) return Number.isFinite(b.price) ? 1 : 0;
      if (!Number.isFinite(b.price)) return -1;
      return sort === "priceAsc" ? a.price - b.price : b.price - a.price;
    });
  return selected.map((row) => row.product);
}
export const selectionCount = (filters: CatalogFilters, key: FilterKey) =>
  key === "price" || key === "discount"
    ? Number(filters[key] !== null)
    : filters[key].length;
export const filterCount = (filters: CatalogFilters) =>
  (Object.keys(filters) as FilterKey[]).reduce(
    (count, key) => count + selectionCount(filters, key),
    0,
  );
