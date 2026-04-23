import { UserData } from "@/types/auth";
import { ReactElement, ReactNode, useState } from "react";
import { AuthContext } from "@/features/auth/auth.context";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<UserData | null>(null);

  return (
    <AuthContext.Provider value={userData}>{children}</AuthContext.Provider>
  );
};
