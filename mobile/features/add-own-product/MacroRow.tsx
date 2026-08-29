import { useState } from "react";
import { Pressable } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Input, InputField } from "@/components/ui/input";
import {
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Icon,
} from "@/components/ui/icon";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
} from "@/components/ui/form-control";

type MacroRowProps = {
  label: string;
  value: string;
  unit: string;
  onChangeText: (value: string) => void;
  children?: React.ReactNode;
  level?: number;
};

export function MacroRow({
  label,
  value,
  unit,
  onChangeText,
  children,
  level = 0,
}: MacroRowProps) {
  const [expanded, setExpanded] = useState(false);

  const expandable = !!children;

  return (
    <Animated.View layout={LinearTransition.duration(180)}>
      <VStack>
        <HStack
          className="w-full items-center py-1.5"
          style={{
            paddingLeft: level * 16,
          }}
        >
          <Pressable
            disabled={!expandable}
            onPress={() => setExpanded((value) => !value)}
            className="flex-1"
          >
            <HStack className="items-center">
              {expandable ? (
                expanded ? (
                  <Icon
                    as={ChevronDownIcon}
                    size="sm"
                    className="text-typography-400 mr-2"
                  />
                ) : (
                  <Icon
                    as={ChevronUpIcon}
                    size="sm"
                    className="text-typography-400 mr-2"
                  />
                )
              ) : (
                <Text className="w-4" />
              )}

              <Text
                size={level === 0 ? "lg" : "md"}
                className={
                  level === 0
                    ? "font-semibold text-typography-900"
                    : "text-typography-500"
                }
              >
                {label}
              </Text>
            </HStack>
          </Pressable>
          <HStack className="items-center" space="xs">
            <FormControl isInvalid={Number(value) > 100 && unit !== "ккал"}>
              <Input
                variant="outline"
                size="md"
                className="w-32 rounded-xl pr-2.5"
              >
                <InputField
                  value={value}
                  onChangeText={onChangeText}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  className="text-left px-2"
                />
                <Text size="md" className="text-typography-400">
                  {unit}
                </Text>
              </Input>
              <FormControlError className="gap-3.5">
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText size="sm">
                  &gt; 100 г
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
          </HStack>
        </HStack>
        {expanded && (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
          >
            {children}
          </Animated.View>
        )}
      </VStack>
    </Animated.View>
  );
}
