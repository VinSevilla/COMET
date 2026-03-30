import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PromptEntry = { prompt: string; answer: string };

type Profile = {
  name: string;
  age: number;
  gender: string;
  looking_for: string;
  dating_intent: string;
  interests: string[];
  prompts: PromptEntry[];
};

export default function Profile() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, age, gender, looking_for, dating_intent, interests, prompts")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <LinearGradient colors={["#164271", "#000000"]} style={styles.centered}>
        <ActivityIndicator color="#2A7DE1" size="large" />
      </LinearGradient>
    );
  }

  if (!profile) {
    return (
      <LinearGradient colors={["#164271", "#000000"]} style={styles.centered}>
        <Text style={styles.errorText}>Could not load profile.</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#164271", "#000000"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar placeholder */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {profile.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Name + age */}
        <Text style={styles.name}>
          {profile.name}, {profile.age}
        </Text>

        {/* Gender + looking for */}
        <View style={styles.tagRow}>
          {profile.gender ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{profile.gender}</Text>
            </View>
          ) : null}
          {profile.looking_for ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Looking for {profile.looking_for}</Text>
            </View>
          ) : null}
        </View>

        {/* Dating intent */}
        {profile.dating_intent ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Looking for</Text>
            <View style={styles.intentCard}>
              <Text style={styles.intentText}>{profile.dating_intent}</Text>
            </View>
          </View>
        ) : null}

        {/* Prompts */}
        {profile.prompts?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Prompts</Text>
            {profile.prompts.map((p, i) => (
              <View key={i} style={styles.promptCard}>
                <Text style={styles.promptQuestion}>{p.prompt}</Text>
                <Text style={styles.promptAnswer}>{p.answer}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Interests */}
        {profile.interests?.length > 0 ? (
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
        ) : null}

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => supabase.auth.signOut()}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
  },
  scroll: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#0d1f33",
    borderWidth: 2,
    borderColor: "#2A7DE1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 40,
    color: "#2A7DE1",
    fontFamily: "Montserrat-Bold",
  },
  name: {
    fontSize: 28,
    fontFamily: "Montserrat-Bold",
    color: "#fff",
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
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
    width: "100%",
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
  intentCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
  },
  intentText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
  },
  promptCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
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
  errorText: {
    color: "#888",
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
  },
  signOutButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e85d4a",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  signOutText: {
    color: "#e85d4a",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
  },
});
