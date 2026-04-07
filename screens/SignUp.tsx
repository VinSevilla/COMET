import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";

export default function SignUp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const [focusedField, setFocusedField] = useState<
    "email" | "password" | "confirm" | null
  >(null);

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
          style={[
            styles.input,
            focusedField === "email" && styles.inputFocused,
          ]}
          placeholder="Email"
          placeholderTextColor="rgba(234,246,255,0.35)"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField(null)}
        />

        <View
          style={[
            styles.inputWrapper,
            focusedField === "password" && styles.inputFocused,
          ]}
        >
          <TextInput
            ref={passwordRef}
            style={styles.inputWithIcon}
            placeholder="Password"
            placeholderTextColor="rgba(234,246,255,0.35)"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => { setShowPassword((v) => !v); passwordRef.current?.focus(); }}
          >
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={20}
              color="rgba(234,246,255,0.4)"
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.inputWrapper,
            focusedField === "confirm" && styles.inputFocused,
          ]}
        >
          <TextInput
            ref={confirmPasswordRef}
            style={styles.inputWithIcon}
            placeholder="Confirm password"
            placeholderTextColor="rgba(234,246,255,0.35)"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() => setFocusedField("confirm")}
            onBlur={() => setFocusedField(null)}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => { setShowConfirmPassword((v) => !v); confirmPasswordRef.current?.focus(); }}
          >
            <Ionicons
              name={showConfirmPassword ? "eye" : "eye-off"}
              size={20}
              color="rgba(234,246,255,0.4)"
            />
          </TouchableOpacity>
        </View>

        <Button
          variant="primary"
          label="Create an Account"
          onPress={handleSignUp}
          loading={loading}
          disabled={loading}
          style={{ marginBottom: 20 }}
        />

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
    fontFamily: "Montserrat-Regular",
  },
  title: {
    fontSize: 28,
    fontFamily: "Montserrat-Bold",
    color: "#EAF6FF",
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "rgba(15,42,68,0.5)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 14,
    color: "#EAF6FF",
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,42,68,0.5)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: "rgba(42,125,225,0.5)",
    shadowColor: "#2A7DE1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWithIcon: {
    flex: 1,
    padding: 14,
    color: "#EAF6FF",
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  switchText: {
    color: "#6A8FAF",
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
  },
  switchLink: {
    color: "#2A7DE1",
    fontFamily: "Montserrat-Bold",
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
    fontFamily: "Montserrat-Regular",
  },
  legalLink: {
    color: "#2A7DE1",
  },
});
