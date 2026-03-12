import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WelcomeColors } from "../constants/theme";

export default function Welcome() {
  const router = useRouter();

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo + text drifts up from cosmos and fades in
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 900,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0,
        duration: 900,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Buttons appear after content settles
    Animated.timing(buttonsFade, {
      toValue: 1,
      duration: 600,
      delay: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Continuous border rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/comet-bg1.jpg")}
        style={styles.background}
      />

      <Animated.View
        style={[
          styles.center,
          { opacity: contentFade, transform: [{ translateY: contentSlide }] },
        ]}
      >
        <Image
          source={require("../assets/images/CometLogo.png")}
          style={styles.logo}
        />
        <Text style={styles.cometText}>COMET</Text>
        <Text style={styles.tagline}>One Match at a Time</Text>
      </Animated.View>

      <SafeAreaView edges={["bottom"]}>
        <Animated.View style={[styles.buttons, { opacity: buttonsFade }]}>
          {/* Sign Up — rotating comet-orbit border */}
          <View style={styles.signupBorderContainer}>
            <Animated.View
              style={[styles.rotatingGradient, { transform: [{ rotate: spin }] }]}
            >
              <LinearGradient
                colors={["#FFB347", "transparent", "transparent", "#FFB347"]}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => router.push("/(auth)/signup")}
            >
              <Text style={styles.buttonText}>SIGN UP</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.buttonText}>LOG IN</Text>
          </TouchableOpacity>
        </Animated.View>
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
  cometText: {
    fontSize: 36,
    fontFamily: "TASAOrbiter-Bold",
    color: "#EAF6FF",
    letterSpacing: 6,
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
  signupBorderContainer: {
    borderRadius: 30,
    overflow: "hidden",
  },
  rotatingGradient: {
    position: "absolute",
    width: 600,
    height: 600,
    top: "50%",
    left: "50%",
    marginTop: -300,
    marginLeft: -300,
  },
  signupButton: {
    backgroundColor: "#0F2A44",
    paddingVertical: 16,
    margin: 2,
    borderRadius: 28,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "TASAOrbiter-SemiBold",
    color: WelcomeColors.buttonText,
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: WelcomeColors.loginBorder,
  },
});
