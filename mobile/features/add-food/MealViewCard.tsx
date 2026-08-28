import { ViewCardProps } from "@/app/modal/add-food";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { AddIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import { Pressable } from "react-native";
import * as Haptics from "expo-haptics";

export const MealViewCard = ({
  name,
  id,
  calories,
  meal,
  date,
}: ViewCardProps) => {
  const handleForward = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    router.push({
      pathname: "/modal/view-template",
      params: {
        templateId: id,
        mode: "add",
        meal,
        date,
      },
    });
  };

  return (
    <Pressable onPress={() => handleForward(id)}>
      <Card size="md" variant="half-rounded" className="rounded-xl p-0 pr-5">
        <HStack className="justify-between items-center">
          <Box className="w-[85%] p-3 pr-0">
            <Heading size="sm" className="line-clamp-2">
              {name}
            </Heading>
            <Text className="line-clamp-1 text-typography-300">Рецепт</Text>
            <Text>{calories} ккал</Text>
          </Box>
          <Button
            variant="solid"
            action="primary"
            size="xl"
            className="border-none rounded-full px-2 py-5 w-12 h-12"
            onPress={() => handleForward(id)}
          >
            <ButtonIcon as={AddIcon} size="2xl" />
          </Button>
        </HStack>
      </Card>
    </Pressable>
  );
};
