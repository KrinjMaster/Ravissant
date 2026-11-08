import { HomePage } from "@/features/homepage/HomePage";
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useState } from "react";

export default function Index() {
  const [displayDate, setDisplayDate] = useState(() => new Date());
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(-width);

  const changeDate = (days: number) => {
    setDisplayDate((currentDate) => {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + days);
      return nextDate;
    });
  };

  const dateForOffset = (offset: number) => {
    const date = new Date(displayDate);
    date.setDate(date.getDate() + offset);
    return date;
  };

  const resetPager = (days: number) => {
    changeDate(days);
    translateX.value = -width;
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      translateX.value = -width + event.translationX;
    })
    .onEnd((event) => {
      const shouldChangeDate =
        Math.abs(event.translationX) > width * 0.25 ||
        Math.abs(event.velocityX) > 700;

      if (!shouldChangeDate) {
        translateX.value = withTiming(-width, { duration: 180 });
        return;
      }

      const days = event.translationX > 0 ? 1 : -1;
      translateX.value = withTiming(
        days > 0 ? 0 : -2 * width,
        {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) runOnJS(resetPager)(days);
        },
      );
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={swipeGesture}>
      <View className="flex-1 overflow-hidden bg-secondary-0">
        <Animated.View
          style={[{ flexDirection: "row", width: width * 3 }, animatedStyle]}
        >
          {[dateForOffset(-1), displayDate, dateForOffset(1)].map((date) => (
            <View key={date.toISOString().substring(0, 10)} style={{ width }}>
              <HomePage displayDate={date} />
            </View>
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
