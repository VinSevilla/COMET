import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import ProfileCard, { ProfileData } from "@/components/ProfileCard";
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

export default function Profile() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id, name, age, gender, dating_intent, interests, prompts, photos")
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <ProfileCard profile={profile} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={() => supabase.auth.signOut()}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
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
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: "#e85d4a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: {
    color: "#e85d4a",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
  },
  errorText: {
    color: "#888",
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
  },
});
