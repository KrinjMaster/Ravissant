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
import { Sex } from "@/types/onboard";
import { useOnboard } from "@/hooks/useOnboard";

export const WeightQuestionCard = () => {
  const { userData, updateUserData } = useOnboard();

  return (
    <Card variant="elevated" className="h-full" size="lg">
      <Heading size="5xl" className="text-typography-200">
        ВЫБЕРИ СВОЙ
      </Heading>
      <Heading size="4xl" className="text-tertiary-500">
        вес
      </Heading>
      <FormControl></FormControl>
    </Card>
  );
};
