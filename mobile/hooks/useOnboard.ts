import { OnboardContext } from "@/features/onboard/onboard.context";
import { useContext } from "react";

export const useOnboard = () => {
  const ctx = useContext(OnboardContext);

  if (!ctx) {
    throw new Error("useOnboard must be used within OnboardProvider");
  }

  return ctx;
};
