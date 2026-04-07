import { Ionicons } from "@expo/vector-icons";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";

// ─── Welcome Screen ───────────────────────────────────────────────────────────

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;

  const videoPlayer = useVideoPlayer(
    require("../assets/video/2611250-uhd-3840-2160-30fps_6bgcJBFT.mp4"),
    (p) => {
      p.loop = true;
      p.muted = true;
      p.play();
    },
  );

  const [musicOn, setMusicOn] = useState(true);
  const player = useAudioPlayer(
    require("../assets/audio/743831__viramiller__tranquil-tones.mp3"),
  );

  // Fade audio in on mount
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: false });
    player.loop = true;
    player.volume = 0;
    player.play();
    const start = Date.now();
    const target = 0.3;
    const duration = 1000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) {
        player.volume = target;
        clearInterval(interval);
      } else {
        player.volume = (elapsed / duration) * target;
      }
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const toggleMusic = () => {
    if (musicOn) {
      player.pause();
    } else {
      player.loop = true;
      player.volume = 0.3;
      player.play();
    }
    setMusicOn((prev) => !prev);
  };

  // Entrance animations
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
      {/* Full-screen video background */}
      <VideoView
        player={videoPlayer}
        style={styles.background}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Top vignette — grounds the logo area */}
      <LinearGradient
        colors={["rgba(8,16,28,0.55)", "rgba(8,16,28,0)"]}
        locations={[0, 1]}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Bottom gradient — depth beneath buttons */}
      <LinearGradient
        colors={["rgba(8,16,28,0)", "rgba(8,16,28,0.88)", "rgba(8,16,28,1)"]}
        locations={[0, 0.42, 1]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Logo + tagline */}
      <Animated.View
        style={[
          styles.center,
          { opacity: contentFade, transform: [{ translateY: contentSlide }] },
        ]}
      >
        <Image
          source={require("../assets/images/cometlogo-1.png")}
          style={styles.logo}
        />
        <Text style={styles.cometText}>COMET</Text>
        <Text style={styles.tagline}>One Match at a Time</Text>
      </Animated.View>

      {/* Buttons */}
      <SafeAreaView edges={["bottom"]}>
        <Animated.View style={[styles.buttons, { opacity: buttonsFade }]}>
          <Button
            variant="primary"
            label="CREATE AN ACCOUNT"
            onPress={() => router.push("/(auth)/signup")}
          />
          <Button
            variant="secondary"
            label="LOG IN"
            onPress={() => router.push("/(auth)/login")}
          />
        </Animated.View>
      </SafeAreaView>

      {/* Music toggle */}
      <TouchableOpacity
        onPress={toggleMusic}
        style={[styles.musicButton, { top: insets.top + 8 }]}
      >
        <Ionicons
          name={musicOn ? "volume-high" : "volume-mute"}
          size={22}
          color={musicOn ? "#2A7DE1" : "rgba(255,255,255,0.4)"}
        />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "28%",
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
    fontFamily: "Montserrat-Regular",
    color: "#EAF6FF",
    marginTop: -2,
    letterSpacing: 1.2,
    opacity: 0.85,
  },
  buttons: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    gap: 12,
  },
  musicButton: {
    position: "absolute",
    right: 16,
    padding: 10,
  },
});
