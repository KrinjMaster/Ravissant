import { VStack } from "@/components/ui/vstack";
import { CircleIcon } from "@/components/ui/icon";
import { Heading } from "@/components/ui/heading";
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
} from "@/components/ui/radio";
import { FormControl } from "@/components/ui/form-control";
import { Card } from "@/components/ui/card";
import { Goal } from "@/types/onboard";
import { useOnboard } from "@/hooks/useOnboard";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { goals } from "@/constants/onboard";

export const GoalQuestionCard = () => {
  const { userData, updateUserData } = useOnboard();

  return (
    <Card variant="elevated" className="h-full" size="lg">
      <Heading size="5xl" className="text-typography-200">
        ВЫБЕРИ СВОЮ
      </Heading>
      <Heading size="4xl" className="text-tertiary-500">
        цель
      </Heading>
      <FormControl>
        <RadioGroup
          className="mt-[15%]"
          value={userData.goal ?? "aboba"}
          onChange={(value: string) =>
            updateUserData({
              goal: value as Goal,
            })
          }
        >
          <VStack space="xl">
            {goals.map(({ value, title, description }) => (
              <Box key={title}>
                <Radio value={value} size="2xl" className="justify-between">
                  <RadioLabel>{title}</RadioLabel>
                  <RadioIndicator>
                    <RadioIcon as={CircleIcon} />
                  </RadioIndicator>
                </Radio>
                <Text size="sm" className="text-typography-300 w-[90%]">
                  {description}
                </Text>
              </Box>
            ))}
          </VStack>
        </RadioGroup>
      </FormControl>
    </Card>
  );
};
