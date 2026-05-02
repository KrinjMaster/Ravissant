import { UserData } from "@/types/onboard";
import { createContext } from "react";

export const OnboardContext = createContext<UserData | null>(null);
