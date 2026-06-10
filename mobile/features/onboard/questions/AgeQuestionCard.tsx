import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { useOnboard } from "@/hooks/useOnboard";
import { Dispatch, useEffect, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
} from "@/components/ui/form-control";
import { AlertCircleIcon } from "@/components/ui/icon";
import { getAge } from "@/utils/date";

export const AgeQuestionCard = () => {
  const { userData, updateUserData } = useOnboard();
  const [isInvalid, setIsInvalid] = useState(
    userData.birthday ? getAge(userData.birthday) < 18 : true,
  );
  const [date, setDate] = useState(userData.birthday ?? new Date(Date.now()));

  return (
    <Card variant="elevated" className="h-full" size="lg">
      <Heading size="5xl" className="text-typography-200">
        ВЫБЕРИ СВОЙ
      </Heading>
      <Heading size="4xl" className="text-tertiary-500">
        возраст
      </Heading>
      <FormControl className="mt-[15%]" isInvalid={isInvalid}>
        <DateTimePicker
          testID="1"
          value={date}
          mode="date"
          is24Hour={true}
          onValueChange={(_, selectedDate) => {
            setDate(selectedDate);
            setIsInvalid(getAge(selectedDate) < 18);
            updateUserData({ birthday: selectedDate });
          }}
          display="spinner"
          locale="ru-RU"
        />
        <FormControlError className="gap-3.5">
          <FormControlErrorIcon as={AlertCircleIcon} />
          <FormControlErrorText>
            Тебе должно быть 18, чтобы продолжить
          </FormControlErrorText>
        </FormControlError>
      </FormControl>
    </Card>
  );
};
