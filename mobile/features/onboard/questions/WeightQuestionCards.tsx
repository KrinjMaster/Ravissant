import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
} from "@/components/ui/form-control";
import { Card } from "@/components/ui/card";
import { useOnboard } from "@/hooks/useOnboard";
import { Input, InputField } from "@/components/ui/input";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { useState } from "react";
import { AlertCircleIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export const WeightQuestionCard = () => {
  const { userData, updateUserData } = useOnboard();
  const [isInvalid, setIsInvalid] = useState(false);
  const [value, setValue] = useState(
    userData.weight?.toString().replace(".", ",") ?? "",
  );

  const handleChange = (text: string) => {
    text = text.replace(".", ",");

    if (!/^\d*([,]\d{0,2})?$/.test(text)) {
      return;
    }

    setValue(text);

    const parsed = Number(text.replace(",", "."));

    if (parsed < 30 || parsed > 300) {
      setIsInvalid(true);
    } else if (text !== "" && text !== "," && !Number.isNaN(parsed)) {
      setIsInvalid(false);
    }

    updateUserData({
      weight: parsed,
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <Card variant="elevated" className="h-full" size="lg">
        <Heading size="5xl" className="text-typography-200">
          ВЫБЕРИ{"\n"}СВОЙ
        </Heading>
        <Heading size="4xl" className="text-tertiary-500">
          вес
        </Heading>
        <FormControl
          className="mt-[15%] gap-1.5"
          isInvalid={isInvalid && value !== ""}
        >
          <VStack space="xs">
            <Text className="text-typography-300 text-xl">
              Введите вес (кг)
            </Text>
            <Input variant="half-rounded" size="3xl" className="bg-transparent">
              <InputField
                keyboardType="decimal-pad"
                placeholder=""
                value={value}
                onChangeText={handleChange}
              />
            </Input>
          </VStack>
          <FormControlError className="gap-3.5">
            <FormControlErrorIcon as={AlertCircleIcon} />
            <FormControlErrorText size="sm">
              Введите вес от 30 до 300 кг
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
      </Card>
    </TouchableWithoutFeedback>
  );
};
