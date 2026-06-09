import { View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { Button, ButtonText } from "@/components/ui/button/index";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  SlideOutRight,
  SlideInRight,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { IntroductionCard } from "./questions/IntroductionCard";
import { SexQuestionCard } from "./questions/SexQuestionCard";
import { VStack } from "@/components/ui/vstack";
// import { ActivityQuestionCard } from "./questions/ActivityQuestionCard";
// import { GoalQuestionCard } from "./questions/GoalQuestionCard";
// import { WeightQuestionCard } from "./questions/WeightQuestionCards";
// import { AgeQuestionCard } from "./questions/AgeQuestionCard";
// import { HeightQuestionCard } from "./questions/HeightQuestionCard";

const AnimatedTrack = Animated.createAnimatedComponent(ProgressFilledTrack);

export const OnboardCards = () => {
  const data = useMemo(
    () => [
      <IntroductionCard key="1" />,
      <SexQuestionCard key="2" />,
      // <AgeQuestionCard key="3" />,
      // <WeightQuestionCard key="4" />,
      // <HeightQuestionCard key="5" />,
      // <GoalQuestionCard key="6" />,
      // <ActivityQuestionCard key="7" />,
    ],
    [],
  );

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentQuestion((prev) => prev - 1);
  };
  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    <VStack className="pt-[10%] pb-[0%]" space="3xl">
      <VStack className="flex-row h-[90%]" space="md">
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
      </VStack>
      <View className="flex-row w-[95%] justify-between">
        <Button
          size="xl"
          action="primary"
          disabled={currentQuestion === 0}
          onPress={goBack}
          className="w-[40%]"
        >
          <ButtonText>Назад</ButtonText>
        </Button>
        <Button
          size="xl"
          action="primary"
          disabled={currentQuestion === data.length - 1}
          onPress={goNext}
          className="w-[58%]"
        >
          <ButtonText>Вперед</ButtonText>
        </Button>
      </View>
    </VStack>
  );
};
