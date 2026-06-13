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
// import { useFonts } from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  if (process.env.EXPO_PUBLIC_RESET_STORAGE) {
    AsyncStorage.removeItem("user_data");
  }

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
