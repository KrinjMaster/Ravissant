import { Button, ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import Constants from "expo-constants";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionTitleText,
  AccordionContent,
  AccordionContentText,
  AccordionIcon,
} from "@/components/ui/accordion";
import { Divider } from "@/components/ui/divider";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Icon,
} from "@/components/ui/icon";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Card } from "@/components/ui/card";
import { Pressable, ScrollView } from "react-native";
import * as Linking from "expo-linking";

const AnimatedAccordionIcon = Animated.createAnimatedComponent(AccordionIcon);

function Chevron({ isExpanded }: { isExpanded: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withTiming(isExpanded ? "180deg" : "0deg", {
          duration: 200,
        }),
      },
    ],
  }));

  return (
    <AnimatedAccordionIcon
      as={ChevronUpIcon}
      className="ml-3"
      style={animatedStyle}
    />
  );
}

export default function FAQ() {
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const openLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);

      console.log("Can open:", canOpen);

      if (!canOpen) {
        console.log("Cannot open URL:", url);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  };

  return (
    <VStack
      className="w-screen h-screen bg-secondary-0 px-2"
      space="2xl"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
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
          FAQ
        </Text>
      </HStack>
      <Text className="px-5 text-start" size="xl">
        <Text className="text-primary-500" size="2xl">
          Ravissant
        </Text>{" "}
        — французское слово, которое можно перевести как «восхитительный» или
        «очаровательный»
      </Text>
      <ScrollView>
        <Accordion
          size="md"
          variant="unfilled"
          type="multiple"
          isCollapsible={true}
          isDisabled={false}
          className="w-[95%] mx-auto"
        >
          <AccordionItem value="a">
            <AccordionHeader>
              <AccordionTrigger>
                {({ isExpanded }: { isExpanded: boolean }) => (
                  <>
                    <AccordionTitleText className="text-xl">
                      Для чего был создан проект?
                    </AccordionTitleText>
                    <Chevron isExpanded={isExpanded} />
                  </>
                )}
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <AccordionContentText>
                Мне хотелось научиться делать приложения на React Native, ну и я
                не знаю русских аналогов трекеров калорий, хз
              </AccordionContentText>
            </AccordionContent>
          </AccordionItem>
          <Divider />
          <AccordionItem value="b">
            <AccordionHeader>
              <AccordionTrigger>
                {({ isExpanded }: { isExpanded: boolean }) => (
                  <>
                    <AccordionTitleText className="text-xl">
                      Откуда берутся данные о продуктах?
                    </AccordionTitleText>
                    <Chevron isExpanded={isExpanded} />
                  </>
                )}
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <AccordionContentText>
                База формируется автоматически из открытых источников магазинов,
                может содержать неточности, но это уже не моя вина :)
              </AccordionContentText>
            </AccordionContent>
          </AccordionItem>
          <Divider />
          <AccordionItem value="c">
            <AccordionHeader>
              <AccordionTrigger>
                {({ isExpanded }: { isExpanded: boolean }) => (
                  <>
                    <AccordionTitleText className="text-xl">
                      Почему я не могу найти нужный продукт?
                    </AccordionTitleText>
                    <Chevron isExpanded={isExpanded} />
                  </>
                )}
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <AccordionContentText>
                Некоторые товары могут отсутствовать в базе. Я постепенно её
                пополняю
              </AccordionContentText>
            </AccordionContent>
          </AccordionItem>
          <Divider />
          <AccordionItem value="d">
            <AccordionHeader>
              <AccordionTrigger>
                {({ isExpanded }: { isExpanded: boolean }) => (
                  <>
                    <AccordionTitleText className="text-xl">
                      Где хранятся мои данные?
                    </AccordionTitleText>
                    <Chevron isExpanded={isExpanded} />
                  </>
                )}
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <AccordionContentText>
                Все ваши записи хранятся только на вашем устройстве, у меня нет
                ресурсов на постоянный сервер :(
              </AccordionContentText>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollView>
      <Card variant="half-rounded" className="p-2 mt-auto">
        <Text size="xl" className="text-typography-400 px-3">
          Разработчик
        </Text>
        <Text size="2xl" className="px-3 pb-3 text-primary-600">
          Максим Меньшиков
        </Text>
        <Pressable
          className="flex-row items-center px-3 py-1.5"
          onPress={() => openLink("https://github.com/KrinjMaster/Ravissant")}
        >
          <Text className="flex-1" size="lg">
            GitHub
          </Text>
          <Icon
            as={ChevronRightIcon}
            size="md"
            className="text-typography-400"
          />
        </Pressable>
        <Pressable
          className="flex-row items-center px-3 py-1.5"
          onPress={() => openLink("https://t.me/krinjmaster")}
        >
          <Text className="flex-1" size="lg">
            Telegram
          </Text>
          <Icon
            as={ChevronRightIcon}
            size="md"
            className="text-typography-400"
          />
        </Pressable>
        <Pressable
          className="flex-row items-center px-3 py-1.5"
          onPress={() => openLink("mailto:maximmenchikov@gmail.com")}
        >
          <Text className="flex-1" size="lg">
            Почта
          </Text>
          <Icon
            as={ChevronRightIcon}
            size="md"
            className="text-typography-400"
          />
        </Pressable>
        <Text className="text-center text-typography-300">
          v{Constants.expoConfig?.version} ❤️
        </Text>
      </Card>
    </VStack>
  );
}
