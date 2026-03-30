import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_HEIGHT = 480;

type PromptEntry = { prompt: string; answer: string };

type Profile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  dating_intent: string;
  interests: string[];
  prompts: PromptEntry[];
  photos: string[];
};

function PhotoSwiper({ photos, name }: { photos: string[]; name: string }) {
  const [photoIndex, setPhotoIndex] = useState(0);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setPhotoIndex(page);
  }

  if (!photos || photos.length === 0) {
    return (
      <View style={styles.photoPlaceholder}>
        <Text style={styles.photoInitial}>{name?.charAt(0).toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <View style={styles.swiperContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={styles.photoScroll}
      >
        {photos.map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.photo} />
        ))}
      </ScrollView>

      {/* Dot indicators */}
      {photos.length > 1 && (
        <View style={styles.dotsRow}>
          {photos.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === photoIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function Explore() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id, name, age, gender, dating_intent, interests, prompts, photos")
      .neq("id", user.id)
      .then(({ data }) => {
        setProfiles(data ?? []);
        setLoading(false);
      });
  }, [user]);

  async function handleSignal() {
    if (!user || actioning) return;
    const target = profiles[index];
    setActioning(true);
    await supabase.from("signals").insert({
      from_user_id: user.id,
      to_user_id: target.id,
    });
    setActioning(false);
    advance();
  }

  function handlePass() {
    advance();
  }

  function advance() {
    setIndex((i) => i + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  if (loading) {
    return (
      <LinearGradient colors={["#164271", "#000000"]} style={styles.centered}>
        <ActivityIndicator color="#2A7DE1" size="large" />
      </LinearGradient>
    );
  }

  const current = profiles[index];

  if (!current) {
    return (
      <LinearGradient colors={["#164271", "#000000"]} style={styles.centered}>
        <Text style={styles.emptyTitle}>You've seen everyone</Text>
        <Text style={styles.emptySubtitle}>
          Check back later for new people.
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#164271", "#000000"]} style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Photos */}
        <PhotoSwiper photos={current.photos} name={current.name} />

        {/* Profile info */}
        <View style={styles.info}>
          {/* Name + age */}
          <Text style={styles.name}>
            {current.name}, {current.age}
          </Text>

          {/* Gender + dating intent tags */}
          <View style={styles.tagRow}>
            {current.gender ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{current.gender}</Text>
              </View>
            ) : null}
            {current.dating_intent ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{current.dating_intent}</Text>
              </View>
            ) : null}
          </View>

          {/* Prompts */}
          {current.prompts?.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Prompts</Text>
              {current.prompts.map((p, i) => (
                <View key={i} style={styles.promptCard}>
                  <Text style={styles.promptQuestion}>{p.prompt}</Text>
                  <Text style={styles.promptAnswer}>{p.answer}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Interests */}
          {current.interests?.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Interests</Text>
              <View style={styles.chipRow}>
                {current.interests.map((interest) => (
                  <View key={interest} style={styles.chip}>
                    <Text style={styles.chipText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Fixed action buttons */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.passButton} onPress={handlePass}>
          <Text style={styles.passText}>Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signalButton, actioning && styles.buttonDisabled]}
          onPress={handleSignal}
          disabled={actioning}
        >
          {actioning ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.signalText}>Signal ✦</Text>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  // Photo swiper
  swiperContainer: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photoScroll: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    resizeMode: "cover",
  },
  photoPlaceholder: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    backgroundColor: "#0d1f33",
    alignItems: "center",
    justifyContent: "center",
  },
  photoInitial: {
    fontSize: 80,
    color: "#2A7DE1",
    fontFamily: "Montserrat-Bold",
  },
  dotsRow: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 18,
    borderRadius: 3,
  },

  // Profile info
  info: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  name: {
    fontSize: 30,
    fontFamily: "Montserrat-Bold",
    color: "#fff",
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: "#0d1f33",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#2A7DE1",
  },
  tagText: {
    color: "#2A7DE1",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: "#555",
    fontSize: 11,
    fontFamily: "Montserrat-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  promptCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  promptQuestion: {
    color: "#2A7DE1",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    marginBottom: 6,
  },
  promptAnswer: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#0d1f33",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2A7DE1",
  },
  chipText: {
    color: "#2A7DE1",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
  },

  // Actions
  actions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  passButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  passText: {
    color: "#888",
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
  },
  signalButton: {
    flex: 2,
    backgroundColor: "#2A7DE1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  signalText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Montserrat-Bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#555",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
    textAlign: "center",
  },
});
