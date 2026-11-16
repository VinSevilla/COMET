import { useColorScheme as useRNColorScheme } from 'react-native';

// React Native 0.83+ can return 'unspecified'; treat it like null so callers' `?? 'light'` fallback applies.
export function useColorScheme(): 'light' | 'dark' | null {
  const colorScheme = useRNColorScheme();
  return colorScheme === 'light' || colorScheme === 'dark' ? colorScheme : null;
}
