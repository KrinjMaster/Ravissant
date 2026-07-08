import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { Grid, GridItem } from "@/components/ui/grid";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { MealType } from "@/types/products";
import { router } from "expo-router";
import React from "react";
import { Pressable } from "react-native";

interface Prop {
  name: string;
  id: string;
  productId: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight: number;
  date: string;
  meal: MealType;
}

export const MealItem = (data: Prop) => {
  const {
    name,
    id,
    productId,
    calories,
    carbs,
    protein,
    fat,
    weight,
    date,
    meal,
  } = data;

  const handleForward = (productId: string, date: string, meal: string) => {
    router.push({
      pathname: "/modal/add-product",
      params: {
        productId,
        meal,
        date,
      },
    });
  };

  return (
    <Pressable
      key={id}
      onPress={() => handleForward(productId, date, meal)}
      className="bg-secondary-0 px-4"
    >
      <HStack key={id} className="justify-between items-center">
        <Box className="w-full relative">
          <Heading size="sm" className="line-clamp-2">
            {name}
          </Heading>
          <Text className="text-typography-400">
            {weight} г, {calories} ккал
          </Text>
          <Grid
            className="items-center mt-2"
            _extra={{
              className: "grid-cols-11",
            }}
          >
            <GridItem
              className="pb-4"
              _extra={{
                className: "col-span-3",
              }}
            >
              <Box className="relative w-fit items-center m-auto">
                <Text size="xl">{protein} г</Text>
                <Text
                  size="md"
                  className="absolute -bottom-5 text-typography-300"
                >
                  белки
                </Text>
              </Box>
            </GridItem>
            <GridItem
              className="items-center"
              _extra={{
                className: "col-span-1",
              }}
            >
              <Divider className="w-0.5 h-8" />
            </GridItem>
            <GridItem
              className="pb-4"
              _extra={{
                className: "col-span-3",
              }}
            >
              <Box className="relative w-fit items-center m-auto">
                <Text size="xl">{fat} г</Text>
                <Text
                  size="md"
                  className="absolute -bottom-5 text-typography-300"
                >
                  жиры
                </Text>
              </Box>
            </GridItem>
            <GridItem
              className="items-center"
              _extra={{
                className: "col-span-1",
              }}
            >
              <Divider className="w-0.5 h-8" />
            </GridItem>
            <GridItem
              className="pb-4"
              _extra={{
                className: "col-span-3",
              }}
            >
              <Box className="relative w-fit items-center m-auto">
                <Text size="xl">{carbs} г</Text>
                <Text
                  size="md"
                  className="absolute -bottom-5 text-typography-300"
                >
                  углеводы
                </Text>
              </Box>
            </GridItem>
          </Grid>
        </Box>
      </HStack>
      <Divider className="mt-5 mx-auto w-[97%] h-0.5" />
    </Pressable>
  );
};
