export const COLORS = {
  primary: '#E85D2A',
  secondary: '#F28A45',
  background: '#FFFFFF',
  surface: '#F5F5F5', // Light Gray for surface
  text: '#121212', // Deep Black
  textSecondary: '#666666',
  error: '#E8574C',
  success: '#4BB56F',
  warning: '#F5A623',
  border: '#EEEEEE',
  white: '#FFFFFF',
  black: '#0B0D10',
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
  radius: 12,
  fontTitle: 24,
  fontHeading: 20,
  fontBody: 16,
  fontSmall: 14,
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
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
};
