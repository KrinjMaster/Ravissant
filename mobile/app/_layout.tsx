import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { Text } from "@react-navigation/elements";
import { OnboardProvider } from "@/features/onboard/onboard.provider";
import { useOnboard } from "@/hooks/useOnboard";

export default function RootLayout() {
  return (
    <OnboardProvider>
      <SQLiteProvider databaseName="main.db">
        <RootStack />
      </SQLiteProvider>
    </OnboardProvider>
  );
}

function RootStack() {
  const { isOnboarded, isLoading } = useOnboard();

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
