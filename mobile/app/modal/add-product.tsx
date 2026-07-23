import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { FormControl } from "@/components/ui/form-control";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
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
import { useChangeFavoriteProduct } from "@/hooks/useChangeFavorite";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMealTemplate } from "@/hooks/useMealTemplate";

export default function AddProductModal() {
  const { meal, date, productId, mode } = useLocalSearchParams<{
    productId: string;
    meal: MealType;
    date: string;
    mode: ModalMode;
  }>();

  const { data, isLoading } = useProductById(productId);
  const [weight, setWeight] = useState(data?.serving_size.toString() ?? "");
  const { mutateAsync: addMealItem } = useAddMealItem();
  const { mutateAsync: addFavorite } = useChangeFavoriteProduct();
  const { addTemplateItem } = useMealTemplate();
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
      setWeight(data.serving_size.toString());
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
            <Heading size="xl" className="line-clamp-3 text-center w-[75%]">
              {data.name}
            </Heading>
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
          <HStack className="px-5">
            <Text
              size="2xl"
              className="text-typography-500 bg-primary-400 px-6 py-0.5 rounded-xl"
            >
              {data.supermarket}
            </Text>
          </HStack>
        </VStack>
        <Divider className="my-0.5 w-[85%] h-0.5" />
        <Card variant="half-rounded" className="w-full gap-5">
          <Box className="relative w-fit items-center m-auto pb-4">
            <Text size="8xl">{data.calories}</Text>
            <Text size="4xl" className="absolute bottom-0">
              ккал
            </Text>
          </Box>
          <Grid
            className="gap-4 items-center"
            _extra={{
              className: "grid-cols-10",
            }}
          >
            <GridItem
              className="pb-6"
              _extra={{
                className: "col-span-3",
              }}
            >
              <Box className="relative w-fit items-center m-auto">
                <Text size="3xl">{data.protein} г</Text>
                <Text
                  size="xl"
                  className="absolute -bottom-6 text-typography-300"
                >
                  белки
                </Text>
              </Box>
            </GridItem>
            <Divider className="w-0.5 h-[75%]" />
            <GridItem
              className="pb-6"
              _extra={{
                className: "col-span-3",
              }}
            >
              <Box className="relative w-fit items-center m-auto">
                <Text size="3xl">{data.fat} г</Text>
                <Text
                  size="xl"
                  className="absolute -bottom-6 text-typography-300"
                >
                  жиры
                </Text>
              </Box>
            </GridItem>
            <Divider className="w-0.5 h-[75%]" />
            <GridItem
              className="pb-6"
              _extra={{
                className: "col-span-3",
              }}
            >
              <Box className="relative w-fit items-center m-auto">
                <Text size="3xl">{data.carbs} г</Text>
                <Text
                  size="xl"
                  className="absolute -bottom-6 text-typography-300"
                >
                  углеводы
                </Text>
              </Box>
            </GridItem>
          </Grid>
        </Card>
        <FormControl className="w-full mt-8">
          <VStack>
            <Text className="text-typography-200 pl-2" size="lg">
              Введите вес
            </Text>
            <Input variant="half-rounded" size="2xl">
              <InputField
                keyboardType="numeric"
                value={weight}
                onChangeText={(text) => setWeight(text)}
              />
            </Input>
          </VStack>
        </FormControl>
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
