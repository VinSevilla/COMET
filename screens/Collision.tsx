import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Match = {
  id: string;
  status: string;
  orbit_level: number;
  created_at: string;
  other_user: {
    id: string;
    name: string;
    age: number;
  };
};

const STATUS_LABEL: Record<string, string> = {
  collided: "New Collision",
  orbit: "In Orbit",
  committed: "Committed",
  drifted: "Drifted",
};

const STATUS_COLOR: Record<string, string> = {
  collided: "#FFB347",
  orbit: "#2A7DE1",
  committed: "#3FC6D5",
  drifted: "#444",
};

export default function Collision() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload matches every time this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) fetchMatches();
    }, [user])
  );

  async function fetchMatches() {
    setLoading(true);

    const { data, error } = await supabase
      .from("matches")
      .select("id, status, orbit_level, created_at, user1_id, user2_id")
      .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
      .neq("status", "drifted")
      .order("created_at", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    // For each match, fetch the other user's profile
    const enriched = await Promise.all(
      data.map(async (match) => {
        const otherId = match.user1_id === user!.id ? match.user2_id : match.user1_id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, name, age")
          .eq("id", otherId)
          .single();

        return {
          id: match.id,
          status: match.status,
          orbit_level: match.orbit_level,
          created_at: match.created_at,
          other_user: profile ?? { id: otherId, name: "Unknown", age: 0 },
        };
      })
    );

    setMatches(enriched);
    setLoading(false);
  }

  function openChat(match: Match) {
    router.push(`/chat/${match.id}`);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2A7DE1" />
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyTitle}>No collisions yet</Text>
        <Text style={styles.emptySubtitle}>
          Signal someone in Browse. If they signal back, a Collision occurs.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Orbits</Text>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.matchRow} onPress={() => openChat(item)}>
            {/* Avatar placeholder */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.other_user.name[0].toUpperCase()}
              </Text>
            </View>

            <View style={styles.matchInfo}>
              <Text style={styles.matchName}>
                {item.other_user.name}, {item.other_user.age}
              </Text>
              <Text style={[styles.matchStatus, { color: STATUS_COLOR[item.status] }]}>
                {STATUS_LABEL[item.status] ?? item.status}
              </Text>
            </View>

            {item.status === "orbit" && (
              <Text style={styles.orbitLevel}>Level {item.orbit_level}</Text>
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

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
    marginBottom: 20,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#2A7DE1",
    fontSize: 20,
    fontWeight: "bold",
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  matchStatus: {
    fontSize: 13,
  },
  orbitLevel: {
    color: "#2A7DE1",
    fontSize: 13,
  },
  separator: {
    height: 1,
    backgroundColor: "#111",
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
    lineHeight: 22,
  },
});
