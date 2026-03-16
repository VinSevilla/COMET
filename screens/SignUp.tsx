import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignUp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + 8 }]}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 18 }}>Sign Up screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    left: 16,
    padding: 10,
  },
  backArrow: {
    fontSize: 24,
    color: "#FFFFFF",
  },
});
