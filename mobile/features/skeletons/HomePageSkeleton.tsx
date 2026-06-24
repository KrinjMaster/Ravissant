import { Text } from "@/components/ui/text";
import { View } from "react-native";

export const HomePageSkeleton = () => (
  <View className="flex-1 justify-center items-center bg-secondary-0">
    <Text size="6xl">Loading</Text>
  </View>
);
