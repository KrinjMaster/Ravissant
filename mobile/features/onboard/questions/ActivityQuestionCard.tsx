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
import { ActivityLevel } from "@/types/onboard";
import { useOnboard } from "@/hooks/useOnboard";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { activityLevels } from "@/constants/onboard";

export const ActivityQuestionCard = () => {
  const { userData, updateUserData } = useOnboard();

  return (
    <Card variant="elevated" className="h-full" size="lg">
      <Heading size="5xl" className="text-typography-200">
        ВЫБЕРИ{"\n"}СВОЙ
      </Heading>
      <Heading size="4xl" className="text-tertiary-500">
        уровень активности
      </Heading>
      <FormControl>
        <RadioGroup
          className="mt-[15%]"
          value={userData.activityLevel ?? "aboba"}
          onChange={(value: string) =>
            updateUserData({
              activityLevel: value as ActivityLevel,
            })
          }
        >
          <VStack space="4xl">
            {activityLevels.map(({ value, title, description }) => (
              <Box key={title}>
                <Radio value={value} size="2xl" className="justify-between">
                  <RadioLabel>{title}</RadioLabel>
                  <RadioIndicator>
                    <RadioIcon as={CircleIcon} />
                  </RadioIndicator>
                </Radio>
                <Text size="sm" className="text-typography-300 w-[85%]">
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
