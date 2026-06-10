import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { Text } from "@react-navigation/elements";
import { OnboardProvider } from "@/features/onboard/onboard.provider";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { useOnboard } from "@/hooks/useOnboard";

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
  const { isOnboarded, isLoading } = useOnboard();

  // const [loaded] = useFonts({
  //   Seenonim: require("../assets/fonts/Seenonim.otf"),
  // });
  //
  // if (!loaded) return null;
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
