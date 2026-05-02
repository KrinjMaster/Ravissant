import { ReactElement } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { spacing } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

export const QuestonCard = ({ children }: { children: ReactElement }) => (
  <View style={styles.card}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    height: height * 0.8,
    width: width,
    borderColor: "red",
    borderWidth: 1,
  },
});
