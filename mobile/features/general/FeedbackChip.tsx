import { CheckIcon, CloseIcon, Icon, InfoIcon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

export type FeedbackType = "success" | "error" | "info";

type FeedbackChipProps = {
  type: FeedbackType;
  message: string;
};

export function FeedbackChip({ type, message }: FeedbackChipProps) {
  const insets = useSafeAreaInsets();
  const icon =
    type === "success" ? CheckIcon : type === "error" ? CloseIcon : InfoIcon;

  return (
    <Animated.View
      entering={FadeInDown.duration(220).withInitialValues({
        transform: [{ translateY: 60 }],
      })}
      exiting={FadeOutDown.duration(180)}
    >
      <View
        className="absolute left-24 right-24 z-50"
        style={{ top: insets.top }}
      >
        <HStack
          className={`
          min-h-14
          px-4
          py-3
          rounded-2xl
          items-center
          justify-center
          gap-2
          ${
            type === "success"
              ? "bg-success-700"
              : type === "error"
                ? "bg-error-700"
                : "bg-info-700"
          }
        `}
        >
          <Icon
            as={icon}
            size="xl"
            className={
              type === "success"
                ? "text-success-300"
                : type === "error"
                  ? "text-error-300"
                  : "text-info-300"
            }
          />

          <Text size="lg" className="text-typography-0 text-center">
            {message}
          </Text>
        </HStack>
      </View>
    </Animated.View>
  );
}
