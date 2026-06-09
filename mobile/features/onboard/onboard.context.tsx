import { UserData } from "@/types/onboard";
import { createContext } from "react";

interface Props {
  userData: Partial<UserData>;
  isLoading: boolean;
  completeOnboarding: (data: UserData) => void;
  updateUserData: (patch: Partial<UserData>) => void;
  isOnboarded: boolean;
}

export const OnboardContext = createContext<Props | null>(null);
