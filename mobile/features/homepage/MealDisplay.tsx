import { Button, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { AddIcon } from "@/components/ui/icon";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton/Skeleton";
import { Text } from "@/components/ui/text";
import { useMealInfo } from "@/hooks/useMealInfo";
import { MealType } from "@/types/products";
import { getMealLocale } from "@/utils/meals";

export const MealDisplay = ({
  meal,
  date,
  plannedCalories,
}: {
  meal: MealType;
  date: Date;
  plannedCalories: number;
}) => {
  const { data: mealData, isLoading } = useMealInfo(
    date.toISOString(),
    "breakfast",
  );

  if (!mealData || isLoading) {
    return (
      <Card className="w-full h-[7%]" variant="half-rounded">
        <SkeletonText _lines={1} className="h-[90%] w-[50%] my-auto" />
      </Card>
    );
  }

  return (
    <Card className="w-full h-[7%] py-2.5" variant="half-rounded">
      <HStack className="items-center h-full" space="lg">
        <Heading size="2xl">{getMealLocale(meal)}</Heading>
        <Text size="md" className="text-secondary-800">
          {mealData.summary.calories} / {plannedCalories} ккал
        </Text>
        <Button
          variant="solid"
          action="primary"
          size="lg"
          className="ml-auto h-full border-none"
        >
          <ButtonIcon as={AddIcon} size="2xl" color="white" />
        </Button>
      </HStack>
    </Card>
  );
};
