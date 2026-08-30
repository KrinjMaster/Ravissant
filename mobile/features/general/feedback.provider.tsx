import React, {
  createContext,
  PropsWithChildren,
  useRef,
  useState,
} from "react";
import { FeedbackChip, FeedbackType } from "./FeedbackChip";
import { View } from "react-native";
import { Feedback, FeedbackContext } from "./feedback.context";

export function FeedbackProvider({ children }: PropsWithChildren) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = (next: Feedback) => {
    setFeedback(next);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 1500);
  };

  return (
    <FeedbackContext.Provider
      value={{
        success: (message) => showFeedback({ type: "success", message }),
        error: (message) => showFeedback({ type: "error", message }),
        info: (message) => showFeedback({ type: "info", message }),
      }}
    >
      {children}

      {feedback && (
        <View pointerEvents="none" className="absolute inset-0 z-[9999]">
          <FeedbackChip type={feedback.type} message={feedback.message} />
        </View>
      )}
    </FeedbackContext.Provider>
  );
}
