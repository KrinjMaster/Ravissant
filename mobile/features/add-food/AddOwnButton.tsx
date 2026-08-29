import { Button, ButtonIcon } from "@/components/ui/button";
import {
  AddIcon,
  GlobeIcon,
  Icon,
  PlayIcon,
  SettingsIcon,
} from "@/components/ui/icon";
import { Menu, MenuItem, MenuItemLabel } from "@/components/ui/menu";
import React from "react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

export const AddOwnButton = () => {
  const handleAddTemplate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/modal/add-template");
  };

  const handleAddProduct = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/modal/add-own-product");
  };

  return (
    <Menu
      placement="left top"
      offset={10}
      disabledKeys={["Settings"]}
      trigger={({ ...triggerProps }) => {
        return (
          <Button
            {...triggerProps}
            action="primary"
            variant="solid"
            className="absolute right-0 rounded-full"
            size="xl"
          >
            <ButtonIcon as={AddIcon} size="2xl" />
          </Button>
        );
      }}
    >
      <MenuItem
        onPress={handleAddProduct}
        key="Add Product"
        textValue="Add Product"
      >
        <MenuItemLabel size="xl">Добавить продукт</MenuItemLabel>
      </MenuItem>
      <MenuItem
        onPress={handleAddTemplate}
        key="Add Template"
        textValue="Add Template"
      >
        <MenuItemLabel size="xl">Добавить рецепт</MenuItemLabel>
      </MenuItem>
    </Menu>
  );
};
