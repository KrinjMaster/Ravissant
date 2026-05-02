export const colors = {
  // BACKGROUND
  bgPrimary: "#141414",
  bgSecondary: "#1C1C1C",

  // ACCENT
  accentPrimary: "#333DFF", // darkish purple,
  accentSecondary: "#5C64FF", // more softer purple
  accentOther: "#CDF7F6", // frozen white

  // TEXT
  textPrimary: "#FFFFFF",
  textDisabled: "#000ACC",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  display: 42,
} as const;

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};
