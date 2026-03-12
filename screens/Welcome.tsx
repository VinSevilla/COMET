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

export default function Welcome() {
  const router = useRouter();

  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    Animated.timing(buttonsFade, {
      toValue: 1,
      duration: 600,
      delay: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

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
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => router.push("/(auth)/signup")}
          >
            <Text style={styles.buttonText}>SIGN UP</Text>
          </TouchableOpacity>

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
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 110,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  cometText: {
    fontSize: 36,
    fontFamily: "Montserrat-Bold",
    color: "#EAF6FF",
    letterSpacing: 6,
    lineHeight: 40,
  },
  tagline: {
    fontSize: 16,
    color: "#EAF6FF",
    marginTop: -2,
    letterSpacing: 1,
    opacity: 0.85,
  },
  buttons: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    gap: 12,
  },
  signupButton: {
    backgroundColor: "#0F2A44",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFB347",
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
    color: "#FFFFFF",
  },
  loginButton: {
    backgroundColor: "#2A7DE1",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
});
