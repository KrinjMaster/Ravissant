import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { HomePageSkeleton } from "@/features/skeletons/HomePageSkeleton";
import { useMacrosSummary } from "@/hooks/useMacrosSummary";
import { useMealInfo } from "@/hooks/useMealInfo";
import { useOnboard } from "@/hooks/useOnboard";
import { MealType } from "@/types/products";
import { calculateMealCalories } from "@/utils/onboard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function Index() {
  const [displayDate] = useState(new Date(Date.now()));
  const { data: macrosData, isLoading: isMacrosLoading } = useMacrosSummary(
    displayDate.toISOString(),
  );
  const { userData } = useOnboard();
  const caloriesByMeal = calculateMealCalories(
    userData.nutritionPlan?.calories ?? 0,
  );

  const { data: mealData1, isLoading: isMeal1Loading } = useMealInfo(
    displayDate.toISOString(),
    "breakfast",
  );
  const { data: mealData2, isLoading: isMeal2Loading } = useMealInfo(
    displayDate.toISOString(),
    "lunch",
  );
  const { data: mealData3, isLoading: isMeal3Loading } = useMealInfo(
    displayDate.toISOString(),
    "dinner",
  );
  const { data: mealData4, isLoading: isMeal4Loading } = useMealInfo(
    displayDate.toISOString(),
    "snack",
  );

  const openModal = (meal: MealType) => {
    router.push({
      pathname: "/modal/add-food",
      params: {
        meal: meal,
        date: displayDate.toISOString().substring(0, 10),
      },
    });
  };

  useEffect(() => {
    if (!isMacrosLoading || !isMeal1Loading) {
      console.log(true, macrosData, mealData1, caloriesByMeal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMacrosLoading, isMeal1Loading]);

  if (isMacrosLoading || isMeal1Loading) {
    return <HomePageSkeleton />;
  }

  return (
    <View className="flex-1 bg-secondary-0 py-20 px-2.5">
      <Text className="mb-10">{displayDate.toLocaleString()}</Text>
      <Text>
        калории {macrosData?.calories} / {userData.nutritionPlan?.calories}
      </Text>
      <Text>
        жиры {macrosData?.fat} / {userData.nutritionPlan?.fat}
      </Text>
      <Text>
        белки {macrosData?.protein} / {userData.nutritionPlan?.protein}
      </Text>
      <Text>
        углеводы {macrosData?.carbs} / {userData.nutritionPlan?.carbs}
      </Text>
      {
        // Breakfast
      }
      <Text className="mt-2">Завтрак</Text>
      <Text>
        калории {mealData1?.summary?.calories} / {caloriesByMeal.breakfast}
      </Text>
      <Text>жиры {mealData1?.summary?.fat}</Text>
      <Text>белки {mealData1?.summary?.protein}</Text>
      <Text>углеводы {mealData1?.summary?.carbs} </Text>
      {
        // Lunch
      }
      <Text className="mt-2">Обед</Text>
      <Text>
        калории {mealData2?.summary?.calories} / {caloriesByMeal.lunch}
      </Text>
      <Text>жиры {mealData2?.summary?.fat}</Text>
      <Text>белки {mealData2?.summary?.protein}</Text>
      <Text>углеводы {mealData2?.summary?.carbs} </Text>
      {
        // Dinner
      }
      <Text className="mt-2">Ужин</Text>
      <Text>
        калории {mealData3?.summary?.calories} / {caloriesByMeal.dinner}
      </Text>
      <Text>жиры {mealData3?.summary?.fat}</Text>
      <Text>белки {mealData3?.summary?.protein}</Text>
      <Text>углеводы {mealData3?.summary?.carbs} </Text>
      {
        // Snack
      }
      <Text className="mt-2">Перекус</Text>
      <Text>
        калории {mealData4?.summary?.calories} / {caloriesByMeal.snack}
      </Text>
      <Text>жиры {mealData4?.summary?.fat}</Text>
      <Text>белки {mealData4?.summary?.protein}</Text>
      <Text>углеводы {mealData4?.summary?.carbs} </Text>
      <Button className="my-2.5" onPress={() => openModal("breakfast")}>
        <ButtonText>Добавить завтрак</ButtonText>
      </Button>
      <Button className="my-2.5" onPress={() => openModal("lunch")}>
        <ButtonText>Добавить обед</ButtonText>
      </Button>
      <Button className="my-2.5" onPress={() => openModal("dinner")}>
        <ButtonText>Добавить ужин</ButtonText>
      </Button>
      <Button className="my-2.5" onPress={() => openModal("snack")}>
        <ButtonText>Добавить перекус</ButtonText>
      </Button>
    </View>
  );
}
