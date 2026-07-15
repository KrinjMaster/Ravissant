import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { AddIcon, ArrowLeftIcon, Icon, TrashIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import React, { useState } from "react";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { FormControl } from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Grid, GridItem } from "@/components/ui/grid";
import { Divider } from "@/components/ui/divider";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView } from "react-native-gesture-handler";
import { Keyboard, Pressable, TouchableWithoutFeedback } from "react-native";
import { useMealTemplate } from "@/hooks/useMealTemplate";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useSQLiteContext } from "expo-sqlite";

function RightAction() {
  return (
    <Box className="w-[35%] bg-error-400 justify-center items-end px-10">
      <Icon as={TrashIcon} color="white" className="h-12 w-12" />
    </Box>
  );
}

export default function AddTemplateModal() {
  const [templateName, setTemplateName] = useState("");
  const { displayData, removeTemplateItem, macrosData, finishMealTemplate } =
    useMealTemplate();
  const { calories, carbs, protein, fat } = macrosData;
  const insets = useSafeAreaInsets();
  const isButtonDisabled = displayData.length === 0 || templateName === "";
  const db = useSQLiteContext();

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleAddTemplateItem = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/modal/add-food",
      params: {
        date: new Date(Date.now()).toISOString().substring(0, 10),
        meal: "Ингридиент",
        mode: "template",
      },
    });
  };

  const handleFinishTemplate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await finishMealTemplate(db, templateName);
    handleGoBack();
  };

  const removeItem = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeTemplateItem(id);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <VStack
        className="w-full h-screen bg-secondary-0"
        space="md"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <VStack
          className="w-full items-center justify-between py-2.5 px-2"
          space="md"
        >
          <HStack className="w-full items-center justify-center px-2">
            <Button
              action="default"
              variant="outline"
              onPress={handleGoBack}
              className="absolute left-0"
              size="xl"
            >
              <ButtonIcon as={ArrowLeftIcon} size="2xl" />
            </Button>
            <Heading size="xl" className="line-clamp-2 text-start">
              {templateName === "" ? "Новый рецепт" : templateName}
            </Heading>
          </HStack>
        </VStack>
        <FormControl className="px-2">
          <Input variant="half-rounded" size="2xl">
            <InputField
              placeholder="Введите название ..."
              value={templateName}
              onChangeText={(text) => setTemplateName(text)}
            />
          </Input>
        </FormControl>
        <Card variant="half-rounded" className="w-fit gap-5 mt-5 mx-2">
          <Box className="relative w-fit items-center m-auto pb-4">
            <Text size="8xl">{calories}</Text>
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
                <Text size="3xl">{protein} г</Text>
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
                <Text size="3xl">{fat} г</Text>
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
                <Text size="3xl">{carbs} г</Text>
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
        <ScrollView className="mt-3.5">
          <VStack space="lg" style={{ paddingBottom: 2 * insets.bottom }}>
            {displayData.map(
              ({ id, name, weight, calories, protein, carbs, fat }) => (
                <ReanimatedSwipeable
                  key={id}
                  renderRightActions={() => <RightAction />}
                  overshootRight={false}
                  onSwipeableOpen={(direction) => {
                    if (direction === "left") removeItem(id);
                  }}
                >
                  <Box key={id} className="bg-secondary-0 px-4">
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
                  </Box>
                </ReanimatedSwipeable>
              ),
            )}
            <Pressable onPress={handleAddTemplateItem} className="px-3.5">
              <HStack className="items-center" space="xl">
                <Button
                  action="primary"
                  className="w-12"
                  size="xl"
                  onPress={handleAddTemplateItem}
                >
                  <ButtonIcon as={AddIcon} size="2xl" />
                </Button>
                <Text size="xl">Добавить ингридиент</Text>
              </HStack>
              <Divider className="mt-5 mx-auto w-[97%] h-0.5" />
            </Pressable>
          </VStack>
        </ScrollView>
        <Box className="absolute bottom-0 w-full">
          <LinearGradient
            colors={["black", "transparent"]}
            style={{
              paddingBottom: insets.bottom - 8,
              paddingInline: 16,
            }}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
          >
            <Button
              action="primary"
              className="w-full rounded-2xl h-16"
              size="xl"
              isDisabled={isButtonDisabled}
              onPress={handleFinishTemplate}
            >
              <ButtonText>Сохранить</ButtonText>
            </Button>
          </LinearGradient>
        </Box>
      </VStack>
    </TouchableWithoutFeedback>
  );
}
