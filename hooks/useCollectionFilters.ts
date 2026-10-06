import {
  CatalogFilters,
  CatalogMenu,
  emptyFilters,
  FilterableProduct,
  indexCatalog,
  selectCatalog,
  SortOrder,
} from "@/lib/catalogFilters";
import { useMemo, useState } from "react";

export function useCollectionFilters<T extends FilterableProduct>(
  products: T[],
  menu: CatalogMenu[],
  scope: string,
) {
  const [state, setState] = useState<{
    scope: string;
    filters: CatalogFilters;
    sort: SortOrder;
  }>({ scope, filters: emptyFilters(), sort: "recommended" });
  const defaults = useMemo(emptyFilters, []);
  if (state.scope !== scope)
    setState({ scope, filters: defaults, sort: "recommended" });
  const filters = state.scope === scope ? state.filters : defaults;
  const sort = state.scope === scope ? state.sort : "recommended";
  const index = useMemo(() => indexCatalog(products, menu), [products, menu]);
  const results = useMemo(
    () => selectCatalog(index, filters, sort),
    [index, filters, sort],
  );
  return {
    index,
    filters,
    sort,
    results,
    setFilters: (next: CatalogFilters) =>
      setState({ scope, filters: next, sort }),
    setSort: (next: SortOrder) => setState({ scope, filters, sort: next }),
  };
}
