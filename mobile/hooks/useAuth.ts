import { useState } from "react";
import { getData } from "@/utils/storage";

export const useAuth = (): boolean => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    getData("isLoggedIn") ? getData("isLoggedIn") : false,
  );

  return false;
};
