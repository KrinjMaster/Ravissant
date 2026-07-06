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
  createAnimatedComponent,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { VStack } from "@/components/ui/vstack";
import { useOnboard } from "@/hooks/useOnboard";
import { getAge } from "@/utils/date";
import { IntroductionCard } from "./questions/IntroductionCard";
import { SexQuestionCard } from "./questions/SexQuestionCard";
import { AgeQuestionCard } from "./questions/AgeQuestionCard";
import { WeightQuestionCard } from "./questions/WeightQuestionCards";
import { HeightQuestionCard } from "./questions/HeightQuestionCard";
import { ActivityQuestionCard } from "./questions/ActivityQuestionCard";
import { GoalQuestionCard } from "./questions/GoalQuestionCard";
import { FinalScreenCard } from "./questions/FinalScreenCard";

const AnimatedTrack = createAnimatedComponent(ProgressFilledTrack);

export const OnboardCards = () => {
  const data = useMemo(
    () => [
      <IntroductionCard key="1" />,
      <SexQuestionCard key="2" />,
      <AgeQuestionCard key="3" />,
      <WeightQuestionCard key="4" />,
      <HeightQuestionCard key="5" />,
      <ActivityQuestionCard key="6" />,
      <GoalQuestionCard key="7" />,
      <FinalScreenCard key="8" />,
    ],
    [],
  );

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const { userData } = useOnboard();

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentQuestion((prev) => prev - 1);
  };

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentQuestion((prev) => prev + 1);
  };

  const canProceed = (() => {
    switch (currentQuestion) {
      case 0:
        return true;
      case 1:
        return !!userData.sex;
      case 2:
        return userData.birthday
          ? getAge(new Date(userData.birthday)) >= 18
          : false;
      case 3:
        return (
          !!userData.weight && userData.weight >= 30 && userData.weight <= 300
        );
      case 4:
        return (
          !!userData.height && userData.height >= 120 && userData.height <= 250
        );
      case 5:
        return !!userData.activityLevel;
      case 6:
        return !!userData.goal;
      default:
        return false;
    }
  })();

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
          disabled={currentQuestion === data.length - 1 || !canProceed}
          onPress={goNext}
          className="w-[55%]"
        >
          <ButtonText>Вперед</ButtonText>
        </Button>
      </View>
    </VStack>
  );
};
