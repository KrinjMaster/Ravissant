import React, { useState } from "react";
import { View } from "react-native";
import { Drawer as ExpoDrawer } from "expo-router/drawer";
import { LinearGradient } from "expo-linear-gradient"; // Исправлен импорт для Expo
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Icon, CloseIcon, MenuIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Divider } from "@/components/ui/divider";
import { HStack } from "@/components/ui/hstack";
import { BlurView } from "expo-blur";
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";

export default function DrawerLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

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
      </ExpoDrawer>
      <View className="absolute bottom-0 left-0 right-0 z-50 overflow-hidden">
        <LinearGradient
          colors={["black", "transparent"]}
          style={{ paddingBottom: insets.bottom - 8 }}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          className="border border-white"
        >
          <HStack className="w-full justify-start pt-10 px-6 bg-transparent">
            <Button
              size="xl"
              action="primary"
              className="w-16 h-16"
              onPress={() => setIsOpen(true)}
            >
              <ButtonIcon as={MenuIcon} size="3xl" color="white" />
            </Button>
          </HStack>
        </LinearGradient>
      </View>
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchor="left"
        size="md"
      >
        <DrawerBackdrop />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="$1" borderColor="$borderLight300">
            <Heading size="lg">Меню навигации</Heading>
          </DrawerHeader>
          <DrawerBody py="$4">
            <Text>Здесь находятся ваши ссылки и контент.</Text>
          </DrawerBody>
          <DrawerFooter borderTopWidth="$1" borderColor="$borderLight300">
            <Button
              size="sm"
              action="negative"
              onPress={() => setIsOpen(false)}
            >
              <ButtonText>Закрыть</ButtonText>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </View>
  );
}
