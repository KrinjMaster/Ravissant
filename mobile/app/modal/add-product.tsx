import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form-control";
import { ArrowLeftIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAddMealItem } from "@/hooks/useAddMealItem";
import { useProductById } from "@/hooks/useProductById";
import { MealType } from "@/types/products";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";

export default function AddFoodModal() {
  const { meal, date, productId } = useLocalSearchParams<{
    productId: string;
    meal: MealType;
    date: string;
  }>();
  const { data, isLoading } = useProductById(productId);
  const [weight, setWeight] = useState(data?.serving_size.toString() ?? "");
  const { mutateAsync, isSuccess, isPending } = useAddMealItem();

  const handleAddItem = async () => {
    mutateAsync({
      productId,
      mealType: meal,
      grams: Number(weight),
      loggedDay: date,
    });
    handleFinish();
  };

  useEffect(() => {
    if (data) {
      setWeight(data.serving_size.toString());
    }
  }, [data]);

  useEffect(() => {
    console.log("isSuccess", isSuccess, "isPending", isPending);
  }, [isSuccess, isPending]);

  const handleFinish = () => {
    router.back();
  };

  if (isLoading || !data) {
    return (
      <VStack className="w-screen h-screen bg-secondary-0 pt-16 pb-8 px-2">
        <Text size="6xl">Loading</Text>
      </VStack>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <VStack
        className="w-screen h-screen bg-secondary-0 pt-16 pb-8 px-2"
        space="lg"
      >
        <Button
          action="tertiary"
          onPress={handleFinish}
          className="pl-1.5 pr-3.5 w-32"
        >
          <ButtonIcon as={ArrowLeftIcon} color="white" size="2xl" />
          <ButtonText size="md">Назад</ButtonText>
        </Button>
        <Text size="2xl">{data.name}</Text>
        <Text size="2xl">{data.supermarket}</Text>
        <Text size="2xl">{data.serving_size} грaмм</Text>
        <Text size="2xl">ккал / 100г - {data.calories}</Text>
        <Text size="2xl">белок / 100г - {data.protein}</Text>
        <Text size="2xl">жиры / 100г - {data.fat}</Text>
        <Text size="2xl">углеводы / 100г - {data.carbs}</Text>
        <FormControl>
          <Input variant="half-rounded" size="2xl">
            <InputField
              keyboardType="numeric"
              value={weight}
              onChangeText={(text) => setWeight(text)}
            />
          </Input>
        </FormControl>
        <Button
          action="primary"
          size="xl"
          className="w-full mt-auto"
          onPress={handleAddItem}
        >
          <ButtonText>Добавить</ButtonText>
        </Button>
      </VStack>
    </TouchableWithoutFeedback>
  );
}
