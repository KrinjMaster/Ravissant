import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { ArrowLeftIcon, CloseIcon, Icon } from "@/components/ui/icon";
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

export default function AddOwnProduct() {
  const [permission, requestPermission] = useCameraPermissions();
  const [productName, setProductName] = useState("");
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
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);

  const handleBarcodeScanned = ({ type, data }: BarcodeScanningResult) => {
    console.log("found ", type, data);
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <VStack
        className="w-full h-screen bg-secondary-0 px-2"
        space="lg"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
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
          <BarcodeScanner />
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
                  barcodeTypes: [
                    "aztec",
                    "ean13",
                    "ean8",
                    "pdf417",
                    "upc_e",
                    "datamatrix",
                    "code39",
                    "code93",
                    "itf14",
                    "codabar",
                    "code128",
                    "upc_a",
                  ],
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
                onChangeText={(value) =>
                  setNutrition((prev) => ({
                    ...prev,
                    calories: value,
                  }))
                }
              />
              <MacroRow
                label="Белки"
                value={nutrition.protein}
                unit="г"
                onChangeText={(value) =>
                  setNutrition((prev) => ({
                    ...prev,
                    protein: value,
                  }))
                }
              />
              <MacroRow
                label="Жиры"
                value={nutrition.fat}
                unit="г"
                onChangeText={(value) =>
                  setNutrition((prev) => ({
                    ...prev,
                    fat: value,
                  }))
                }
              >
                <VStack>
                  <MacroRow
                    label="Насыщенные"
                    value={nutrition.saturatedFat}
                    unit="г"
                    level={1}
                    onChangeText={(value) =>
                      setNutrition((prev) => ({
                        ...prev,
                        saturatedFat: value,
                      }))
                    }
                  />
                  <MacroRow
                    label="Ненасыщенные"
                    value={nutrition.unsaturatedFat}
                    unit="г"
                    level={1}
                    onChangeText={(value) =>
                      setNutrition((prev) => ({
                        ...prev,
                        unsaturatedFat: value,
                      }))
                    }
                  >
                    <VStack>
                      <MacroRow
                        label="Омега-3"
                        value={nutrition.omega3}
                        unit="г"
                        level={2}
                        onChangeText={(value) =>
                          setNutrition((prev) => ({
                            ...prev,
                            omega3: value,
                          }))
                        }
                      />
                      <MacroRow
                        label="Омега-6"
                        value={nutrition.omega6}
                        unit="г"
                        level={2}
                        onChangeText={(value) =>
                          setNutrition((prev) => ({
                            ...prev,
                            omega6: value,
                          }))
                        }
                      />
                    </VStack>
                  </MacroRow>
                  <MacroRow
                    label="Трансжиры"
                    value={nutrition.transFat}
                    unit="г"
                    level={1}
                    onChangeText={(value) =>
                      setNutrition((prev) => ({
                        ...prev,
                        transFat: value,
                      }))
                    }
                  />
                </VStack>
              </MacroRow>
              <MacroRow
                label="Углеводы"
                value={nutrition.carbs}
                unit="г"
                onChangeText={(value) =>
                  setNutrition((prev) => ({
                    ...prev,
                    carbs: value,
                  }))
                }
              >
                <VStack>
                  <MacroRow
                    label="Сахара"
                    value={nutrition.sugars}
                    unit="г"
                    level={1}
                    onChangeText={(value) =>
                      setNutrition((prev) => ({
                        ...prev,
                        sugars: value,
                      }))
                    }
                  />

                  <MacroRow
                    label="Клетчатка"
                    value={nutrition.fiber}
                    unit="г"
                    level={1}
                    onChangeText={(value) =>
                      setNutrition((prev) => ({
                        ...prev,
                        fiber: value,
                      }))
                    }
                  />
                </VStack>
              </MacroRow>
            </VStack>
          </Card>
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
        >
          <ButtonText className="text-3xl">Сохранить</ButtonText>
        </Button>
      </VStack>
    </TouchableWithoutFeedback>
  );
}
