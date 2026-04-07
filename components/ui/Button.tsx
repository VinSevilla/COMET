import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Glow, Palette, Spacing, Typography } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'cta';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({ label, onPress, variant = 'primary', style }: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      damping: 20,
      stiffness: 400,
      mass: 1,
    }).start();
  }

  function onPressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 180,
      mass: 1,
    }).start();
  }

  return (
    <Animated.View
      style={[
        styles.outer,
        glowForVariant(variant),
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[styles.base, variantContainerStyle(variant)]}
      >
        {variant === 'primary' && (
          <>
            {/* Base cosmic trail gradient */}
            <LinearGradient
              colors={['#1A3A6B', '#3CF6D5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Depth vignette overlay */}
            <LinearGradient
              colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.28)']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </>
        )}
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function glowForVariant(variant: ButtonVariant): ViewStyle {
  if (variant === 'primary') return Glow.teal;
  if (variant === 'cta') return Glow.orange;
  return {};
}

function variantContainerStyle(variant: ButtonVariant): ViewStyle {
  if (variant === 'primary') return styles.primary;
  if (variant === 'secondary') return styles.secondary;
  if (variant === 'cta') return styles.cta;
  return styles.primary;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outer: {
    borderRadius: 30,
  },
  base: {
    borderRadius: 30,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  primary: {
    backgroundColor: 'transparent',
  },
  secondary: {
    backgroundColor: Palette.glass,
    borderWidth: 1,
    borderColor: Palette.glassBorder,
  },
  cta: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Palette.cometOrange,
  },
  label: {
    ...Typography.button,
    zIndex: 1,
  },
});
