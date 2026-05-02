import { View, StyleSheet, Dimensions } from "react-native";
import { spacing } from "@/constants/theme";
import { useMemo, useState } from "react";
import { PaginationDots } from "../../components/ui/PaginationDots";
import { NameQuestionCard } from "./questions/NameQuestionCard";
import { ActivityQuestionCard } from "./questions/ActivityQuestionCard";
import { GoalQuestionCard } from "./questions/GoalQuestionCard";
import { BioQuestionCard } from "./questions/BioQuestionCard";
import { Button } from "@/components/ui/Button";

const { width, height } = Dimensions.get("window");

export const OnboardCards = () => {
  const data = useMemo(
    () => [
      <NameQuestionCard key="1" />,
      <GoalQuestionCard key="2" />,
      <BioQuestionCard key="3" />,
      <ActivityQuestionCard key="4" />,
    ],
    [],
  );

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const goBack = () => setCurrentQuestion(currentQuestion - 1);
  const goNext = () => setCurrentQuestion(currentQuestion + 1);

  return (
    <View style={styles.container}>
      <PaginationDots
        length={4}
        current={currentQuestion}
        height={height * 0.03}
        width={width}
      />
      {data[currentQuestion]}
      <View style={styles.buttonContainer}>
        <Button
          title="Back"
          handlePress={() => goBack()}
          disabled={currentQuestion === 0}
        />
        <Button
          title="Next"
          handlePress={() => goNext()}
          disabled={currentQuestion === 3}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: 1,
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "red",
    paddingVertical: spacing.xxl,
  },
  buttonContainer: {
    width: width,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "red",
    paddingHorizontal: spacing.xl,
  },
});
