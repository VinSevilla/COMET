import { supabase } from "@/lib/supabase";
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

export default function ForgotPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

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
            <Button
              variant="primary"
              label="Try a different email"
              onPress={() => {
                setEmail("");
                setSent(false);
              }}
            />
            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => router.replace("/(auth)/login")}
            >
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
              style={[styles.input, emailFocused && styles.inputFocused]}
              placeholder="Email"
              placeholderTextColor="rgba(234,246,255,0.35)"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />

            <Button
              variant="primary"
              label="Send Reset Link"
              onPress={handleReset}
              loading={loading}
              disabled={loading}
              style={{ marginBottom: 20 }}
            />

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
    fontFamily: "Montserrat-Regular",
  },
  title: {
    fontSize: 28,
    fontFamily: "Montserrat-Bold",
    color: "#EAF6FF",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#6A8FAF",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
    lineHeight: 20,
    marginBottom: 24,
  },
  emailHighlight: {
    color: "#EAF6FF",
    fontFamily: "Montserrat-Bold",
  },
  hintText: {
    color: "#555",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
    marginBottom: 8,
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
  inputFocused: {
    borderColor: "rgba(42,125,225,0.5)",
    shadowColor: "#2A7DE1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  backToLogin: {
    alignItems: "center",
    paddingVertical: 8,
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
});
