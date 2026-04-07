import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
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

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert("Login failed", error.message);
    }
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
        <Text style={styles.title}>Welcome back!</Text>

        <TextInput
          style={[styles.input, focusedField === "email" && styles.inputFocused]}
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
            onPress={() => setShowPassword((v) => !v)}
          >
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={20}
              color="rgba(234,246,255,0.4)"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => router.push("/(auth)/forgot-password")}
        >
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>

        <Button
          variant="primary"
          label="Log In"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={{ marginBottom: 20 }}
        />

        <TouchableOpacity onPress={() => router.replace("/(auth)/signup")}>
          <Text style={styles.switchText}>
            Don't have an account?{" "}
            <Text style={styles.switchLink}>Create an Account</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.legalText}>
        By continuing, you agree to COMET's{" "}
        <Text style={styles.legalLink} onPress={() => router.push("/(auth)/terms")}>
          Terms of Service
        </Text>{" "}
        and acknowledge that you have read our{" "}
        <Text style={styles.legalLink} onPress={() => router.push("/(auth)/privacy")}>
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
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: "#2A7DE1",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
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
