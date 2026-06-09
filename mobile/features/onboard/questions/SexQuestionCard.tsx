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
import { Sex, UserData } from "@/types/onboard";

export const SexQuestionCard = ({
  sex,
  updateSex,
}: {
  sex: string;
  updateSex: (patch: Partial<UserData>) => void;
}) => {
  return (
    <Card variant="elevated" className="h-full" size="lg">
      <Heading size="3xl" className="mt-[5%]">
        Выбери свой пол
      </Heading>
      <FormControl>
        <RadioGroup
          className="mt-[15%]"
          value={sex}
          onChange={(value: string) =>
            updateSex({
              sex: value as Sex,
            })
          }
        >
          <VStack space="xl">
            <Radio value="male" size="xl" className="justify-between">
              <RadioLabel>Мужчина</RadioLabel>
              <RadioIndicator>
                <RadioIcon as={CircleIcon} />
              </RadioIndicator>
            </Radio>
            <Radio value="female" size="xl" className="justify-between">
              <RadioLabel>Женщина</RadioLabel>
              <RadioIndicator>
                <RadioIcon as={CircleIcon} />
              </RadioIndicator>
            </Radio>
          </VStack>
        </RadioGroup>
      </FormControl>
    </Card>
  );
};
