import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      backBehavior="initialRoute"
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        // Build all three screens once and retain their native views and state.
        lazy: false,
        animation: "none",
        popToTopOnBlur: false,
        sceneStyle: { backgroundColor: "#f6f6f6" },
      }}
      tabBar={() => null}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="Account"
        options={{ title: "Account", headerShown: true }}
      />
      <Tabs.Screen
        name="MaintenanceScreen"
        options={{ title: "Studio", headerShown: true }}
      />
    </Tabs>
  );
}
