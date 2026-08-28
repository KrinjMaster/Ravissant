import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { FormControl } from "@/components/ui/form-control";
import { Grid, GridItem } from "@/components/ui/grid";
import { HStack } from "@/components/ui/hstack";
import { ArrowLeftIcon, StarIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAddMealItem } from "@/hooks/useAddMealItem";
import { useProductById } from "@/hooks/useProductById";
import { MealType, ModalMode } from "@/types/products";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import * as Haptics from "expo-haptics";
import { SkeletonText, Skeleton } from "@/components/ui/skeleton";
import { useChangeFavoriteProduct } from "@/hooks/useChangeFavoriteProduct";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMealTemplate } from "@/hooks/useMealTemplate";
import {
  Popover,
  PopoverBackdrop,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
} from "@/components/ui/popover";
import { MacrosDetailsCard } from "@/features/general/MacrosDetailsCard";

export default function AddProductModal() {
  const { meal, date, productId, mode } = useLocalSearchParams<{
    productId: string;
    mode: ModalMode;
    meal: MealType;
    date: string;
  }>();
  const { data, isLoading } = useProductById(productId);
  const [weight, setWeight] = useState(data?.weight.toString() ?? "");
  const { mutateAsync: addMealItem } = useAddMealItem();
  const { mutateAsync: addFavorite } = useChangeFavoriteProduct();
  const { addTemplateItem } = useMealTemplate();
  const [isStorePopoverOpen, setIsStorePopoverOpen] = useState(false);

  const insets = useSafeAreaInsets();

  const handleAddItem = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (mode === "meal") {
      addMealItem({
        productId,
        mealType: meal,
        grams: Number(weight),
        loggedDay: date,
      });
    } else {
      addTemplateItem(productId, Number(weight));
    }
    handleGoBack();
  };

  useEffect(() => {
    if (data) {
      setWeight(data.weight.toString());
      console.log(data);
    }
  }, [data]);

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleChangeFavorite = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addFavorite({
      productId: productId,
      isFavorite: data?.isFavorite ?? false,
    });
  };

  if (isLoading || !data) {
    return (
      <VStack
        className="w-screen h-screen bg-secondary-0 pt-16 pb-8 px-2"
        space="sm"
      >
        <SkeletonText className="w-[80%] h-8 mx-auto" />
        <SkeletonText className="w-[80%] h-8 mx-auto" />
        <SkeletonText className="w-[60%] h-8 mx-auto" />
        <VStack className="w-full h-[40%] border justify-between mt-2.5">
          <Skeleton className="w-full h-[75%] px-3 py-2 rounded-xl" />
          <Skeleton className="w-full h-[20%] px-3 py-2 rounded-xl" />
        </VStack>
        <Skeleton className="mt-auto w-full h-[9%] px-3 py-2 rounded-xl" />
      </VStack>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <VStack
        className="w-screen h-screen bg-secondary-0 items-center px-2"
        space="xl"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <VStack space="sm">
          <HStack className="w-full justify-between">
            <Button
              action="default"
              variant="outline"
              onPress={handleGoBack}
              size="xl"
            >
              <ButtonIcon as={ArrowLeftIcon} size="2xl" />
            </Button>
            <Popover
              isOpen={isStorePopoverOpen}
              onClose={() => setIsStorePopoverOpen(false)}
              onOpen={() => setIsStorePopoverOpen(true)}
              offset={10}
              trigger={(triggerProps) => (
                <HStack className="px-5 items-center max-w-[75%]" space="sm">
                  {data.store?.split(", ").map((name, i) => {
                    return i === 0 ? (
                      <Text
                        key={name}
                        size="xl"
                        className="text-typography-500 line-clamp-1"
                      >
                        {name}
                        {data.store?.split(", ").length !== 1 ? "," : ""}
                      </Text>
                    ) : null;
                  })}
                  {data.store && data.store.split(", ").length > 1 ? (
                    <Text
                      {...triggerProps}
                      size="lg"
                      className="text-tertiary-600"
                    >
                      ещё +{data.store.split(", ").length - 1}
                    </Text>
                  ) : null}
                </HStack>
              )}
            >
              <PopoverBackdrop />
              <PopoverContent className="max-w-[280px]">
                <PopoverArrow />
                <PopoverBody>
                  <VStack className="px-2.5 items-start">
                    {data.store?.split(", ").map((name, i) => (
                      <Text
                        key={name}
                        size="xl"
                        className="text-typography-600"
                      >
                        {name}
                        {data.store?.split(", ").length !== i + 1 ? "," : ""}
                      </Text>
                    ))}
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Button
              action="default"
              variant="outline"
              className={`${data.isFavorite ? "bg-background-200" : ""}`}
              onPress={handleChangeFavorite}
              size="xl"
            >
              <ButtonIcon
                as={StarIcon}
                size="2xl"
                className={`${data.isFavorite ? "fill-primary-800 stroke-primary-800" : ""}`}
              />
            </Button>
          </HStack>
          <Text size="2xl" className="px-2 text-center">
            {data.name}
          </Text>
        </VStack>
        <FormControl className="w-full">
          <VStack>
            <Text className="text-typography-200 pl-2" size="lg">
              Введите вес/объём
            </Text>
            <Input variant="half-rounded" size="2xl">
              <InputField
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
                className="text-left"
              />
              <Text size="2xl" className="text-typography-400 pr-4">
                {data.unit}
              </Text>
            </Input>
          </VStack>
        </FormControl>
        <Divider className="w-[85%] h-0.5" />
        <MacrosDetailsCard {...data} />
        <Text className="px-2.5 text-typography-400" size="sm">
          Состав: {data.ingredients}
        </Text>
        <Button
          action="primary"
          size="xl"
          className="w-full mt-auto h-20 rounded-3xl"
          onPress={handleAddItem}
        >
          <ButtonText className="text-3xl">Добавить</ButtonText>
        </Button>
      </VStack>
    </TouchableWithoutFeedback>
  );
}
