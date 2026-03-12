import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WelcomeColors } from "../constants/theme";

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/comet-bg1.jpg")}
        style={styles.background}
      />

      <View style={styles.center}>
        <Image
          source={require("../assets/images/CometLogo.png")}
          style={styles.logo}
        />
        <Text style={styles.cometText}>COMET</Text>
        <Text style={styles.tagline}>One Match at a Time</Text>
      </View>

      <SafeAreaView edges={["bottom"]} style={styles.buttons}>
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  tagline: {
    fontSize: 18,
    color: "#EAF6FF",
    marginTop: 12,
    letterSpacing: 2,
    fontStyle: "italic",
    opacity: 0.85,
  },
  buttons: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    gap: 12,
  },
  signupButton: {
    backgroundColor: "#0F2A44",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: WelcomeColors.buttonText,
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: WelcomeColors.loginBorder,
  },
  cometText: {
    fontSize: 36,
    fontFamily: "TASAOrbiter-Bold",
    color: "#EAF6FF",
    letterSpacing: 6,
  },
});
