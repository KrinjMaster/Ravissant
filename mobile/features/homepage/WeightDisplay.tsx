import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { useWeightLog } from "@/hooks/useWeightLog";
import { useOnboard } from "@/hooks/useOnboard";
import { useRecentWeight } from "@/hooks/useRecentWeight";
import { AddIcon, RemoveIcon } from "@/components/ui/icon";
import { Button, ButtonIcon } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { useEffect } from "react";

export const WeightDisplay = () => {
  const { mutateAsync: addWeight } = useWeightLog();
  const { data: weightData, isLoading } = useRecentWeight();
  const { userData } = useOnboard();

  const handleChangeWeight = async (offset: number) => {
    if (weightData) {
      await addWeight({
        weight: weightData.weight + offset,
        day: new Date(Date.now()).toISOString().substring(0, 10),
      });
    }
  };

  useEffect(() => {
    if (!weightData && !isLoading) {
      async function initWeight() {
        if (userData.weight) {
          await addWeight({
            weight: userData.weight,
            day: new Date(Date.now()).toISOString().substring(0, 10),
          });
        }
      }

      initWeight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <Card className="w-full h-48 p-2.5" variant="half-rounded">
      <HStack className="h-full justify-between items-center px-5" space="lg">
        <Button
          action="default"
          variant="outline"
          size="xl"
          onPress={() => handleChangeWeight(-0.1)}
          className="w-16 h-16"
        >
          <ButtonIcon as={RemoveIcon} size="2xl" />
        </Button>
        <VStack className="w-[60%] items-center relative">
          <Text size="7xl">
            {weightData ? weightData.weight.toFixed(1) : userData.weight}
          </Text>
          <Text size="3xl" className="absolute text-typography-300 -bottom-6">
            кг
          </Text>
        </VStack>
        <Button
          action="default"
          variant="outline"
          size="xl"
          onPress={() => handleChangeWeight(0.1)}
          className="w-16 h-16"
        >
          <ButtonIcon as={AddIcon} size="2xl" />
        </Button>
      </HStack>
    </Card>
  );
};
