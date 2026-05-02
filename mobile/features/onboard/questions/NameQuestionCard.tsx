import { QuestonCard } from "./QuestionCard";
import { Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

export const NameQuestionCard = () => {
  return (
    <QuestonCard>
      <Text style={styles.text}>What is yout name</Text>
    </QuestonCard>
  );
};

const styles = StyleSheet.create({
  text: {
    color: colors.textPrimary,
  },
});
