import { HomePage } from "@/features/homepage/HomePage";
import { queryClient } from "@/constants/query";
import { productService } from "@/services/product.service";
import type { MealType } from "@/types/products";
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useSQLiteContext } from "expo-sqlite";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export default function Index() {
  const [displayDate, setDisplayDate] = useState(() => new Date());
  const db = useSQLiteContext();
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(-width);
  const isSettling = useSharedValue(false);
  const thresholdCrossed = useSharedValue(false);

  const changeDate = (days: number) => {
    setDisplayDate((currentDate) => {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + days);
      return nextDate;
    });
  };

  const dateForOffset = useCallback((offset: number) => {
    const date = new Date(displayDate);
    date.setDate(date.getDate() + offset);
    return date;
  }, [displayDate]);

  useEffect(() => {
    const adjacentDates = [-1, 1].map((offset) => dateForOffset(offset));
    const meals: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

    adjacentDates.forEach((date) => {
      const day = date.toISOString();
      const dayKey = day.substring(0, 10);

      queryClient.prefetchQuery({
        queryKey: ["summary", dayKey],
        queryFn: () => productService.getSummary(db, day),
      });

      meals.forEach((meal) => {
        queryClient.prefetchQuery({
          queryKey: ["meal-info", `${dayKey} ${meal}`],
          queryFn: () => productService.getMealMacros(db, day, meal),
        });
      });
    });
  }, [dateForOffset, db]);

  const resetPager = (days: number) => {
    changeDate(days);
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      if (isSettling.value) return;
      translateX.value = -width + event.translationX;
      const crossed =
        Math.abs(event.translationX) > width * 0.25 ||
        Math.abs(event.velocityX) > 700;

      if (crossed && !thresholdCrossed.value) {
        thresholdCrossed.value = true;
        runOnJS(Haptics.selectionAsync)();
      } else if (!crossed) {
        thresholdCrossed.value = false;
      }
    })
    .onEnd((event) => {
      if (isSettling.value) return;
      isSettling.value = true;
      const shouldChangeDate =
        Math.abs(event.translationX) > width * 0.25 ||
        Math.abs(event.velocityX) > 700;

      if (!shouldChangeDate) {
        translateX.value = withTiming(-width, { duration: 180 }, () => {
          isSettling.value = false;
          thresholdCrossed.value = false;
        });
        return;
      }

      const days = event.translationX < 0 ? 1 : -1;
      translateX.value = withTiming(
        days > 0 ? -2 * width : 0,
        {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(resetPager)(days);
          }
        },
      );
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useLayoutEffect(() => {
    // Recenter only after React renders the new date pages.
    // eslint-disable-next-line react-hooks/immutability
    translateX.value = -width;
    isSettling.value = false;
    thresholdCrossed.value = false;
  }, [displayDate, isSettling, thresholdCrossed, translateX, width]);

  return (
    <GestureDetector gesture={swipeGesture}>
      <View className="flex-1 overflow-hidden bg-secondary-0">
        <Animated.View
          style={[
            { flexDirection: "row", width: width * 3, height: "100%" },
            animatedStyle,
          ]}
        >
          {[dateForOffset(-1), displayDate, dateForOffset(1)].map((date) => (
            <View key={date.toISOString().substring(0, 10)} style={{ width }}>
              <HomePage displayDate={date} onChangeDate={changeDate} />
            </View>
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
