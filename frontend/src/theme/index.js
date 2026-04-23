export const COLORS = {
  primary: "#E56B3F",
  primaryDark: "#B94824",
  secondary: "#69BFA0",
  background: "#0C1116",
  surface: "#141B23",
  surfaceHigh: "#1B2530",
  text: "#F7F3EE",
  textSecondary: "#AAB4BD",
  error: "#E8574C",
  success: "#4BB56F",
  warning: "#E2A64A",
  border: "rgba(255,255,255,0.1)",
  white: "#FFFFFF",
  black: "#080B0F",
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const SIZES = {
  radius: 14,
  fontTitle: 24,
  fontHeading: 20,
  fontBody: 16,
  fontSmall: 14,
};

export const TYPOGRAPHY = {
  title: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
    color: COLORS.text,
  },
  kicker: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: "#020406",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
};
