import { supabase } from "@/lib/supabase";
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

export default function ForgotPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setSent(true);
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
        {sent ? (
          <View style={styles.successWrapper}>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We sent a password reset link to{"\n"}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.hintText}>
              Didn't receive it? Check your spam folder or try again.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setEmail("");
                setSent(false);
              }}
            >
              <Text style={styles.buttonText}>Try a different email</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.switchText}>
                Back to <Text style={styles.switchLink}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              Enter the email tied to your account and we'll send you a reset
              link.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.switchText}>
                Remember it?{" "}
                <Text style={styles.switchLink}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
  successWrapper: {
    gap: 12,
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
    marginBottom: 8,
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  emailHighlight: {
    color: "#fff",
    fontWeight: "600",
  },
  hintText: {
    color: "#555",
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2A7DE1",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
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
});
