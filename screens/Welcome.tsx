import { Canvas, Path, Skia } from "@shopify/react-native-skia";
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

const BORDER_WIDTH = 2;
const STREAK_DURATION = 8000;
const STREAK_FRAC = 0.29; // ~200px out of ~681px perimeter

function getPillGeometry(W: number, H: number) {
  const outerR = Math.min(30, H / 2);
  const r = outerR - BORDER_WIDTH / 2;
  const bw = BORDER_WIDTH / 2;
  const iw = W - BORDER_WIDTH;
  const ih = H - BORDER_WIDTH;
  return { r, bw, iw, ih };
}

// Extracted so only this subtree re-renders at 60fps — Welcome stays still.
function PillStreak({ width, height }: { width: number; height: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    let raf: ReturnType<typeof requestAnimationFrame>;
    const tick = () => {
      setProgress(
        ((Date.now() - startTime) % STREAK_DURATION) / STREAK_DURATION,
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { r, bw, iw, ih } = useMemo(
    () => getPillGeometry(width, height),
    [width, height],
  );

  const pillPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addRRect(Skia.RRectXY(Skia.XYWHRect(bw, bw, iw, ih), r, r));
    return path;
  }, [bw, iw, ih, r]);

  const end = progress;
  const start = (((end - STREAK_FRAC) % 1) + 1) % 1;
  const props = {
    path: pillPath,
    style: "stroke" as const,
    strokeWidth: BORDER_WIDTH,
    color: "rgba(255,202,100,1.0)",
  };

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {start < end ? (
        <Path {...props} start={start} end={end} />
      ) : (
        <>
          <Path {...props} start={start} end={1} />
          <Path {...props} start={0} end={end} />
        </>
      )}
    </Canvas>
  );
}

export default function Welcome() {
  const router = useRouter();

  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;

  const [btnDims, setBtnDims] = useState({ width: 311, height: 52 });

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
        colors={["rgba(10,20,35,0)", "rgba(10,20,35,0.85)", "rgba(10,20,35,1)"]}
        locations={[0, 0.5, 1]}
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
          <View>
            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => router.push("/(auth)/signup")}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setBtnDims({ width, height });
              }}
            >
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0.50)",
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0.40)",
                ]}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0.30)",
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0.30)",
                ]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <LinearGradient
                colors={[
                  "rgba(180,80,0,0.15)",
                  "rgba(180,80,0,0)",
                  "rgba(180,80,0,0.15)",
                ]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <Text style={styles.buttonText}>SIGN UP</Text>
            </TouchableOpacity>
            <PillStreak width={btnDims.width} height={btnDims.height} />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/(auth)/login")}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.40)", "rgba(0,0,0,0)", "rgba(0,0,0,0.40)"]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
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
    height: "75%",
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
    backgroundColor: "#0B1E3D",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: BORDER_WIDTH,
    borderColor: "#FFB347",
    overflow: "hidden",
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
    overflow: "hidden",
  },
});
