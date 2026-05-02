import { View, StyleSheet } from "react-native";
import { colors, radius } from "@/constants/theme";

export const PaginationDots = ({
  length,
  current,
  height,
  width,
}: {
  length: number;
  current: number;
  height: number;
  width: number;
}) => {
  const arr = Array.from({ length });
  const styles = StyleSheet.create({
    container: {
      width: width,
      height: height,
      borderWidth: 1,
      borderColor: "red",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: height / 3,
    },
    dot: {
      backgroundColor: colors.accentPrimary,
      width: height,
      height: height,
      borderRadius: radius.full,
    },
    dot_active: {
      backgroundColor: colors.accentOther,
    },
  });

  return (
    <View style={styles.container}>
      {arr.map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current ? styles.dot_active : {}]}
        ></View>
      ))}
    </View>
  );
};
