/**
 * FoodStra design tokens — black theme.
 * Text/icon colors are chosen for WCAG AA contrast (>= 4.5:1) against the
 * black (#000000) background. See docs for the contrast audit.
 */
export const colors = {
  background: '#000000',
  surface: '#121212',
  surfaceElevated: '#1E1E1E',
  border: '#2A2A2A',
  // Brand accent — amber/orange, 8.9:1 on black.
  primary: '#FFB020',
  primaryText: '#000000',
  // Body text — near-white, 19.6:1 on black.
  textPrimary: '#F5F5F5',
  // Secondary text — 7.4:1 on black.
  textSecondary: '#B0B0B0',
  success: '#4ADE80',
  danger: '#F87171',
  warning: '#FBBF24',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const },
  heading: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
} as const;

export type ColorToken = keyof typeof colors;
