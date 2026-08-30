import { createContext } from "react";

export type FeedbackType = "success" | "error" | "info";

export type Feedback = {
  type: FeedbackType;
  message: string;
};

export const FeedbackContext = createContext<{
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
} | null>(null);
