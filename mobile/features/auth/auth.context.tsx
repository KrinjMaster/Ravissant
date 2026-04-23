import { UserData } from "@/types/auth";
import { createContext } from "react";

export const AuthContext = createContext<UserData | null>(null);
