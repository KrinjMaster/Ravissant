import { NutritionPlan, UserData } from "@/types/onboard";
import { createContext } from "react";

interface Props {
  userData: Partial<UserData>;
  isLoading: boolean;
  completeOnboarding: (data: Partial<UserData>) => void;
  updateUserData: (patch: Partial<UserData>) => void;
  updateNutritionPlan: (patch: Partial<NutritionPlan>) => void;
  isOnboarded: boolean;
}

export const OnboardContext = createContext<Props | null>(null);
