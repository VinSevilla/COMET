import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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

const STREAK_WIDTH = 2;
const STREAK_LENGTH = 200;
const BORDER_WIDTH = 2;
const PATH_STEPS = 120;

// Pre-computes evenly-spaced points along the pill border's center line.
// Returns parallel arrays for Animated.interpolate: inputs [0…1], and
// translateX/translateY offsets that place the streak element on the border.
function computePath(W: number, H: number) {
  const w = W - BORDER_WIDTH;
  const h = H - BORDER_WIDTH;
  const R = h / 2;
  const straight = w - 2 * R;
  const arc = Math.PI * R;
  const perimeter = 2 * straight + 2 * arc;

  const inputs: number[] = [];
  const xs: number[] = [];
  const ys: number[] = [];
  const rots: string[] = [];

  for (let i = 0; i <= PATH_STEPS; i++) {
    const t = i / PATH_STEPS;
    let d = t * perimeter;
    let x = 0;
    let y = 0;
    let tangentDeg = 0;

    if (d <= straight) {
      // Top edge: going right
      x = R + d;
      y = 0;
      tangentDeg = 0;
    } else {
      d -= straight;
      if (d <= arc) {
        // Right arc: a goes -π/2 → π/2, tangent 0° → 180°
        const a = -Math.PI / 2 + d / R;
        x = w - R + R * Math.cos(a);
        y = R + R * Math.sin(a);
        tangentDeg = (a + Math.PI / 2) * (180 / Math.PI);
      } else {
        d -= arc;
        if (d <= straight) {
          // Bottom edge: going left
          x = w - R - d;
          y = h;
          tangentDeg = 180;
        } else {
          d -= straight;
          // Left arc: a goes π/2 → 3π/2, tangent 180° → 360°
          const a = Math.PI / 2 + d / R;
          x = R + R * Math.cos(a);
          y = R + R * Math.sin(a);
          tangentDeg = 180 + (a - Math.PI / 2) * (180 / Math.PI);
        }
      }
    }

    inputs.push(t);
    xs.push(x - BORDER_WIDTH / 2 - STREAK_WIDTH / 2);
    ys.push(y - BORDER_WIDTH / 2 - STREAK_LENGTH / 2);
    // Streak element is portrait (tall), so subtract 90° to align with travel direction
    rots.push(`${tangentDeg - 90}deg`);
  }

  return { inputs, xs, ys, rots };
}

export default function Welcome() {
  const router = useRouter();

  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;
  const streakStarted = useRef(false);

  const [btnDims, setBtnDims] = useState({ width: 311, height: 52 });

  const pathPoints = useMemo(
    () => computePath(btnDims.width, btnDims.height),
    [btnDims],
  );

  const translateX = useMemo(
    () =>
      streakAnim.interpolate({
        inputRange: pathPoints.inputs,
        outputRange: pathPoints.xs,
        extrapolate: "clamp",
      }),
    [pathPoints],
  );

  const translateY = useMemo(
    () =>
      streakAnim.interpolate({
        inputRange: pathPoints.inputs,
        outputRange: pathPoints.ys,
        extrapolate: "clamp",
      }),
    [pathPoints],
  );

  const rotate = useMemo(
    () =>
      streakAnim.interpolate({
        inputRange: pathPoints.inputs,
        outputRange: pathPoints.rots,
        extrapolate: "clamp",
      }),
    [pathPoints],
  );

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

      <LinearGradient
        colors={["transparent", "rgba(10,20,35,0.5)", "rgba(10,20,35,0.95)"]}
        locations={[0, 0.4, 1]}
        style={styles.bottomGradient}
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
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setBtnDims({ width, height });
              if (!streakStarted.current) {
                streakStarted.current = true;
                Animated.loop(
                  Animated.timing(streakAnim, {
                    toValue: 1,
                    duration: 8000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                  }),
                ).start();
              }
            }}
          >
            <Animated.View
              style={[
                styles.streakDot,
                { transform: [{ translateX }, { translateY }, { rotate }] },
              ]}
            />
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
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
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
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFB347",
  },
  streakDot: {
    position: "absolute",
    top: 0,
    left: 0,
    width: STREAK_WIDTH,
    height: STREAK_LENGTH,
    borderRadius: STREAK_WIDTH,
    backgroundColor: "#FFCA64",
    shadowColor: "#FFB347",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
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
