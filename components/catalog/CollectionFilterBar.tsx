import { CupidPalette } from "@/constants/theme";
import { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CatalogFilters,
  emptyFilters,
  Facet,
  filterCount,
  FilterKey,
  money,
  selectionCount,
  SORT_OPTIONS,
  SortOrder,
} from "@/lib/catalogFilters";
import PriceRangeFilter from "./PriceRangeFilter";
import { FilterIce, IceSheen } from "./iceTheme";

type Props = {
  filters: CatalogFilters;
  sort: SortOrder;
  facets: Facet[];
  hasDates: boolean;
  count: number;
  offline: boolean;
  onApply: (filters: CatalogFilters) => void;
  onSort: (sort: SortOrder) => void;
  onSortOpen?: () => void;
  onSortPreview?: (sort: SortOrder) => void;
  onSheetChange?: (open: boolean) => void;
  styleOptions?: { title: string; handle: string }[];
  activeStyle?: string;
  onStyle?: (handle: string) => void;
};

function Choice({
  label,
  selected,
  onPress,
  radio = false,
  onPressIn,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  radio?: boolean;
  onPressIn?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={radio ? "radio" : "checkbox"}
      accessibilityLabel={label}
      accessibilityState={radio ? { selected } : { checked: selected }}
      onPress={onPress}
      onPressIn={onPressIn}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      {selected && <IceSheen />}
      <Text style={[styles.choiceText, selected && styles.accent]}>
        {label}
      </Text>
      <Feather
        name={selected ? "check-circle" : "circle"}
        size={18}
        color={selected ? CupidPalette.ink : CupidPalette.muted}
      />
    </Pressable>
  );
}

function FilterSheet({
  filters,
  facets,
  onClose,
  onApply,
}: Pick<Props, "filters" | "facets" | "onApply"> & { onClose: () => void }) {
  // Mounted once per open: dismissing discards every unconfirmed edit.
  const [draft, setDraft] = useState(filters);
  const [active, setActive] = useState<FilterKey>("price");
  const insets = useSafeAreaInsets();
  const facet = facets.find((item) => item.key === active) ?? facets[0];
  const toggle = (value: string) => {
    const key = facet.key;
    if (key === "price") return;
    if (key === "discount")
      setDraft((previous) => ({
        ...previous,
        discount: previous.discount === Number(value) ? null : Number(value),
      }));
    else
      setDraft((previous) => ({
        ...previous,
        [key]: previous[key].includes(value)
          ? previous[key].filter((item) => item !== value)
          : [...previous[key], value],
      }));
  };
  return (
    <Modal
      visible
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { paddingTop: insets.top + 12 }]}>
        <View
          style={[
            styles.fullSheet,
            { marginLeft: insets.left, marginRight: insets.right },
          ]}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
        >
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text accessibilityRole="header" style={styles.title}>
                Find your fit
              </Text>
              <Text style={styles.subtitle}>
                A little more you. A little less searching.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close filters without applying"
              onPress={onClose}
              style={styles.iconButton}
            >
              <Feather name="x" size={23} color={CupidPalette.ink} />
            </Pressable>
          </View>
          <View style={styles.columns}>
            <ScrollView
              style={styles.navigation}
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              {facets.map((item) => {
                const count = selectionCount(draft, item.key);
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: facet.key === item.key }}
                    accessibilityLabel={`${item.title}${count ? `, ${count} selected` : ""}`}
                    onPress={() => setActive(item.key)}
                    style={[
                      styles.navItem,
                      facet.key === item.key && styles.navActive,
                    ]}
                  >
                    {facet.key === item.key && <IceSheen />}
                    <Text
                      style={[
                        styles.navText,
                        facet.key === item.key && styles.accent,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {count > 0 && <Text style={styles.badge}>{count}</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
            <ScrollView
              key={facet.key}
              style={styles.options}
              contentContainerStyle={styles.optionsContent}
            >
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                {facet.title}
              </Text>
              {facet.key === "price" ? (
                <PriceRangeFilter
                  value={draft.price}
                  onChange={(price) =>
                    setDraft((previous) => ({ ...previous, price }))
                  }
                />
              ) : (
                <View
                  style={facet.key === "sizes" ? styles.sizeWrap : undefined}
                >
                  {facet.options.map((option) => {
                    const key = facet.key;
                    const selected =
                      key === "discount"
                        ? draft.discount === Number(option.value)
                        : key !== "price" && draft[key].includes(option.value);
                    return facet.key === "sizes" ? (
                      <Pressable
                        key={option.value}
                        accessibilityRole="checkbox"
                        accessibilityLabel={`Size ${option.label}`}
                        accessibilityState={{ checked: selected }}
                        onPress={() => toggle(option.value)}
                        style={[
                          styles.sizeChip,
                          selected && styles.choiceSelected,
                        ]}
                      >
                        {selected && <IceSheen />}
                        <Text
                          style={[styles.choiceText, selected && styles.accent]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ) : (
                      <Choice
                        key={option.value}
                        label={option.label}
                        selected={selected}
                        radio={key === "discount"}
                        onPress={() => toggle(option.value)}
                      />
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
          <View
            style={[
              styles.footer,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                paddingLeft: Math.max(insets.left, 16),
                paddingRight: Math.max(insets.right, 16),
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear all temporary filter selections"
              style={styles.clearButton}
              onPress={() => setDraft(emptyFilters())}
            >
              <Text style={styles.accent}>Clear All</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
              style={styles.applyButton}
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
              <Feather name="arrow-right" color={CupidPalette.surface} size={18} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function CollectionFilterBar(props: Props) {
  const {
    filters,
    sort,
    facets,
    count,
    offline,
    onApply,
    onSort,
    hasDates,
    styleOptions = [],
    activeStyle,
    onStyle,
  } = props;
  const [sheet, setSheet] = useState<"filter" | "style" | "sort" | null>(null);
  const onSheetChange = props.onSheetChange;
  useEffect(() => {
    onSheetChange?.(sheet !== null);
    return () => onSheetChange?.(false);
  }, [sheet, onSheetChange]);
  const insets = useSafeAreaInsets();
  const activeCount = filterCount(filters);
  const chips: { key: string; label: string; remove: () => void }[] = [];
  // Include selections even if refreshed metadata no longer exposes their facet.
  for (const key of Object.keys(filters) as FilterKey[]) {
    if (key === "price") {
      if (filters.price)
        chips.push({
          key,
          label: `${money(filters.price[0])}–${money(filters.price[1])}`,
          remove: () => onApply({ ...filters, price: null }),
        });
    } else if (key === "discount") {
      if (filters.discount !== null)
        chips.push({
          key,
          label: filters.discount ? `${filters.discount}%+` : "No Discount",
          remove: () => onApply({ ...filters, discount: null }),
        });
    } else
      for (const value of filters[key])
        chips.push({
          key: `${key}:${value}`,
          label:
            facets
              .find((facet) => facet.key === key)
              ?.options.find((option) => option.value === value)?.label ??
            value,
          remove: () =>
            onApply({
              ...filters,
              [key]: filters[key].filter((item) => item !== value),
            }),
        });
  }
  return (
    <View style={styles.bar}>
      <View style={styles.toolbar}>
        <IceSheen blendHeader />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Filter, ${activeCount} active selections`}
          onPress={() => setSheet("filter")}
          style={[
            styles.toolbarButton,
            activeCount > 0 && styles.toolbarActive,
          ]}
        >
          <Feather
            name="sliders"
            size={17}
            color={FilterIce.accent}
          />
          <Text style={styles.buttonText}>
            Filter{activeCount ? ` · ${activeCount}` : ""}
          </Text>
        </Pressable>
        {styleOptions.length > 0 && onStyle && (
          <>
            <View style={styles.divider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Style, ${styleOptions.find((option) => option.handle === activeStyle)?.title ?? "All"}`}
              onPress={() => setSheet("style")}
              style={styles.toolbarButton}
            >
              <Text style={styles.buttonText}>Style</Text>
              <Feather
                name="chevron-down"
                size={14}
                color={CupidPalette.muted}
              />
              {activeStyle !== styleOptions[0]?.handle && (
                <View style={styles.dot} />
              )}
            </Pressable>
          </>
        )}
        <View style={styles.divider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${SORT_OPTIONS.find((option) => option.value === sort)?.label}`}
          onPress={() => {
            setSheet("sort");
            props.onSortOpen?.();
          }}
          style={styles.toolbarButton}
        >
          <Feather name="arrow-down" size={17} color={FilterIce.accent} />
          <Text style={styles.buttonText}>Sort</Text>
          {sort !== "recommended" && <View style={styles.dot} />}
        </Pressable>
      </View>
      {chips.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {chips.map((chip) => (
            <Pressable
              key={chip.key}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${chip.label} filter`}
              onPress={chip.remove}
              style={styles.activeChip}
            >
              <IceSheen />
              <Text style={styles.chipText}>{chip.label}</Text>
              <Feather name="x" size={14} color={CupidPalette.ink} />
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all applied filters"
            onPress={() => onApply(emptyFilters())}
            style={styles.clearButton}
          >
            <Text style={styles.accent}>Clear All</Text>
          </Pressable>
        </ScrollView>
      )}
      <Text accessibilityLiveRegion="polite" style={styles.count}>
        {count} {count === 1 ? "product" : "products"}
        {offline ? " · Saved collection" : ""}
      </Text>
      {sheet === "filter" && (
        <FilterSheet
          filters={filters}
          facets={facets}
          onApply={onApply}
          onClose={() => setSheet(null)}
        />
      )}
      {(sheet === "sort" || sheet === "style") && (
        <Modal
          visible
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setSheet(null)}
        >
          <View style={[styles.backdrop, { paddingTop: insets.top + 12 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Close ${sheet} options`}
              style={{ flex: 1 }}
              onPress={() => setSheet(null)}
            />
            <View
              accessibilityViewIsModal
              onAccessibilityEscape={() => setSheet(null)}
              style={[
                styles.sortSheet,
                {
                  paddingBottom: Math.max(insets.bottom, 16),
                  paddingLeft: Math.max(insets.left, 20),
                  paddingRight: Math.max(insets.right, 20),
                },
              ]}
            >
              <View style={styles.sheetHeader}>
                <Text accessibilityRole="header" style={styles.title}>
                  {sheet === "style" ? "Style" : "Sort By"}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Close ${sheet} options`}
                  style={styles.iconButton}
                  onPress={() => setSheet(null)}
                >
                  <Feather name="x" size={23} color={CupidPalette.ink} />
                </Pressable>
              </View>
              <ScrollView>
                {sheet === "style"
                  ? styleOptions.map((option) => (
                      <Choice
                        key={option.handle}
                        radio
                        label={option.title}
                        selected={activeStyle === option.handle}
                        onPress={() => {
                          setSheet(null);
                          onStyle?.(option.handle);
                        }}
                      />
                    ))
                  : SORT_OPTIONS.filter(
                      (option) => option.value !== "newest" || hasDates,
                    ).map((option) => (
                      <Choice
                        key={option.value}
                        radio
                        label={option.label}
                        selected={sort === option.value}
                        onPressIn={() => props.onSortPreview?.(option.value)}
                        onPress={() => {
                          setSheet(null);
                          onSort(option.value);
                        }}
                      />
                    ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

export function FilterEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <View style={styles.empty}>
      <Feather name="search" size={32} color={FilterIce.accent} />
      <Text style={styles.title}>No products found</Text>
      <Text style={styles.subtitle}>
        Try adjusting or clearing your filters.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Clear filters"
        onPress={onClear}
        style={styles.clearButton}
      >
        <Text style={styles.accent}>Clear Filters</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: CupidPalette.surface },
  toolbar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: FilterIce.border,
    alignItems: "center",
    overflow: "hidden",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 18,
    backgroundColor: FilterIce.selectedBorder,
  },
  toolbarActive: { backgroundColor: "rgba(206,219,240,0.25)" },
  toolbarButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 13, fontWeight: "700", color: CupidPalette.ink },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FilterIce.accent,
  },
  count: {
    fontSize: 12,
    color: CupidPalette.muted,
    marginHorizontal: 16,
    marginVertical: 7,
  },
  chips: { paddingHorizontal: 14, paddingTop: 8, gap: 8, alignItems: "center" },
  activeChip: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: FilterIce.frost,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: FilterIce.border,
    overflow: "hidden",
  },
  chipText: { fontSize: 12, color: CupidPalette.ink, fontWeight: "600" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  fullSheet: {
    flex: 1,
    backgroundColor: CupidPalette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: CupidPalette.border,
    alignSelf: "center",
    marginTop: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 8,
  },
  title: { fontSize: 20, fontWeight: "700", color: CupidPalette.ink },
  subtitle: {
    fontSize: 12,
    color: CupidPalette.muted,
    marginTop: 6,
    lineHeight: 18,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  columns: {
    flex: 1,
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: FilterIce.border,
  },
  navigation: {
    width: "34%",
    flexGrow: 0,
    backgroundColor: CupidPalette.background,
  },
  navItem: {
    minHeight: 58,
    paddingVertical: 16,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderLeftWidth: 3,
    borderColor: "transparent",
  },
  navActive: {
    backgroundColor: FilterIce.frost,
    borderLeftColor: FilterIce.accent,
  },
  navText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: CupidPalette.muted,
  },
  badge: { fontSize: 11, fontWeight: "700", color: CupidPalette.ink },
  options: { flex: 1 },
  optionsContent: { padding: 14, paddingBottom: 28 },
  sectionTitle: {
    fontSize: 14,
    color: CupidPalette.ink,
    fontWeight: "700",
    marginBottom: 20,
  },
  choice: {
    overflow: "hidden",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: FilterIce.border,
    borderRadius: 12,
    marginBottom: 10,
  },
  choiceSelected: {
    backgroundColor: FilterIce.frost,
    borderColor: FilterIce.selectedBorder,
  },
  choiceText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
    color: CupidPalette.muted,
  },
  accent: { color: CupidPalette.ink, fontWeight: "600" },
  sizeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sizeChip: {
    overflow: "hidden",
    minWidth: 52,
    minHeight: 48,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FilterIce.border,
  },
  footer: {
    flexDirection: "row",
    paddingTop: 14,
    gap: 12,
    borderTopWidth: 1,
    borderColor: FilterIce.border,
    backgroundColor: CupidPalette.surface,
  },
  clearButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: CupidPalette.pink,
    flexDirection: "row",
    gap: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: { fontSize: 14, fontWeight: "700", color: CupidPalette.surface },
  sortSheet: {
    maxHeight: "90%",
    backgroundColor: CupidPalette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  empty: { padding: 32, paddingTop: 56, alignItems: "center", gap: 12 },
});
