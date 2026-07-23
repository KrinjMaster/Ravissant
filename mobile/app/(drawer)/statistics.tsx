import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { ArrowLeftIcon } from "@/components/ui/icon";
import { SkeletonText, Skeleton } from "@/components/ui/skeleton";
import { VStack } from "@/components/ui/vstack";
import { useWeight } from "@/hooks/useWeight";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dimensions } from "react-native";
import { Card } from "@/components/ui/card";
import { LineChart } from "@/features/general/LineChart";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { prepareWeightChartData } from "@/utils/weightChart";

export default function Statistics() {
  const [displayData, setDisplayData] = useState<number[]>([]);
  const [displayLabels, setDisplayLabels] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } =
    Dimensions.get("window");
  const { data: weightData, isLoading: isWeightLoading } = useWeight();

  useEffect(() => {
    if (weightData) {
      const { labels, data } = prepareWeightChartData(weightData);

      setDisplayLabels(labels);
      setDisplayData(data);
    }
  }, [weightData]);

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  if (
    !weightData ||
    isWeightLoading ||
    displayLabels.length === 0 ||
    displayData.length === 0
  ) {
    return (
      <VStack
        className="w-screen h-screen bg-secondary-0 pt-16 pb-16 px-2"
        space="xl"
      >
        <SkeletonText className="w-[60%] h-8 mx-auto" />
        <VStack className="w-full h-[50%] border justify-between mt-2.5">
          <Skeleton className="w-full h-[75%] px-3 py-2 rounded-xl" />
          <Skeleton className="w-full h-[20%] px-3 py-2 rounded-xl" />
        </VStack>
        <Skeleton className="w-full h-[13%] px-3 py-2 rounded-xl" />
        <Skeleton className="w-full h-[13%] px-3 py-2 rounded-xl" />
        <Skeleton className="w-full h-[13%] px-3 py-2 rounded-xl" />
      </VStack>
    );
  }

  return (
    <VStack
      className="w-full h-screen bg-secondary-0 pb-8 px-2"
      space="md"
      style={{ paddingTop: insets.top }}
    >
      <Box className="absolute top-0 -left-64 w-[30rem] h-[45rem]">
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient
              id="glow"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#00033D" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#00067A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#glow)" />
        </Svg>
      </Box>
      <HStack className="w-full items-center justify-center">
        <Button
          action="default"
          variant="outline"
          onPress={handleGoBack}
          className="absolute left-0"
          size="xl"
        >
          <ButtonIcon as={ArrowLeftIcon} size="2xl" />
        </Button>
        <Heading size="xl" className="line-clamp-2 text-start">
          Статистика
        </Heading>
      </HStack>
      <Card
        variant="half-rounded"
        className="w-full items-center justify-center gap-3.5 pb-8 mt-5"
      >
        <Heading className="w-full text-start text-typography-400" size="4xl">
          Вес
        </Heading>
        <LineChart
          data={displayData}
          labels={displayLabels}
          width={DEVICE_WIDTH * 0.9}
          height={DEVICE_HEIGHT * 0.3}
          fontYSize={13}
          formatYLabelBadge={(val) => `${val.toFixed(1)} кг`}
        />
      </Card>
    </VStack>
  );
}
