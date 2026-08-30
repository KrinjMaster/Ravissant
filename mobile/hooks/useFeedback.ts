import { FeedbackContext } from "@/features/general/feedback.context";
import { useContext } from "react";

export const useFeedback = () => {
  const ctx = useContext(FeedbackContext);

  if (!ctx) {
    throw new Error("FeedbackContext must be used within MealTemplateProvider");
  }

  return ctx;
};
