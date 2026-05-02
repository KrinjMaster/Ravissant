import { ReactNode, useEffect, useState } from "react";
import { OnboardContext } from "./onboard.context";
import { getData, setData } from "@/utils/storage";
import { UserData } from "@/types/onboard";

export const OnboardProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await getData("userData");
      if (stored) setUserData(stored);
      setIsLoading(false);
    };
    load();
  }, []);

  const completeOnboarding = async (data: UserData) => {
    setUserData(data);
    await setData("userData", data);
  };

  return (
    <OnboardContext.Provider
      value={{ userData, isLoading, completeOnboarding }}
    >
      {children}
    </OnboardContext.Provider>
  );
};
