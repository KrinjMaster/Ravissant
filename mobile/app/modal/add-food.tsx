import { useLocalSearchParams, router } from "expo-router";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { AddIcon, ArrowLeftIcon, ChevronDownIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { SkeletonText } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSearchItems } from "@/hooks/useSearchItems";
import { MealType, ModalMode } from "@/types/products";
import { getMealLocale } from "@/utils/meals";
import { useEffect, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { Box } from "@/components/ui/box";
import * as Haptics from "expo-haptics";
import { useRecentItems } from "@/hooks/useRecentItems";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import { ProductViewCard } from "@/features/add-food/ProductViewCard";
import { MealViewCard } from "@/features/add-food/MealViewCard";

export type SearchSource = "products" | "recipes";

export interface SearchResult {
  id: string;
  name: string;
  type: "products" | "recipes";
  brand: string | null;
  weight: number | null;
  unit: string | null;
  calories: number | null;
}

export interface ViewCardProps {
  id: string;
  name: string;
  brand: string | null;
  weight: number | null;
  unit: string | null;
  mode: ModalMode;
  calories: number | null;
  meal: MealType;
  date: string;
}

export default function AddFoodModal() {
  const { meal, date, mode } = useLocalSearchParams<{
    meal: MealType;
    date: string;
    mode: ModalMode;
  }>();
  const [searchString, setSearchString] = useState("");
  const [source, setSource] = useState<SearchSource>("products");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const {
    data: searchData,
    isLoading: isSearchLoading,
    error,
  } = useSearchItems(searchString, source, favoritesOnly);
  const { data: recentData } = useRecentItems();
  const showSkeleton =
    searchString.length > 0 && !searchData && isSearchLoading;
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  useEffect(() => console.log(error), [error]);

  return (
    <VStack
      className="w-screen h-screen bg-secondary-0 px-2"
      space="md"
      style={{ paddingTop: insets.top }}
    >
      <Box className="absolute bottom-52 -left-64 w-[30rem] h-[45rem]">
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient
              id="glow"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#00033D" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#00067A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#glow)" />
        </Svg>
      </Box>
      <Box className="absolute -bottom-24 -right-80 w-[30rem] h-[45rem]">
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient
              id="glow"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#00033D" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#00067A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#glow)" />
        </Svg>
      </Box>
      <HStack className="items-center justify-center py-2.5">
        <Button
          action="default"
          variant="outline"
          onPress={handleGoBack}
          className="absolute left-0"
          size="xl"
        >
          <ButtonIcon as={ArrowLeftIcon} size="2xl" />
        </Button>
        <Text size="3xl" className="text-center">
          {mode === "meal" ? getMealLocale(meal) : meal}
        </Text>
      </HStack>
      <FormControl>
        <Input variant="half-rounded" size="2xl" className="overflow-hidden">
          <InputField
            placeholder="Введите название ..."
            value={searchString}
            onChangeText={(text) => setSearchString(text)}
            multiline={false}
            numberOfLines={1}
            className="overflow-hidden"
          />
        </Input>
        <HStack className="w-full justify-between mt-1.5 px-1.5">
          <Select
            defaultValue="Продукты"
            onValueChange={(value) =>
              setSource(value === "Продукты" ? "products" : "recipes")
            }
            className="w-[49%]"
          >
            <SelectTrigger variant="outline" size="xl">
              <SelectInput size="sm" />
              <SelectIcon className="mr-3 ml-auto" as={ChevronDownIcon} />
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                <SelectDragIndicatorWrapper>
                  <SelectDragIndicator />
                </SelectDragIndicatorWrapper>
                <SelectItem label="Продукты" value="Продукты" />
                <SelectItem label="Рецепты" value="Рецепты" />
              </SelectContent>
            </SelectPortal>
          </Select>
          <Select
            defaultValue="Все"
            onValueChange={(value) => setFavoritesOnly(value === "Любимые")}
            className="w-[49%]"
          >
            <SelectTrigger variant="outline" size="xl">
              <SelectInput size="sm" />
              <SelectIcon className="mr-3 ml-auto" as={ChevronDownIcon} />
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                <SelectDragIndicatorWrapper>
                  <SelectDragIndicator />
                </SelectDragIndicatorWrapper>
                <SelectItem label="Все" value="Все" />
                <SelectItem label="Любимые" value="Любимые" />
              </SelectContent>
            </SelectPortal>
          </Select>
        </HStack>
      </FormControl>
      <ScrollView className="flex-1 px-3 mt-2.5">
        <VStack space="md" className="pb-5">
          {searchData && searchData.length === 0 ? (
            <Text size="6xl" className="text-center">
              Ничего не найдено :(
            </Text>
          ) : null}
          {showSkeleton
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card
                  key={i}
                  size="md"
                  variant="half-rounded"
                  className="rounded-xl h-40 gap-2.5"
                >
                  <SkeletonText className="w-full h-6" />
                  <SkeletonText className="w-[40%] h-4 rounded-md" />
                </Card>
              ))
            : null}
          {/* Search items */}
          {searchData && searchString.length !== 0
            ? searchData.map(
                ({ name, brand, id, calories, weight, unit, type }) => {
                  return type === "products" ? (
                    <ProductViewCard
                      key={id}
                      meal={meal}
                      mode={mode}
                      id={id}
                      date={date}
                      name={name}
                      brand={brand}
                      calories={calories}
                      weight={weight}
                      unit={unit}
                    />
                  ) : (
                    <MealViewCard
                      key={id}
                      meal={meal}
                      id={id}
                      mode={mode}
                      date={date}
                      name={name}
                      brand={brand}
                      calories={calories}
                      weight={weight}
                      unit={unit}
                    />
                  );
                },
              )
            : null}
          {/* Recent items */}
          {recentData && recentData.length > 0 && searchString.length === 0 ? (
            <Text size="2xl" className="text-typography-500">
              Недавние
            </Text>
          ) : null}
          {recentData &&
          recentData.length === 0 &&
          searchString.length === 0 ? (
            <Text size="2xl" className="text-typography-500">
              Недавние{"\n\n"}Были бы тут, если бы вы что-нибудь добавили :(
            </Text>
          ) : null}
          {recentData && searchString.length === 0
            ? recentData.map(({ name, brand, id, calories, weight, unit }) => (
                <ProductViewCard
                  key={id}
                  meal={meal}
                  id={id}
                  date={date}
                  name={name}
                  brand={brand}
                  calories={calories}
                  weight={weight}
                  unit={unit}
                />
              ))
            : null}
        </VStack>
      </ScrollView>
    </VStack>
  );
}
