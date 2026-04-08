import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import ProfileCard, { ProfileData } from "@/components/ProfileCard";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Glow } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Explore() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id, name, age, gender, dating_intent, interests, prompts, photos, lifestyle, career")
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
        <ProfileCard profile={current} />
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.passButton} onPress={handlePass}>
          <Text style={styles.passText}>Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signalButton, actioning && styles.buttonDisabled]}
          onPress={handleSignal}
          disabled={actioning}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={["#2A7DE1", "#3CF6D5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
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
  actions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    backgroundColor: "rgba(8,16,28,0.85)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  passButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  passText: {
    color: "rgba(234,246,255,0.45)",
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
  },
  signalButton: {
    flex: 2,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    overflow: "hidden",
    ...Glow.teal,
  },
  signalText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
    letterSpacing: 0.5,
    zIndex: 1,
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
