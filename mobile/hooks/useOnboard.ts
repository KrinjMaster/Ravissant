import { useState } from "react";
import { getData } from "@/utils/storage";

export const useOnboard = (): boolean => {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(
    getData("isOnboarded") ? getData("isOnboarded") : false,
  );

  return isOnboarded;
};
