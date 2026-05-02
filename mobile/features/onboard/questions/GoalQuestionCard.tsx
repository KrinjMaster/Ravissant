import { QuestonCard } from "./QuestionCard";
import { Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

export const GoalQuestionCard = () => {
  return (
    <QuestonCard>
      <Text style={styles.text}>What is your goal</Text>
    </QuestonCard>
  );
};

const styles = StyleSheet.create({
  text: {
    color: colors.textPrimary,
  },
});
