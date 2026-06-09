import { useEffect, useState } from "react";
import { getData } from "@/utils/storage";
import { UserData } from "@/types/onboard";

export const useOnboard = (): {
  isOnboarded: boolean;
  isLoading: boolean;
  updateUserData: (patch: Partial<UserData>) => void;
  onboardingData: UserData;
  loadOnboardState: () => void;
} => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [onboardingData, setOnboardingData] = useState<UserData>({
    goal: "lose",
    sex: "male",
    age: -1,
    heightCm: -1,
    weightKg: -1,
    activityLevel: "moderate",
    dailyCalorieTarget: -1,
    manualOverride: false,
  });

  const updateUserData = (patch: Partial<UserData>) => {
    setOnboardingData((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  const loadOnboardState = async () => {
    try {
      const stored = await getData<boolean>("isOnboarded");

      setIsOnboarded(stored ?? false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => console.log(onboardingData.sex), [onboardingData.sex]);

  return {
    isOnboarded,
    isLoading,
    updateUserData,
    onboardingData,
    loadOnboardState,
  };
};
