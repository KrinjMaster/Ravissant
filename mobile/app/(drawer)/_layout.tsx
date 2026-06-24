import { Drawer } from "expo-router/drawer";
import { SQLiteProvider } from "expo-sqlite";

export default function DrawerLayout() {
  return (
    <SQLiteProvider
      databaseName="main.db"
      assetSource={{ assetId: require("../../assets/main.db") }}
    >
      <Drawer
        screenOptions={{
          headerShown: false,
        }}
      >
        <Drawer.Screen name="index" options={{ title: "Home" }} />
      </Drawer>
    </SQLiteProvider>
  );
}
