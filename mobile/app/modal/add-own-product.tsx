import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  CloseIcon,
  Icon,
} from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { MacroRow } from "@/features/add-own-product/MacroRow";
import { BarcodeScanner } from "@/features/general/BarcodeScanner";
import React, { useState } from "react";
import {
  Keyboard,
  Pressable,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
} from "@/components/ui/modal";
import { BarcodeFrame } from "@/features/add-own-product/BarcodeFrame";
import { Box } from "@/components/ui/box";
import { useAddProduct } from "@/hooks/useAddProduct";
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
import { useFeedback } from "@/hooks/useFeedback";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

type WeightUnit = "мл" | "гр" | "кг" | "л";

export default function AddOwnProduct() {
  const [permission, requestPermission] = useCameraPermissions();
  const { success, error: feedbackError } = useFeedback();
  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("");
  const [weight, setWeight] = useState("100");
  const [unit, setUnit] = useState<WeightUnit>("гр");
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [nutrition, setNutrition] = useState({
    calories: "",
    protein: "",
    fat: "",
    saturatedFat: "",
    unsaturatedFat: "",
    omega3: "",
    omega6: "",
    transFat: "",
    carbs: "",
    sugars: "",
    fiber: "",
    salt: "",
    sodium: "",
    cholesterol: "",
  });
  const [ingredients, setIngredients] = useState("");
  const [allergens, setAllergens] = useState("");
  const [showModal, setShowModal] = useState(false);
  const isInvalid =
    Number(nutrition.protein || 0) > 100 ||
    Number(nutrition.fat || 0) > 100 ||
    Number(nutrition.carbs || 0) > 100 ||
    Number(nutrition.saturatedFat || 0) > 100 ||
    Number(nutrition.unsaturatedFat || 0) > 100 ||
    Number(nutrition.transFat || 0) > 100 ||
    Number(nutrition.sugars || 0) > 100 ||
    Number(nutrition.omega3 || 0) > 100 ||
    Number(nutrition.omega6 || 0) > 100 ||
    Number(nutrition.salt || 0) > 100 ||
    Number(nutrition.sodium || 0) > 100 ||
    Number(nutrition.cholesterol || 0) > 100 ||
    Number(nutrition.sugars || 0) > 100 ||
    Number(nutrition.fiber || 0) > 100;

  const insets = useSafeAreaInsets();
  const isButtonDisabled =
    !nutrition.calories ||
    !nutrition.protein ||
    !nutrition.carbs ||
    !nutrition.fat ||
    !productName ||
    !weight ||
    isInvalid;
  const { mutateAsync: addProduct } = useAddProduct();

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    setScannedBarcode(data);
    setShowModal(false);
  };

  const handleBarcodePress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();

      if (result.granted) {
        setShowModal(true);
      }

      return;
    }

    setShowModal(true);
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleAddProduct = async () => {
    let parsedWeight = 100;
    let parsedUnit = unit;

    switch (unit) {
      case "кг":
        parsedWeight = Number(weight) * 1000.0;
        parsedUnit = "гр";
        break;
      case "л":
        parsedWeight = Number(weight) * 1000.0;
        parsedUnit = "мл";
        break;
      default:
        parsedWeight = Number(weight);
        break;
    }

    if (!productName.trim()) {
      return;
    }

    if (
      !nutrition.calories ||
      !nutrition.protein ||
      !nutrition.fat ||
      !nutrition.carbs
    ) {
      return;
    }

    try {
      await addProduct({
        name: productName.trim(),
        brand: brandName.trim() || null,
        category: category.trim() || "Другое",
        weight: parsedWeight,
        unit: parsedUnit,
        ingredients: ingredients.trim() || null,
        allergens: allergens.trim() || null,
        barcode: scannedBarcode,
        nutrition: {
          calories: nutrition.calories,
          protein: nutrition.protein,
          fat: nutrition.fat,
          saturatedFat: nutrition.saturatedFat,
          unsaturatedFat: nutrition.unsaturatedFat,
          omega3: nutrition.omega3,
          omega6: nutrition.omega6,
          transFat: nutrition.transFat,
          carbs: nutrition.carbs,
          sugars: nutrition.sugars,
          fiber: nutrition.fiber,
          salt: nutrition.salt,
          sodium: nutrition.sodium,
          cholesterol: nutrition.cholesterol,
        },
      }).finally(() => success("Товар добавлен!"));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error("Failed to create product:", error);
      feedbackError("Ошибка, продукт не добавлен!");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <VStack
        className="w-full h-screen bg-secondary-0 px-2"
        space="lg"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <Box className="absolute -top-64 -left-72 w-[30rem] h-[45rem]">
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
        <Box className="absolute top-32 -right-72 w-[30rem] h-[45rem]">
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
        <VStack
          className="w-full items-center justify-between pt-2.5"
          space="md"
        >
          <HStack className="w-full min-h-14 max-h-24 items-center justify-center">
            <Button
              action="default"
              variant="outline"
              className="absolute left-0 top-0"
              size="xl"
              onPress={handleGoBack}
            >
              <ButtonIcon as={ArrowLeftIcon} size="2xl" />
            </Button>
            <Heading size="xl" className="line-clamp-2 max-w-[75%] text-center">
              {productName === "" ? "Новый продукт" : productName}
            </Heading>
          </HStack>
        </VStack>
        <FormControl>
          <Input variant="half-rounded" size="2xl">
            <InputField
              placeholder="Введите название ..."
              value={productName}
              onChangeText={(text) => setProductName(text)}
            />
          </Input>
        </FormControl>
        <Pressable onPress={handleBarcodePress}>
          <BarcodeScanner className="h-12" />
          {scannedBarcode ? (
            <Text className="text-typography-400 text-center">
              Штрих код: {scannedBarcode}
            </Text>
          ) : null}
        </Pressable>
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
          }}
          size="lg"
        >
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
                onBarcodeScanned={
                  !scannedBarcode || showModal
                    ? handleBarcodeScanned
                    : undefined
                }
              />
            </View>
          </ModalContent>
        </Modal>
        <ScrollView>
          <Card variant="half-rounded" className="p-2.5 pt-5 gap-3.5">
            <Text size="3xl" className="text-tertiary-500 pl-2.5">
              Нутриенты на 100 г
            </Text>
            <VStack space="xs">
              <MacroRow
                label="Калории"
                value={nutrition.calories}
                unit="ккал"
                onChangeText={(value) => {
                  setNutrition((prev) => ({
                    ...prev,
                    calories: value,
                  }));
                }}
              />
              <MacroRow
                label="Белки"
                value={nutrition.protein}
                unit="г"
                onChangeText={(value) => {
                  setNutrition((prev) => ({
                    ...prev,
                    protein: value,
                  }));
                }}
              />
              <MacroRow
                label="Жиры"
                value={nutrition.fat}
                unit="г"
                onChangeText={(value) => {
                  setNutrition((prev) => ({
                    ...prev,
                    fat: value,
                  }));
                }}
              >
                <VStack>
                  <MacroRow
                    label="Насыщенные"
                    value={nutrition.saturatedFat}
                    unit="г"
                    level={1}
                    onChangeText={(value) => {
                      setNutrition((prev) => ({
                        ...prev,
                        saturatedFat: value,
                      }));
                    }}
                  />
                  <MacroRow
                    label="Ненасыщенные"
                    value={nutrition.unsaturatedFat}
                    unit="г"
                    level={1}
                    onChangeText={(value) => {
                      setNutrition((prev) => ({
                        ...prev,
                        unsaturatedFat: value,
                      }));
                    }}
                  >
                    <VStack>
                      <MacroRow
                        label="Омега-3"
                        value={nutrition.omega3}
                        unit="г"
                        level={2}
                        onChangeText={(value) => {
                          setNutrition((prev) => ({
                            ...prev,
                            omega3: value,
                          }));
                        }}
                      />
                      <MacroRow
                        label="Омега-6"
                        value={nutrition.omega6}
                        unit="г"
                        level={2}
                        onChangeText={(value) => {
                          setNutrition((prev) => ({
                            ...prev,
                            omega6: value,
                          }));
                        }}
                      />
                    </VStack>
                  </MacroRow>
                  <MacroRow
                    label="Трансжиры"
                    value={nutrition.transFat}
                    unit="г"
                    level={1}
                    onChangeText={(value) => {
                      setNutrition((prev) => ({
                        ...prev,
                        transFat: value,
                      }));
                    }}
                  />
                </VStack>
              </MacroRow>
              <MacroRow
                label="Углеводы"
                value={nutrition.carbs}
                unit="г"
                onChangeText={(value) => {
                  setNutrition((prev) => ({
                    ...prev,
                    carbs: value,
                  }));
                }}
              >
                <VStack>
                  <MacroRow
                    label="Сахара"
                    value={nutrition.sugars}
                    unit="г"
                    level={1}
                    onChangeText={(value) => {
                      setNutrition((prev) => ({
                        ...prev,
                        sugars: value,
                      }));
                    }}
                  />

                  <MacroRow
                    label="Клетчатка"
                    value={nutrition.fiber}
                    unit="г"
                    level={1}
                    onChangeText={(value) => {
                      setNutrition((prev) => ({
                        ...prev,
                        fiber: value,
                      }));
                    }}
                  />
                </VStack>
              </MacroRow>
            </VStack>
          </Card>
          <VStack space="xs" className="mt-2.5">
            <Text className="text-typography-300 text-lg">Введите бренд</Text>
            <Input variant="half-rounded" size="lg" className="rounded-xl">
              <InputField
                placeholder=""
                value={brandName}
                onChangeText={(val) => setBrandName(val)}
              />
            </Input>
          </VStack>
          <VStack space="xs" className="mt-2.5">
            <Text className="text-typography-300 text-lg">
              Введите категорию
            </Text>
            <Input variant="half-rounded" size="lg" className="rounded-xl">
              <InputField
                placeholder=""
                value={category}
                onChangeText={(val) => setCategory(val)}
              />
            </Input>
          </VStack>
          <VStack space="xs" className="mt-2.5">
            <Text className="text-typography-300 text-lg">Введите вес</Text>
            <HStack className="h-14 justify-between">
              <Input
                variant="half-rounded"
                size="lg"
                className="w-80 h-full rounded-xl"
              >
                <InputField
                  placeholder=""
                  value={weight}
                  onChangeText={(val) => setWeight(val)}
                />
              </Input>
              <Select
                defaultValue="гр"
                onValueChange={(value) => setUnit(value as WeightUnit)}
                className="w-36 h-full"
              >
                <SelectTrigger variant="outline" size="xl" className="h-full">
                  <SelectInput size="sm" />
                  <SelectIcon className="mr-3 ml-auto" as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectItem label="Гр" value="гр" />
                    <SelectItem label="Кг" value="кг" />
                    <SelectItem label="Мл" value="мл" />
                    <SelectItem label="Л" value="л" />
                  </SelectContent>
                </SelectPortal>
              </Select>
            </HStack>
          </VStack>
          <VStack space="xs" className="mt-2.5">
            <Text className="text-typography-300 text-xl">Введите состав</Text>
            <Input variant="half-rounded" size="2xl">
              <InputField
                placeholder=""
                value={ingredients}
                onChangeText={(val) => setIngredients(val)}
              />
            </Input>
          </VStack>
          <VStack space="xs" className="mt-2.5">
            <Text className="text-typography-300 text-xl">
              Введите аллергены
            </Text>
            <Input variant="half-rounded" size="2xl">
              <InputField
                placeholder=""
                value={allergens}
                onChangeText={(val) => setAllergens(val)}
              />
            </Input>
          </VStack>
        </ScrollView>
        <Button
          action="primary"
          size="xl"
          className="w-full mt-auto h-20 rounded-3xl"
          disabled={isButtonDisabled || isInvalid}
          onPress={handleAddProduct}
        >
          <ButtonText className="text-3xl">Сохранить</ButtonText>
        </Button>
      </VStack>
    </TouchableWithoutFeedback>
  );
}
