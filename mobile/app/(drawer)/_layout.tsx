import React, { useState } from "react";
import { View } from "react-native";
import { Drawer as ExpoDrawer } from "expo-router/drawer";
import { LinearGradient } from "expo-linear-gradient"; // Исправлен импорт для Expo
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { ChevronRightIcon, MenuIcon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerBody,
  DrawerFooter,
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
          name="favorite-products"
          options={{ title: "Favorites" }}
        />
        <ExpoDrawer.Screen
          name="meal-templates"
          options={{ title: "Meal templates" }}
        />
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
              className="w-16 h-16"
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
        <DrawerContent style={{ paddingBottom: insets.bottom }}>
          <DrawerBody>
            <VStack className="items-center px-3" space="sm">
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
              >
                <ButtonText>О проекте</ButtonText>
                <ButtonIcon
                  size="2xl"
                  as={ChevronRightIcon}
                  className="stroke-primary-600 ml-auto"
                />
              </Button>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="$1" borderColor="$borderLight300">
            <Button
              size="xl"
              action="negative"
              onPress={() => handleIsOpen(false)}
              className="w-full rounded-2xl"
            >
              <ButtonText>Закрыть</ButtonText>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </View>
  );
}
