import { View, Text } from "react-native";
import { OnboardCards } from "@/features/onboard/OnboardCards";

export default function OnboardPage() {
  return (
    <View className="flex-1 justify-center items-center bg-background-50">
      <OnboardCards />
    </View>
  );
}
