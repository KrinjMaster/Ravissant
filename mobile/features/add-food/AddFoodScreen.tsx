import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { ArrowLeftIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSearchItems } from "@/hooks/useSearchItems";
import { MealType } from "@/types/products";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView } from "react-native";

export const AddFoodScreen = ({
  meal,
  date,
}: {
  meal: MealType;
  date: string;
}) => {
  const [searchString, setSearchString] = useState("");
  const { data, isLoading } = useSearchItems(searchString);
  const handleFinish = () => {
    router.back();
  };
  const handleForward = (productId: string, date: string, meal: string) => {
    router.push({
      pathname: "/modal/add-product",
      params: {
        productId,
        meal,
        date,
      },
    });
  };

  return (
    <VStack className="w-screen h-screen bg-secondary-0 pt-16 px-2" space="xl">
      <HStack className="items-center justify-center">
        <Button
          action="tertiary"
          onPress={handleFinish}
          className="absolute left-0 pl-1.5 pr-3.5"
        >
          <ButtonIcon as={ArrowLeftIcon} color="white" size="2xl" />
          <ButtonText size="md">Назад</ButtonText>
        </Button>
        <Text size="3xl" className="text-center">
          {meal}
        </Text>
      </HStack>
      <FormControl>
        <Input variant="half-rounded" size="2xl">
          <InputField
            placeholder="Введи че-нибудь"
            value={searchString}
            onChangeText={(text) => setSearchString(text)}
          />
        </Input>
      </FormControl>
      <ScrollView className="flex-1 px-3">
        <VStack space="sm">
          {isLoading ? <Text size="6xl">LOADING</Text> : null}
          {data && searchString.length !== 0
            ? data.map(({ name, brand, id, calories }) => (
                <Pressable
                  key={id}
                  onPress={() => handleForward(id, date, meal)}
                >
                  <Card size="md" variant="outline" className="rounded-xl">
                    <Heading size="sm" className="line-clamp-1">
                      {name}
                    </Heading>
                    <Heading size="sm" className="line-clamp-1">
                      {brand}
                    </Heading>
                    <Text>{calories} ккал / 100г</Text>
                  </Card>
                </Pressable>
              ))
            : null}
        </VStack>
      </ScrollView>
    </VStack>
  );
};
