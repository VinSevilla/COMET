import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WelcomeColors } from "../constants/theme";

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/space.jpg")}
        style={styles.background}
      />

      <View style={styles.center}>
        <Image
          source={require("../assets/images/CometBlack.png")}
          style={styles.logo}
        />
        <Text style={styles.tagline}>One match at a time</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
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
    color: "white",
    marginTop: 12,
  },
  buttons: {
    paddingHorizontal: 32,
    paddingBottom: 60,
    gap: 12,
  },
  signupButton: {
    backgroundColor: WelcomeColors.signupButton,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    borderColor: WelcomeColors.signupBorder,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  loginButton: {
    backgroundColor: WelcomeColors.loginButton,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "white",
  },
});
