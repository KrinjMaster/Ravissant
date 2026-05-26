import { ReactElement } from "react";
import { View } from "react-native";

export const QuestionCard = ({ children }: { children: ReactElement }) => (
  <View className="flex-1 w-full h-full bg-secondary-200 rounded-3xl p-10">
    {children}
  </View>
);
