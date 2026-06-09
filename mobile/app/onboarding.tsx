import { View } from "react-native";
import { OnboardCards } from "@/features/onboard/OnboardCards";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

export default function OnboardPage() {
  return (
    <View className="flex-1 justify-center items-center bg-secondary-0">
      <Svg
        width={500}
        height={500}
        style={{
          position: "absolute",
          top: -100,
          right: -200,
        }}
      >
        <Defs>
          <RadialGradient id="glow">
            <Stop offset="0%" stopColor="#00033D" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#00067A" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect width="100%" height="100%" fill="url(#glow)" />
      </Svg>
      <OnboardCards />
    </View>
  );
}
