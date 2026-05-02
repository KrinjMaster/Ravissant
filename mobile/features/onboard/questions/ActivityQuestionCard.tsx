import { QuestonCard } from "./QuestionCard";
import { Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

export const ActivityQuestionCard = () => {
  return (
    <QuestonCard>
      <Text style={styles.text}>Rate your activity</Text>
    </QuestonCard>
  );
};

const styles = StyleSheet.create({
  text: {
    color: colors.textPrimary,
  },
});
