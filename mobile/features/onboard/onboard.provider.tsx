import { ReactNode, useEffect, useState } from "react";
import { OnboardContext } from "./onboard.context";
import { getData, removeData, storeData } from "@/utils/storage";
import { NutritionPlan, UserData } from "@/types/onboard";

export const OnboardProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<Partial<UserData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await getData<UserData>("user_data");
      if (stored) setUserData(stored);
      console.log(stored);
      setIsLoading(false);
    };
    load();
  }, []);

  const completeOnboarding = async (data: Partial<UserData>) => {
    const newData = data || userData;

    await removeData("user_data");
    await storeData("user_data", { ...newData, isOnboarded: true });

    setUserData((prev) => ({ ...prev, ...newData, isOnboarded: true }));
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
