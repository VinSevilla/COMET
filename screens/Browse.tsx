import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Prompt = { prompt: string; answer: string };

type Profile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
  prompts: Prompt[];
  dating_intent: string;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Browse() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [signaling, setSignaling] = useState(false);

  useEffect(() => {
    if (user) fetchProfiles();
  }, [user]);

  async function fetchProfiles() {
    setLoading(true);

    // Fetch profiles excluding the current user and anyone already signaled
    const { data: alreadySignaled } = await supabase
      .from("signals")
      .select("swiped_id")
      .eq("swiper_id", user!.id);

    const excludeIds = [
      user!.id,
      ...(alreadySignaled?.map((s) => s.swiped_id) ?? []),
    ];

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, age, gender, interests, prompts, dating_intent")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("last_active", { ascending: false })
      .limit(20);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setProfiles(data ?? []);
    }

    setLoading(false);
  }

  async function sendSignal() {
    const current = profiles[currentIndex];
    if (!current || signaling) return;

    setSignaling(true);

    // Record the signal
    const { error, data: insertedSignal } = await supabase.from("signals").insert({
      swiper_id: user!.id,
      swiped_id: current.id,
      type: "like",
    }).select();

    if (error) {
      Alert.alert("Signal Error", `${error.message}\n\nCode: ${error.code}`);
      setSignaling(false);
      return;
    }

    if (!insertedSignal || insertedSignal.length === 0) {
      Alert.alert("Signal Error", "Insert succeeded but no row was returned. Possible RLS issue.");
      setSignaling(false);
      return;
    }

    // Check if the other person already signaled us (mutual = collision)
    const { data: mutual } = await supabase
      .from("signals")
      .select("id")
      .eq("swiper_id", current.id)
      .eq("swiped_id", user!.id)
      .eq("type", "like")
      .maybeSingle();

    if (mutual) {
      // Create the match
      await supabase.from("matches").insert({
        user1_id: user!.id,
        user2_id: current.id,
        status: "collided",
      });

      Alert.alert("Collision", `You and ${current.name} have collided.`);
    }

    setSignaling(false);
    advanceProfile();
  }

  function pass() {
    advanceProfile();
  }

  function advanceProfile() {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCurrentIndex(profiles.length); // signals end of stack
    }
  }

  // ─── States ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2A7DE1" />
      </View>
    );
  }

  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No more profiles</Text>
        <Text style={styles.emptySubtitle}>Check back later for new people.</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchProfiles}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profile = profiles[currentIndex];

  // ─── Profile Card ──────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Discover</Text>

      <ScrollView
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo placeholder */}
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>
            {profile.name[0].toUpperCase()}
          </Text>
        </View>

        {/* Name + age */}
        <Text style={styles.name}>
          {profile.name}, {profile.age}
        </Text>

        {/* Dating intent */}
        {profile.dating_intent && (
          <Text style={styles.intent}>{profile.dating_intent}</Text>
        )}

        {/* Prompts */}
        {profile.prompts?.length > 0 && (
          <View style={styles.section}>
            {profile.prompts.map((p, i) => (
              <View key={i} style={styles.promptCard}>
                <Text style={styles.promptLabel}>{p.prompt}</Text>
                <Text style={styles.promptAnswer}>{p.answer}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Interests</Text>
            <View style={styles.chipRow}>
              {profile.interests.map((interest) => (
                <View key={interest} style={styles.chip}>
                  <Text style={styles.chipText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.passButton} onPress={pass}>
          <Text style={styles.passText}>Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signalButton, signaling && styles.buttonDisabled]}
          onPress={sendSignal}
          disabled={signaling}
        >
          {signaling ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signalText}>Signal</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    borderRadius: 16,
  },
  cardContent: {
    paddingBottom: 24,
  },
  photoPlaceholder: {
    width: "100%",
    height: 320,
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    fontSize: 80,
    color: "#2A7DE1",
    fontWeight: "bold",
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  intent: {
    fontSize: 14,
    color: "#3FC6D5",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionLabel: {
    color: "#555",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  promptCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#2A7DE1",
  },
  promptLabel: {
    color: "#2A7DE1",
    fontSize: 12,
    marginBottom: 6,
  },
  promptAnswer: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: "#aaa",
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 16,
  },
  passButton: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  passText: {
    color: "#aaa",
    fontSize: 16,
    fontWeight: "bold",
  },
  signalButton: {
    flex: 2,
    backgroundColor: "#2A7DE1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  signalText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#555",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  refreshText: {
    color: "#2A7DE1",
    fontSize: 15,
  },
});
