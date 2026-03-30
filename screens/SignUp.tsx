import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignUp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSignUp() {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert("Sign up failed", error.message);
      return;
    }

    // Account created — send them to onboarding to build their profile
    router.replace("/(auth)/onboarding");
  }

  return (
    <LinearGradient
      colors={["#164271", "#000000"]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.formWrapper}>
        <Text style={styles.title}>Welcome to COMET!</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={20}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Confirm password"
            placeholderTextColor="#888"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword((v) => !v)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye" : "eye-off"}
              size={20}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.40)", "rgba(0,0,0,0)", "rgba(0,0,0,0.40)"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create an Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.switchText}>
            Already have an account?{" "}
            <Text style={styles.switchLink}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.legalText}>
        By continuing, you agree to COMET's{" "}
        <Text
          style={styles.legalLink}
          onPress={() => router.push("/(auth)/terms")}
        >
          Terms of Service
        </Text>{" "}
        and acknowledge that you have read our{" "}
        <Text
          style={styles.legalLink}
          onPress={() => router.push("/(auth)/privacy")}
        >
          Privacy Policy
        </Text>{" "}
        to learn how we collect and use your data.
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  formWrapper: {
    marginTop: -300,
  },
  backButton: {
    position: "absolute",
    top: 45,
    left: 16,
    padding: 10,
  },
  backArrow: {
    fontSize: 24,
    color: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    marginBottom: 16,
  },
  inputWithIcon: {
    flex: 1,
    padding: 14,
    color: "#fff",
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  button: {
    backgroundColor: "#2A7DE1",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  switchText: {
    color: "#888",
    textAlign: "center",
    fontSize: 14,
  },
  switchLink: {
    color: "#2A7DE1",
    fontWeight: "bold",
  },
  legalText: {
    position: "absolute",
    bottom: 32,
    left: 24,
    right: 24,
    color: "#555",
    textAlign: "center",
    fontSize: 10,
    lineHeight: 14,
  },
  legalLink: {
    color: "#2A7DE1",
  },
});
