import { QuestonCard } from "./QuestionCard";
import { Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

export const BioQuestionCard = () => {
  return (
    <QuestonCard>
      <Text style={styles.text}>A little about yourself</Text>
    </QuestonCard>
  );
};

const styles = StyleSheet.create({
  text: {
    color: colors.textPrimary,
  },
});
