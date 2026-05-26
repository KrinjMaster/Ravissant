import { QuestionCard } from "./QuestionCard";
import { Text } from "react-native";

export const NameQuestionCard = () => {
  return (
    <QuestionCard>
      <Text className="text-typography-white">What is your name</Text>
    </QuestionCard>
  );
};
