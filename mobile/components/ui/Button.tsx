import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { colors, spacing, radius, fontSize } from "@/constants/theme";

export const Button = ({
  title,
  handlePress,
  propStyles,
  disabled,
}: {
  title: string;
  handlePress: () => void;
  propStyles?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) => {
  return (
    <Pressable
      disabled={disabled}
      onPress={handlePress}
      style={[
        styles.button,
        styles.button,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text style={[styles.text, disabled ? styles.textDisabled : null]}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accentSecondary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  text: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
  },
  buttonDisabled: {
    backgroundColor: colors.accentPrimary,
  },
  textDisabled: {
    color: colors.textDisabled,
  },
});
