import GlassTabBar from "@/components/navigation/GlassTabBar";
import { BOTTOM_TABS, bottomTabIndex } from "@/lib/navigation/bottomTabs";
import { persistentTabAction } from "@/lib/navigation/persistentTabs";
import { useCartStore } from "@/store/cartStore";
import { useNavigationContainerRef, usePathname, useRouter } from "expo-router";
import { useCallback } from "react";

/** Router/store adapter. The glass bar itself owns no navigation or app state. */
export default function BottomBar() {
  const router = useRouter();
  const navigation = useNavigationContainerRef();
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.cartCount);
  const selectTab = useCallback(
    (index: number) => {
      const tab = BOTTOM_TABS[index];
      if (!tab || tab.route === pathname) return;
      const action = persistentTabAction(navigation.getRootState(), tab.route);
      if (action) navigation.dispatch(action);
      else router.navigate(tab.route);
    },
    [navigation, pathname, router],
  );

  return (
    <GlassTabBar
      activeIndex={bottomTabIndex(pathname)}
      cartCount={cartCount}
      onSelect={selectTab}
    />
  );
}
