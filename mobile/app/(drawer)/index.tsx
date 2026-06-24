import { Text } from "@/components/ui/text";
import { HomePageSkeleton } from "@/features/skeletons/HomePageSkeleton";
import { useMacrosSummary } from "@/hooks/useMacrosSummary";
import { useMealInfo } from "@/hooks/useMealInfo";
import { useOnboard } from "@/hooks/useOnboard";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function Index() {
  const [displayDate] = useState(new Date(Date.now()));
  const { data: macrosData, isLoading: isMacrosLoading } = useMacrosSummary(
    displayDate.toISOString(),
  );
  const { userData } = useOnboard();

  const { data: mealData, isLoading: isMealLoading } = useMealInfo(
    displayDate.toISOString(),
    "breakfast",
  );

  useEffect(() => {
    if (!isMacrosLoading || !isMealLoading) {
      console.log(true, macrosData, mealData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMacrosLoading, isMealLoading]);

  if (isMacrosLoading || isMealLoading) {
    return <HomePageSkeleton />;
  }

  return (
    <View className="flex-1 bg-secondary-0 py-20 px-2.5">
      <Text>
        calories {macrosData?.calories} / {userData.nutritionPlan?.calories}
      </Text>
      <Text>
        fats {macrosData?.fats} / {userData.nutritionPlan?.fat}
      </Text>
      <Text>
        protein {macrosData?.proteins} / {userData.nutritionPlan?.protein}
      </Text>
      <Text>
        carbs {macrosData?.carbs} / {userData.nutritionPlan?.carbs}
      </Text>
      <Text className="mt-8">Breakfast</Text>
    </View>
  );
}
