import { tva, isWeb } from "@gluestack-ui/utils/nativewind-utils";
const baseStyle = isWeb ? "flex flex-col relative z-0" : "";

export const cardStyle = tva({
  base: baseStyle,
  variants: {
    size: {
      sm: "p-3 rounded",
      md: "p-4 rounded-md",
      lg: "p-6 rounded-3xl",
    },
    variant: {
      elevated: "bg-secondary-50",
      outline: "border border-outline-200",
      ghost: "rounded-none",
      filled: "bg-background-50",
      "half-rounded":
        "bg-background-50 rounded-2xl border border-secondary-300",
    },
  },
});
