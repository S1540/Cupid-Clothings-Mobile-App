type RouteTree = {
  key?: string;
  index?: number;
  routes: readonly { name: string; state?: RouteTree }[];
};

const SCREENS: Record<string, string> = {
  "/": "index",
  "/Account": "Account",
  "/MaintenanceScreen": "MaintenanceScreen",
};

/** Return to the existing tab host, even when a detail screen sits above it. */
export function persistentTabAction(
  root: RouteTree | undefined,
  pathname: string,
) {
  const screen = SCREENS[pathname];
  if (!screen) return null;
  let state = root;
  while (state) {
    if (state.key && state.routes.some((route) => route.name === "(tabs)")) {
      return {
        type: "NAVIGATE" as const,
        target: state.key,
        payload: { name: "(tabs)", params: { screen }, pop: true },
      };
    }
    state = state.routes[state.index ?? 0]?.state;
  }
  return null;
}
