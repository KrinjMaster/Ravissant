import { ReactNode, useEffect, useState } from "react";
import { OnboardContext } from "./onboard.context";
import { getData, storeData } from "@/utils/storage";
import { UserData } from "@/types/onboard";

export const OnboardProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<Partial<UserData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await getData<UserData>("userData");
      if (stored) setUserData(stored);
      setIsLoading(false);
    };
    load();
  }, []);

  const completeOnboarding = async (data: UserData) => {
    setUserData(data);
    await storeData("userData", data);
  };

  const updateUserData = (patch: Partial<UserData>) => {
    setUserData((prev) => ({
      ...prev,
      ...patch,
    }));
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
      }}
    >
      {children}
    </OnboardContext.Provider>
  );
};
