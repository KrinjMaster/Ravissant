import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSearchFavoriteItems } from "@/hooks/useSearchFavoriteItems";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { ArrowLeftIcon, StarIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { SkeletonText } from "@/components/ui/skeleton";
import { router } from "expo-router";
import { ScrollView, Pressable } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { useChangeFavoriteProduct } from "@/hooks/useChangeFavorite";

export default function FavoriteProducts() {
  const insets = useSafeAreaInsets();
  const [searchString, setSearchString] = useState("");
  const { data: searchData, isLoading: isSearchLoading } =
    useSearchFavoriteItems(searchString);
  const { mutateAsync: removeFavorite } = useChangeFavoriteProduct();
  const showSkeleton = !searchData && isSearchLoading;

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleRemoveFavorite = async (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await removeFavorite({ productId, isFavorite: true });
  };

  return (
    <VStack
      className="w-screen h-screen bg-secondary-0 px-2"
      space="md"
      style={{ paddingTop: insets.top }}
    >
      <Box className="absolute top-16 -left-64 w-[30rem] h-[45rem]">
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
          Любимые
        </Text>
      </HStack>
      <FormControl>
        <Input variant="half-rounded" size="2xl">
          <InputField
            placeholder="Введи название ..."
            value={searchString}
            onChangeText={(text) => setSearchString(text)}
          />
        </Input>
      </FormControl>
      <ScrollView className="flex-1 px-3 mt-2.5">
        <VStack space="md" className="pb-5">
          {searchData && searchData.length === 0 ? (
            <Text size="5xl" className="text-center">
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
          {/* Search favorite items */}
          {searchData
            ? searchData.map(({ name, brand, id, calories, serving_size }) => (
                <Pressable key={id}>
                  <Card
                    size="md"
                    variant="half-rounded"
                    className="rounded-xl p-0 pr-2"
                  >
                    <HStack className="justify-between ">
                      <Box className="w-[85%] p-3 pr-0">
                        <Heading size="sm" className="line-clamp-2">
                          {name}
                        </Heading>
                        <Text className="line-clamp-1 text-typography-300">
                          {brand}
                        </Text>
                        <HStack space="md" className="items-center mt-1.5">
                          <Text>{serving_size} г</Text>
                          <Divider className="w-0.5 h-[75%]" />
                          <Text>{calories} ккал / 100 г</Text>
                        </HStack>
                      </Box>
                      <Button
                        variant="outline"
                        action="primary"
                        size="xl"
                        className="border-0 mt-2 rounded-full px-2 py-5 w-12 h-12"
                        onPress={() => handleRemoveFavorite(id)}
                      >
                        <ButtonIcon
                          as={StarIcon}
                          size="2xl"
                          className="fill-primary-800 stroke-primary-800"
                        />
                      </Button>
                    </HStack>
                  </Card>
                </Pressable>
              ))
            : null}
        </VStack>
      </ScrollView>
    </VStack>
  );
}
