import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSearchItems } from "@/hooks/useSearchItems";
import { MealType } from "@/types/products";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Keyboard, ScrollView, TouchableWithoutFeedback } from "react-native";

export const AddFoodScreen = ({
  meal,
  date,
}: {
  meal: MealType;
  date: string;
}) => {
  const [searchString, setSearchString] = useState("");
  const { data } = useSearchItems(searchString);
  const handleFinish = () => {
    router.back();
  };

  useEffect(() => {
    console.log(data);
  }, [searchString]);

  return (
    <VStack className="w-screen h-screen bg-secondary-0 pt-16 pb-8 px-2">
      <Text>{meal}</Text>
      <FormControl>
        <Input variant="half-rounded" size="2xl">
          <InputField
            placeholder="Введи че-нибудь"
            value={searchString}
            onChangeText={(text) => setSearchString(text)}
          />
        </Input>
      </FormControl>
      <ScrollView className="mt-5 flex-1 px-3">
        <VStack space="sm">
          {data && searchString.length !== 0
            ? data.map(({ name, brand, id, calories }) => (
                <Card
                  size="md"
                  key={id}
                  variant="outline"
                  className="rounded-xl"
                >
                  <Heading size="sm" className="line-clamp-1">
                    {name}
                  </Heading>
                  <Heading size="sm" className="line-clamp-1">
                    {brand}
                  </Heading>
                  <Text>{calories}</Text>
                </Card>
              ))
            : null}
        </VStack>
      </ScrollView>
      <Button
        action="primary"
        onPress={handleFinish}
        className="fixed bottom-0 left-0 right-0"
      >
        <ButtonText>Завершить</ButtonText>
      </Button>
    </VStack>
  );
};
