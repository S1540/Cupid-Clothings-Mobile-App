export const BOTTOM_TABS = [
  { label: "Home", route: "/", icon: "home-outline" },
  { label: "Account", route: "/Account", icon: "person-outline" },
  { label: "Studio", route: "/MaintenanceScreen", icon: "camera-outline" },
  { label: "Cart", route: "/Cart", icon: "bag-outline" },
] as const;

export type BottomTab = (typeof BOTTOM_TABS)[number];

export function bottomTabIndex(pathname: string) {
  return BOTTOM_TABS.findIndex((tab) => tab.route === pathname);
}

/** Continuous slot position, clamped to the centers of the outer tabs. */
export function tabPositionAt(x: number, width: number, count: number) {
  "worklet";
  if (width <= 0 || count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, x / (width / count) - 0.5));
}
