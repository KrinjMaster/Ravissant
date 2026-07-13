import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
} from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CircleIcon,
} from "@/components/ui/icon";
import {
  RadioGroup,
  Radio,
  RadioLabel,
  RadioIndicator,
  RadioIcon,
} from "@/components/ui/radio";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useOnboard } from "@/hooks/useOnboard";
import { UserData } from "@/types/onboard";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Card } from "@/components/ui/card";
import { getAge } from "@/utils/date";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ScrollView } from "react-native-gesture-handler";
import { Input, InputField } from "@/components/ui/input";
import { activityLevels, goals } from "@/constants/onboard";
import { Box } from "@/components/ui/box";
import { calculatePlan } from "@/utils/onboard";

interface IsInvalid {
  isAgeInvalid: boolean;
  isWeightInvalid: boolean;
  isHeightInvalid: boolean;
}

export default function Index() {
  const { userData, updateUserData, completeOnboarding } = useOnboard();
  const [isInvalid, setIsInvalid] = useState<IsInvalid>({
    isAgeInvalid: false,
    isWeightInvalid: false,
    isHeightInvalid: false,
  });
  const [displayData, setDisplayData] = useState<UserData>(
    userData as UserData,
  );

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDisplayData(userData as UserData);
    setIsInvalid({
      isAgeInvalid: false,
      isWeightInvalid: false,
      isHeightInvalid: false,
    });
  };

  const handleSaveChanges = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    completeOnboarding(displayData);
  };

  const handleCalculatePlan = () => {
    const recommended = calculatePlan({
      sex: displayData.sex,
      age: getAge(new Date(displayData.birthday)),
      weightKg: displayData.weight,
      heightCm: displayData.height,
      activityLevel: displayData.activityLevel,
      goal: displayData.goal,
    });

    setDisplayData({
      ...(displayData as UserData),
      nutritionPlan: recommended,
    });
  };

  const insets = useSafeAreaInsets();

  return (
    <VStack style={{ paddingBottom: insets.bottom, paddingTop: insets.top }}>
      <HStack className="pb-5 px-2">
        <HStack className="w-full items-center justify-center">
          <Button
            action="default"
            variant="outline"
            className="absolute left-0"
            onPress={handleGoBack}
            size="xl"
          >
            <ButtonIcon as={ArrowLeftIcon} size="2xl" />
          </Button>
          <Text size="3xl" className="text-center">
            Профиль
          </Text>
        </HStack>
      </HStack>
      <ScrollView>
        <VStack
          className="w-screen bg-secondary-0 px-2 items-center"
          style={{ paddingBottom: insets.bottom }}
          space="md"
        >
          <FormControl className="w-full">
            <RadioGroup
              onChange={(val) => setDisplayData({ ...displayData, sex: val })}
              value={displayData.sex ?? "aboba"}
            >
              <Card variant="half-rounded" className="w-full">
                <VStack space="lg">
                  <Text className="text-typography-300" size="4xl">
                    Пол
                  </Text>
                  <Radio value="male" size="xl" className="justify-between">
                    <RadioLabel>Мужчина</RadioLabel>
                    <RadioIndicator>
                      <RadioIcon as={CircleIcon} />
                    </RadioIndicator>
                  </Radio>
                  <Radio value="female" size="xl" className="justify-between">
                    <RadioLabel>Женщина</RadioLabel>
                    <RadioIndicator>
                      <RadioIcon as={CircleIcon} />
                    </RadioIndicator>
                  </Radio>
                </VStack>
              </Card>
            </RadioGroup>
          </FormControl>
          <FormControl className="w-full" isInvalid={isInvalid.isAgeInvalid}>
            <Card
              variant="half-rounded"
              className="w-full min-h-[22rem] items-center"
            >
              <Text className="text-typography-300 w-full" size="4xl">
                Возраст
              </Text>
              <DateTimePicker
                testID="1"
                value={new Date(displayData.birthday)}
                mode="date"
                is24Hour={true}
                onValueChange={(_, selectedDate) => {
                  setDisplayData({
                    ...displayData,
                    birthday: selectedDate.toISOString(),
                  });
                  setIsInvalid({
                    ...isInvalid,
                    isAgeInvalid: getAge(selectedDate) < 18,
                  });
                }}
                display="spinner"
                locale="ru-RU"
              />
              <FormControlError className="gap-3.5">
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText size="sm">
                  Тебе должно быть 18, чтобы продолжить
                </FormControlErrorText>
              </FormControlError>
            </Card>
          </FormControl>
          <FormControl className="w-full" isInvalid={isInvalid.isWeightInvalid}>
            <Card variant="half-rounded" className="min-h-48">
              <VStack className="w-full" space="md">
                <Text className="text-typography-300 w-full" size="4xl">
                  Вес
                </Text>
                <Input variant="half-rounded" size="2xl">
                  <InputField
                    keyboardType="decimal-pad"
                    placeholder=""
                    value={displayData.weight.toString()}
                    onChangeText={(val) => {
                      setDisplayData({
                        ...displayData,
                        weight: Number(val),
                      });
                      setIsInvalid({
                        ...isInvalid,
                        isWeightInvalid: Number(val) < 30 || Number(val) > 300,
                      });
                    }}
                  />
                </Input>
                <FormControlError className="gap-3.5">
                  <FormControlErrorIcon as={AlertCircleIcon} />
                  <FormControlErrorText size="sm">
                    Введите вес от 30 до 300 кг
                  </FormControlErrorText>
                </FormControlError>
              </VStack>
            </Card>
          </FormControl>
          <FormControl className="w-full" isInvalid={isInvalid.isHeightInvalid}>
            <Card variant="half-rounded" className="min-h-48">
              <VStack className="w-full" space="md">
                <Text className="text-typography-300 w-full" size="4xl">
                  Рост
                </Text>
                <Input variant="half-rounded" size="2xl">
                  <InputField
                    keyboardType="decimal-pad"
                    placeholder=""
                    value={displayData.height.toString()}
                    onChangeText={(val) => {
                      setDisplayData({
                        ...displayData,
                        height: Number(val),
                      });
                      setIsInvalid({
                        ...isInvalid,
                        isHeightInvalid: Number(val) < 120 || Number(val) > 250,
                      });
                    }}
                  />
                </Input>
                <FormControlError className="gap-3.5">
                  <FormControlErrorIcon as={AlertCircleIcon} />
                  <FormControlErrorText size="sm">
                    Введите рост от 120 до 250 см
                  </FormControlErrorText>
                </FormControlError>
              </VStack>
            </Card>
          </FormControl>
          <FormControl className="w-full">
            <Card variant="half-rounded">
              <RadioGroup
                value={displayData.activityLevel ?? "aboba"}
                onChange={(val) =>
                  setDisplayData({ ...displayData, activityLevel: val })
                }
              >
                <VStack space="lg">
                  <Text className="text-typography-300 w-full" size="4xl">
                    Активность
                  </Text>
                  {activityLevels.map(({ value, title, description }) => (
                    <Box key={title}>
                      <Radio
                        value={value}
                        size="xl"
                        className="justify-between"
                      >
                        <RadioLabel>{title}</RadioLabel>
                        <RadioIndicator>
                          <RadioIcon as={CircleIcon} />
                        </RadioIndicator>
                      </Radio>
                      <Text size="sm" className="text-typography-300 w-[85%]">
                        {description}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </RadioGroup>
            </Card>
          </FormControl>
          <FormControl className="w-full">
            <Card variant="half-rounded">
              <RadioGroup
                value={displayData.goal ?? "aboba"}
                onChange={(val) =>
                  setDisplayData({ ...displayData, goal: val })
                }
              >
                <VStack space="lg">
                  <Text className="text-typography-300 w-full" size="4xl">
                    Цель
                  </Text>
                  {goals.map(({ value, title, description }) => (
                    <Box key={title}>
                      <Radio
                        value={value}
                        size="xl"
                        className="justify-between"
                      >
                        <RadioLabel>{title}</RadioLabel>
                        <RadioIndicator>
                          <RadioIcon as={CircleIcon} />
                        </RadioIndicator>
                      </Radio>
                      <Text size="sm" className="text-typography-300 w-[90%]">
                        {description}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </RadioGroup>
            </Card>
          </FormControl>
          <Card variant="half-rounded" className="w-full">
            <VStack space="lg">
              <VStack space="xs">
                <Text className="text-typography-300" size="xl">
                  Калории
                </Text>
                <Input variant="half-rounded" size="2xl">
                  <InputField
                    keyboardType="numeric"
                    value={displayData.nutritionPlan.calories.toString()}
                    onChangeText={(val) => {
                      const num = Number(val);

                      if (!isNaN(num)) {
                        setDisplayData({
                          ...displayData,
                          nutritionPlan: {
                            ...displayData.nutritionPlan,
                            calories: Number(val),
                          },
                        });
                      }
                    }}
                  />
                </Input>
              </VStack>
              <VStack space="xs">
                <Text className="text-typography-300 text-xl">Белки</Text>
                <Input variant="half-rounded" size="2xl">
                  <InputField
                    keyboardType="numeric"
                    value={displayData.nutritionPlan.protein.toString()}
                    onChangeText={(val) => {
                      const num = Number(val);

                      if (!isNaN(num)) {
                        setDisplayData({
                          ...displayData,
                          nutritionPlan: {
                            ...displayData.nutritionPlan,
                            protein: Number(val),
                          },
                        });
                      }
                    }}
                  />
                </Input>
              </VStack>
              <VStack space="xs">
                <Text className="text-typography-300 text-xl">Жиры</Text>
                <Input variant="half-rounded" size="2xl">
                  <InputField
                    keyboardType="numeric"
                    value={displayData.nutritionPlan.fat.toString()}
                    onChangeText={(val) => {
                      const num = Number(val);

                      if (!isNaN(num)) {
                        setDisplayData({
                          ...displayData,
                          nutritionPlan: {
                            ...displayData.nutritionPlan,
                            fat: Number(val),
                          },
                        });
                      }
                    }}
                  />
                </Input>
              </VStack>
              <VStack space="xs">
                <Text className="text-typography-300 text-xl">Углеводы</Text>
                <Input variant="half-rounded" size="2xl">
                  <InputField
                    keyboardType="numeric"
                    value={displayData.nutritionPlan.carbs.toString()}
                    onChangeText={(val) => {
                      const num = Number(val);

                      if (!isNaN(num)) {
                        setDisplayData({
                          ...displayData,
                          nutritionPlan: {
                            ...displayData.nutritionPlan,
                            carbs: Number(val),
                          },
                        });
                      }
                    }}
                  />
                </Input>
              </VStack>
              <Button
                size="xl"
                action="primary"
                className="w-full rounded-2xl"
                isDisabled={
                  JSON.stringify(displayData) === JSON.stringify(userData)
                }
                onPress={handleCalculatePlan}
              >
                <ButtonText>Рассчитать</ButtonText>
              </Button>
            </VStack>
          </Card>
          <HStack className="justify-between px-3 w-full mt-8">
            <Button
              size="xl"
              action="primary"
              className="w-[55%] rounded-2xl"
              isDisabled={
                isInvalid.isHeightInvalid ||
                isInvalid.isWeightInvalid ||
                isInvalid.isAgeInvalid ||
                JSON.stringify(displayData) === JSON.stringify(userData)
              }
              onPress={handleSaveChanges}
            >
              <ButtonText>Сохранить</ButtonText>
            </Button>
            <Button
              size="xl"
              action="negative"
              className="w-[40%] rounded-2xl"
              onPress={handleReset}
              isDisabled={
                JSON.stringify(displayData) === JSON.stringify(userData)
              }
            >
              <ButtonText>Сбросить</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </VStack>
  );
}
