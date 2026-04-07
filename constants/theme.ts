/**
 * COMET Design System — tokens, typography, spacing, and glow presets.
 * Import from here instead of hardcoding values in components.
 */

import { Platform, TextStyle, ViewStyle } from 'react-native';

// ─── Palette ─────────────────────────────────────────────────────────────────

export const Palette = {
  deepSpaceBlue: '#0F2A44',
  electricBlue: '#2A7DE1',
  cosmicTeal: '#3CF6D5',
  cometOrange: '#FFB347',
  navyDark: '#1A3A6B',
  textPrimary: '#EAF6FF',
  textSecondary: '#6A8FAF',
  glass: 'rgba(15,42,68,0.6)',
  glassBorder: 'rgba(255,255,255,0.1)',
};

// ─── Typography ──────────────────────────────────────────────────────────────

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontSize: 32,
    fontFamily: 'Montserrat-Bold',
    letterSpacing: 1.5,
    color: Palette.textPrimary,
  },
  h2: {
    fontSize: 26,
    fontFamily: 'Montserrat-Bold',
    letterSpacing: 1,
    color: Palette.textPrimary,
  },
  button: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    letterSpacing: 1.2,
    color: Palette.textPrimary,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Montserrat-Regular',
    color: Palette.textPrimary,
  },
  caption: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: Palette.textSecondary,
  },
};

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

// ─── Glow Presets ────────────────────────────────────────────────────────────

export const Glow: Record<'blue' | 'teal' | 'orange', ViewStyle> = {
  blue: {
    shadowColor: '#2A7DE1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  teal: {
    shadowColor: '#3CF6D5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  orange: {
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
};

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
