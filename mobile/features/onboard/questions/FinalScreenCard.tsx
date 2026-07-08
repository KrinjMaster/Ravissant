import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Input, InputField } from "@/components/ui/input";
import { useOnboard } from "@/hooks/useOnboard";
import { getAge } from "@/utils/date";
import { calculatePlan } from "@/utils/onboard";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { useEffect } from "react";
import { Button, ButtonText } from "@/components/ui/button";

export const FinalScreenCard = () => {
  const { userData, updateNutritionPlan, updateUserData, completeOnboarding } =
    useOnboard();

  const recommended = calculatePlan({
    sex: userData.sex!,
    age: getAge(new Date(userData.birthday!)),
    weightKg: userData.weight!,
    heightCm: userData.height!,
    activityLevel: userData.activityLevel!,
    goal: userData.goal!,
  });

  useEffect(() => {
    if (!recommended) return;

    if (!userData.nutritionPlan) {
      updateUserData({ nutritionPlan: recommended });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommended]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <Card variant="elevated" className="h-full" size="lg">
        <Heading size="5xl" className="text-typography-200">
          ТВОЙ
        </Heading>
        <Heading size="4xl" className="text-tertiary-500">
          план
        </Heading>
        <VStack space="lg" className="mt-[10%]">
          <VStack space="xs">
            <Text className="text-typography-300" size="xl">
              Калории
            </Text>
            <Input variant="half-rounded" size="2xl">
              <InputField
                keyboardType="numeric"
                value={userData.nutritionPlan?.calories.toString()}
                onChangeText={(text) => {
                  const value = Number(text);

                  if (!Number.isNaN(value)) {
                    updateNutritionPlan({ calories: value });
                  }
                }}
              />
            </Input>
            <Text className="text-typography-400 text-right" size="sm">
              Рекомендуем: {recommended.calories}
            </Text>
          </VStack>
          <VStack space="xs">
            <Text className="text-typography-300 text-xl">Белки</Text>
            <Input variant="half-rounded" size="2xl">
              <InputField
                keyboardType="numeric"
                value={userData.nutritionPlan?.protein.toString()}
                onChangeText={(text) => {
                  const value = Number(text);

                  if (!Number.isNaN(value)) {
                    updateNutritionPlan({ protein: value });
                  }
                }}
              />
            </Input>
            <Text className="text-typography-400 text-right" size="sm">
              Рекомендуем: {recommended.protein} г
            </Text>
          </VStack>
          <VStack space="xs">
            <Text className="text-typography-300 text-xl">Жиры</Text>
            <Input variant="half-rounded" size="2xl">
              <InputField
                keyboardType="numeric"
                value={userData.nutritionPlan?.fat.toString()}
                onChangeText={(text) => {
                  const value = Number(text);

                  if (!Number.isNaN(value)) {
                    updateNutritionPlan({ fat: value });
                  }
                }}
              />
            </Input>
            <Text className="text-typography-400 text-right" size="sm">
              Рекомендуем: {recommended.fat} г
            </Text>
          </VStack>
          <VStack space="xs">
            <Text className="text-typography-300 text-xl">Углеводы</Text>
            <Input variant="half-rounded" size="2xl">
              <InputField
                keyboardType="numeric"
                value={userData.nutritionPlan?.carbs.toString()}
                onChangeText={(text) => {
                  const value = Number(text);

                  if (!Number.isNaN(value)) {
                    updateNutritionPlan({ carbs: value });
                  }
                }}
              />
            </Input>
            <Text className="text-typography-400 text-right" size="sm">
              Рекомендуем: {recommended.carbs} г
            </Text>
          </VStack>
        </VStack>
        <Button
          size="xl"
          action="tertiary"
          className="w-full py-1 h-16 my-auto mb-0"
          onPress={() => {
            updateUserData({ isOnboarded: true });
            completeOnboarding();
          }}
        >
          <ButtonText>Завершить</ButtonText>
        </Button>
      </Card>
    </TouchableWithoutFeedback>
  );
};
