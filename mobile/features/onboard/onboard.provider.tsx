import { ReactNode, useEffect, useState } from "react";
import { OnboardContext } from "./onboard.context";
import { getData, storeData } from "@/utils/storage";
import { NutritionPlan, UserData } from "@/types/onboard";

export const OnboardProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<Partial<UserData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await getData<UserData>("user_data");
      console.log("data", stored?.isOnboarded);
      if (stored) setUserData(stored);
      setIsLoading(false);
    };
    load();
  }, []);

  const completeOnboarding = async () => {
    await storeData("user_data", { ...userData, isOnboarded: true });
  };

  const updateUserData = (patch: Partial<UserData>) => {
    setUserData((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  const updateNutritionPlan = (patch: Partial<NutritionPlan>) => {
    setUserData((prev) => {
      if (!prev?.nutritionPlan) return prev;

      return {
        ...prev,
        nutritionPlan: {
          ...prev.nutritionPlan,
          ...patch,
        },
      };
    });
  };

  useEffect(() => console.log(userData), [userData]);

  return (
    <OnboardContext.Provider
      value={{
        userData,
        isLoading,
        isOnboarded: userData.isOnboarded ?? false,
        updateUserData,
        completeOnboarding,
        updateNutritionPlan,
      }}
    >
      {children}
    </OnboardContext.Provider>
  );
};
