import { useLocalSearchParams, router } from "expo-router";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import {
  AddIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  CloseIcon,
  Icon,
} from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { SkeletonText } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSearchItems } from "@/hooks/useSearchItems";
import { MealType, ModalMode } from "@/types/products";
import { getMealLocale } from "@/utils/meals";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
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
import { AddOwnButton } from "@/features/add-food/AddOwnButton";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
} from "@/components/ui/modal";
import { BarcodeFrame } from "@/features/add-own-product/BarcodeFrame";
import { BarcodeScanner } from "@/features/general/BarcodeScanner";
import {
  useCameraPermissions,
  BarcodeScanningResult,
  CameraView,
} from "expo-camera";
import { useGetIdByBarcode } from "@/hooks/useGetIdByBarcode";
import { queryClient } from "@/constants/query";
import { productService } from "@/services/product.service";
import { useFeedback } from "@/hooks/useFeedback";

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
  const isProcessingBarcode = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showModal, setShowModal] = useState(false);
  const [searchString, setSearchString] = useState("");
  const [source, setSource] = useState<SearchSource>("products");
  const { findByBarcode } = useGetIdByBarcode();
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const {
    data,
    isLoading: isSearchLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchItems(searchString, source, favoritesOnly);
  const { data: recentData } = useRecentItems();
  const { success, error } = useFeedback();

  const searchData = data?.pages.flat() ?? [];

  const showSkeleton =
    searchString.length > 0 && !searchData && isSearchLoading;
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (isProcessingBarcode.current) {
      return;
    }

    isProcessingBarcode.current = true;

    try {
      const result = await findByBarcode(data);

      if (!result?.productId) {
        console.log("Barcode not found in db:", data);
        error("Штрих-код не найден!");
        isProcessingBarcode.current = false;
        return;
      }

      setShowModal(false);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      success("Успех!");
      router.push({
        pathname: "/modal/add-product",
        params: {
          productId: result.productId,
          itemType: "product",
          meal,
          date,
          mode,
        },
      });
    } catch (error) {
      console.error("Barcode lookup failed:", error);
      isProcessingBarcode.current = false;
    }
  };

  const handleBarcodePress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();

      if (!result.granted) {
        return;
      }
    }

    isProcessingBarcode.current = false;
    setShowModal(true);
  };

  const handleCloseScanner = () => {
    isProcessingBarcode.current = false;
    setShowModal(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <VStack
        className="w-screen h-screen bg-secondary-0 px-2"
        space="md"
        style={{ paddingTop: insets.top }}
      >
        <Box className="absolute -top-64 -left-64 w-[30rem] h-[45rem]">
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
        <Box className="absolute -bottom-64 -right-72 w-[30rem] h-[45rem]">
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
          <AddOwnButton />
        </HStack>
        <Pressable onPress={handleBarcodePress} className="h-16">
          <BarcodeScanner className="h-16" />
        </Pressable>
        <Modal isOpen={showModal} onClose={handleCloseScanner} size="lg">
          <ModalBackdrop />
          <ModalContent className="h-[80%] p-0">
            <ModalHeader>
              <ModalCloseButton className="absolute right-4 top-4">
                <Icon as={CloseIcon} size="xl" />
              </ModalCloseButton>
            </ModalHeader>
            <View style={{ flex: 1 }}>
              <Box
                className="absolute inset-0 items-center justify-center"
                style={{ zIndex: 1 }}
              >
                <BarcodeFrame />
              </Box>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["ean8", "ean13", "upc_a", "upc_e", "itf14"],
                }}
                onBarcodeScanned={handleBarcodeScanned}
              />
            </View>
          </ModalContent>
        </Modal>
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
        <VStack className="flex-1 px-3 mt-2.5 h-[95%]">
          {searchString.length !== 0 &&
          searchData &&
          searchData.length === 0 ? (
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
          {searchData && searchString.length !== 0 ? (
            <FlatList
              data={searchData}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              contentContainerStyle={{
                paddingBottom: 24,
              }}
              renderItem={({ item }) =>
                item.type === "products" ? (
                  <ProductViewCard
                    id={item.id}
                    name={item.name}
                    brand={item.brand}
                    weight={item.weight}
                    unit={item.unit}
                    calories={item.calories}
                    meal={meal}
                    mode={mode}
                    date={date}
                  />
                ) : (
                  <MealViewCard
                    id={item.id}
                    name={item.name}
                    brand={item.brand}
                    weight={item.weight}
                    unit={item.unit}
                    calories={item.calories}
                    meal={meal}
                    mode={mode}
                    date={date}
                  />
                )
              }
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.5}
            />
          ) : null}
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
          <ScrollView
            contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {recentData && searchString.length === 0
              ? recentData.map(
                  ({ name, brand, id, calories, weight, unit }) => (
                    <ProductViewCard
                      key={id}
                      mode={mode}
                      meal={meal}
                      id={id}
                      date={date}
                      name={name}
                      brand={brand}
                      calories={calories}
                      weight={weight}
                      unit={unit}
                    />
                  ),
                )
              : null}
          </ScrollView>
        </VStack>
      </VStack>
    </TouchableWithoutFeedback>
  );
}
