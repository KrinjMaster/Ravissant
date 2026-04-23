import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SQLiteProvider } from "expo-sqlite";
import { AuthProvider } from "@/features/auth/auth.provider";
import { useAuth } from "@/hooks/useAuth";

export default function RootLayout() {
  const isLoggedIn = useAuth();
  return (
    <AuthProvider>
      <SQLiteProvider databaseName="main.db">
        <Stack>
          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen
              name="login"
              options={{ title: "Login", headerShown: false }}
            />
          </Stack.Protected>
        </Stack>
      </SQLiteProvider>
    </AuthProvider>
  );
}
