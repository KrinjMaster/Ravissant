import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { Text } from "@react-navigation/elements";
import { OnboardProvider } from "@/features/onboard/onboard.provider";
import { useOnboard } from "@/hooks/useOnboard";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { useEffect } from "react";
import { getData } from "@/utils/storage";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="dark">
      <OnboardProvider>
        <SQLiteProvider databaseName="main.db">
          <RootStack />
        </SQLiteProvider>
      </OnboardProvider>
    </GluestackUIProvider>
  );
}

function RootStack() {
  const { isOnboarded, isLoading, loadOnboardState } = useOnboard();

  useEffect(() => {
    loadOnboardState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <Text>Loading</Text>;

  return (
    <Stack>
      <Stack.Protected guard={isOnboarded}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isOnboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
