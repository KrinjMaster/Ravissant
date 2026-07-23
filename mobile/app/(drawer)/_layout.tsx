import React, { useState } from "react";
import { View } from "react-native";
import { Drawer as ExpoDrawer } from "expo-router/drawer";
import { LinearGradient } from "expo-linear-gradient"; // Исправлен импорт для Expo
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import {
  ChevronRightIcon,
  ChevronUpIcon,
  Icon,
  MenuIcon,
} from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Divider } from "@/components/ui/divider";
import { VStack } from "@/components/ui/vstack";
import { Href, router, usePathname } from "expo-router";
import * as Haptics from "expo-haptics";

export default function DrawerLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const handleForward = (route: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route);
    setIsOpen(false);
  };

  const handleIsOpen = (state: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOpen(state);
  };

  return (
    <View className="flex-1">
      <ExpoDrawer
        screenOptions={{
          swipeEdgeWidth: 0,
          headerShown: false,
          drawerStyle: { width: 0 },
        }}
      >
        <ExpoDrawer.Screen name="index" options={{ title: "Home" }} />
        <ExpoDrawer.Screen name="profile" options={{ title: "Profile" }} />
        <ExpoDrawer.Screen
          name="meal-templates"
          options={{ title: "Meal templates" }}
        />
        <ExpoDrawer.Screen
          name="favorite-products"
          options={{ title: "Favorites" }}
        />
        <ExpoDrawer.Screen
          name="statistics"
          options={{ title: "Statistics" }}
        />
        <ExpoDrawer.Screen name="faq" options={{ title: "FAQ" }} />
      </ExpoDrawer>
      <View
        className={`${pathname === "/" ? "absolute" : "hidden"} bottom-0 left-0 right-0 z-50 overflow-hidden`}
      >
        <LinearGradient
          colors={["black", "transparent"]}
          style={{ paddingBottom: insets.bottom - 8 }}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
        >
          <HStack className="w-full justify-start pt-10 px-6 bg-transparent">
            <Button
              size="xl"
              action="primary"
              className="w-16 h-16 rounded-full"
              onPress={() => handleIsOpen(true)}
            >
              <ButtonIcon as={MenuIcon} size="3xl" color="white" />
            </Button>
          </HStack>
        </LinearGradient>
      </View>
      <Drawer
        isOpen={isOpen}
        onClose={() => handleIsOpen(false)}
        anchor="bottom"
        size="md"
      >
        <DrawerBackdrop />
        <DrawerContent
          style={{ paddingBottom: insets.bottom }}
          className="px-5 pt-2.5 h-[27rem]"
        >
          <Icon
            as={ChevronUpIcon}
            className="stroke-secondary-200 h-12 w-12 mx-auto scale-x-150"
          />
          <VStack className="items-center overflow-hidden my-auto" space="sm">
            <Button
              action="secondary"
              variant="link"
              size="lg"
              className="justify-start px-4 w-[95%]"
              onPress={() => handleForward("/profile")}
            >
              <ButtonText>Профиль</ButtonText>
              <ButtonIcon
                size="2xl"
                as={ChevronRightIcon}
                className="stroke-primary-600 ml-auto"
              />
            </Button>
            <Divider className="bg-secondary-100 w-full h-0.5" />
            <Button
              action="secondary"
              variant="link"
              size="lg"
              className="justify-start px-4 w-[95%]"
              onPress={() => handleForward("/meal-templates")}
            >
              <ButtonText>Рецепты</ButtonText>
              <ButtonIcon
                size="2xl"
                as={ChevronRightIcon}
                className="stroke-primary-600 ml-auto"
              />
            </Button>
            <Divider className="bg-secondary-100 w-full h-0.5" />
            <Button
              action="secondary"
              variant="link"
              size="lg"
              className="justify-start px-4 w-[95%]"
              onPress={() => handleForward("/favorite-products")}
            >
              <ButtonText>Любимые продукты</ButtonText>
              <ButtonIcon
                size="2xl"
                as={ChevronRightIcon}
                className="stroke-primary-600 ml-auto"
              />
            </Button>
            <Divider className="bg-secondary-100 w-full h-0.5" />
            <Button
              action="secondary"
              variant="link"
              size="lg"
              className="justify-start px-4 w-[95%]"
              onPress={() => handleForward("/statistics")}
            >
              <ButtonText>Статистика</ButtonText>
              <ButtonIcon
                size="2xl"
                as={ChevronRightIcon}
                className="stroke-primary-600 ml-auto"
              />
            </Button>
            <Divider className="bg-secondary-100 w-full h-0.5" />
            <Button
              action="secondary"
              variant="link"
              size="lg"
              className="justify-start px-4 w-[95%]"
              onPress={() => handleForward("/faq")}
            >
              <ButtonText>О проекте</ButtonText>
              <ButtonIcon
                size="2xl"
                as={ChevronRightIcon}
                className="stroke-primary-600 ml-auto"
              />
            </Button>
          </VStack>
        </DrawerContent>
      </Drawer>
    </View>
  );
}
