import { View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { NameQuestionCard } from "./questions/NameQuestionCard";
import { ActivityQuestionCard } from "./questions/ActivityQuestionCard";
import { GoalQuestionCard } from "./questions/GoalQuestionCard";
import { BioQuestionCard } from "./questions/BioQuestionCard";
import { Button, ButtonText } from "@/components/ui/button/index";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  SlideOutRight,
  SlideInLeft,
  FadeIn,
  FadeOut,
  FadeInRight,
  FadeOutRight,
  SlideInRight,
} from "react-native-reanimated";

const AnimatedTrack = Animated.createAnimatedComponent(ProgressFilledTrack);

export const OnboardCards = () => {
  const data = useMemo(
    () => [
      <NameQuestionCard key="1" />,
      <GoalQuestionCard key="2" />,
      <BioQuestionCard key="3" />,
      <ActivityQuestionCard key="4" />,
    ],
    [],
  );

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [direction, setDirection] = useState<"next" | "back" | null>(null);

  const goBack = () => {
    setDirection("back");
    setCurrentQuestion((prev) => prev - 1);
  };
  const goNext = () => {
    setDirection("next");
    setCurrentQuestion((prev) => prev + 1);
  };

  const progress = ((currentQuestion + 1) / data.length) * 100;
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(progress, {
      duration: 400,
      easing: Easing.inOut(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const animatedTrackStyle = useAnimatedStyle(() => ({
    height: `${animatedValue.value}%`,
  }));

  return (
    <View className="flex w-screen justify-between items-center pt-10 pb-2.5">
      <View className="flex flex-row w-[95%] h-[90%] gap-4">
        <Progress size="sm" orientation="vertical" className="h-[90%] my-auto">
          <AnimatedTrack style={animatedTrackStyle} />
        </Progress>
        <View className="flex-1 overflow-hidden">
          <Animated.View
            key={currentQuestion}
            entering={SlideInRight.duration(600).easing(
              Easing.inOut(Easing.cubic),
            )}
            exiting={SlideOutRight.duration(800).easing(
              Easing.inOut(Easing.cubic),
            )}
            className="w-full h-full"
          >
            {data[currentQuestion]}
          </Animated.View>
        </View>
      </View>
      <View className="flex-row w-[95%] justify-between">
        <Button
          size="xl"
          action="primary"
          disabled={currentQuestion === 0}
          onPress={goBack}
          className="w-[30%]"
        >
          <ButtonText>Назад</ButtonText>
        </Button>
        <Button
          size="xl"
          action="primary"
          disabled={currentQuestion === data.length - 1}
          onPress={goNext}
          className="w-[67%]"
        >
          <ButtonText>Вперед</ButtonText>
        </Button>
      </View>
    </View>
  );
};
