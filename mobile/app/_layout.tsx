import { Stack } from "expo-router";
import { Text } from "@react-navigation/elements";
import { OnboardProvider } from "@/features/onboard/onboard.provider";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { useOnboard } from "@/hooks/useOnboard";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { deleteDatabaseAsync, SQLiteProvider } from "expo-sqlite";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import AsyncStorage from "@react-native-async-storage/async-storage";
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (process.env.EXPO_PUBLIC_RESET_DB === "true") {
          console.log("RESET DB");

          await deleteDatabaseAsync("main.db");
        }

        if (process.env.EXPO_PUBLIC_RESET_STORAGE === "true") {
          console.log("RESET STORAGE");

          await AsyncStorage.removeItem("user_data");
        }
      } catch (e) {
        console.log("reset error", e);
      } finally {
        setDbReady(true);
      }
    };

    init();
  }, []);

  if (!dbReady) {
    return <Text>Loading DB...</Text>;
  }

  return (
    <SQLiteProvider
      databaseName="main.db"
      assetSource={{ assetId: require("../assets/main.db") }}
    >
      <QueryClientProvider client={queryClient}>
        <GluestackUIProvider mode="dark">
          <OnboardProvider>
            <RootStack />
          </OnboardProvider>
        </GluestackUIProvider>
      </QueryClientProvider>
    </SQLiteProvider>
  );
}

function RootStack() {
  const { isOnboarded, isLoading } = useOnboard();

  // if (process.env.EXPO_PUBLIC_RESET_STORAGE === "true") {
  //   console.log("RESET STORAGE");
  //   AsyncStorage.removeItem("user_data");
  // }
  //
  // if (process.env.EXPO_PUBLIC_RESET_DB === "true") {
  //   console.log("RESET DB");
  //   async function resetDB() {
  //     await deleteDatabaseAsync("main.db");
  //   }
  //
  //   resetDB();
  // }

  const [loaded] = useFonts({
    Seenonim: require("../assets/fonts/Seenonim.otf"),
  });

  if (isLoading || !loaded) return <Text>Loading...</Text>;

  return (
    <Stack screenOptions={{ gestureEnabled: true }}>
      <Stack.Protected guard={isOnboarded}>
        <Stack.Screen name="modal" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isOnboarded}>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isOnboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
