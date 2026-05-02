import { Dimensions, View } from "react-native";
import { OnboardCards } from "@/features/onboard/OnboardCards";
import { colors } from "@/constants/theme";
import { StyleSheet } from "react-native";

export default function OnboardPage() {
  return (
    <View style={styles.container}>
      <OnboardCards />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bgPrimary,
    height: Dimensions.get("window").height,
  },
});
