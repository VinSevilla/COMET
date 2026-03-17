import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type MatchInfo = {
  id: string;
  status: string;
  orbit_level: number;
  other_user: { id: string; name: string };
};

export default function Chat() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (matchId && user) {
      loadMatch();
      loadMessages();
      subscribeToMessages();
    }
  }, [matchId, user]);

  async function loadMatch() {
    const { data } = await supabase
      .from("matches")
      .select("id, status, orbit_level, user1_id, user2_id")
      .eq("id", matchId)
      .single();

    if (!data) return;

    const otherId = data.user1_id === user!.id ? data.user2_id : data.user1_id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("id", otherId)
      .single();

    setMatchInfo({
      id: data.id,
      status: data.status,
      orbit_level: data.orbit_level,
      other_user: profile ?? { id: otherId, name: "Unknown" },
    });

    // Move match to orbit status when chat is first opened
    if (data.status === "collided") {
      await supabase
        .from("matches")
        .update({ status: "orbit", orbit_started_at: new Date().toISOString() })
        .eq("id", matchId);

      await supabase.from("orbit_events").insert({
        match_id: matchId,
        event_type: "entered",
        triggered_by: user!.id,
      });

      setMatchInfo((prev) => prev ? { ...prev, status: "orbit" } : prev);
    }
  }

  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    setMessages(data ?? []);
    setLoading(false);
  }

  function subscribeToMessages() {
    // Real-time listener — new messages appear instantly without refreshing
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          listRef.current?.scrollToEnd({ animated: true });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  async function sendMessage() {
    if (!text.trim() || sending) return;

    setSending(true);
    const content = text.trim();
    setText("");

    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: user!.id,
      content,
    });

    if (error) {
      Alert.alert("Error", error.message);
      setText(content); // restore text if failed
    }

    setSending(false);
  }

  async function drift() {
    Alert.alert(
      "Drift from orbit?",
      `You and ${matchInfo?.other_user.name} will return to discovery.`,
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Drift",
          style: "destructive",
          onPress: async () => {
            await supabase
              .from("matches")
              .update({ status: "drifted" })
              .eq("id", matchId);

            await supabase.from("orbit_events").insert({
              match_id: matchId,
              event_type: "drifted",
              triggered_by: user!.id,
            });

            router.back();
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2A7DE1" />
      </View>
    );
  }

  if (matchInfo?.status === "drifted") {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
          This orbit has ended
        </Text>
        <Text style={{ color: "#555", fontSize: 14, marginBottom: 24 }}>
          You and {matchInfo.other_user.name} have drifted.
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#2A7DE1", fontSize: 15 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{matchInfo?.other_user.name}</Text>
          <Text style={styles.headerStatus}>
            {matchInfo?.status === "orbit"
              ? `Orbit · Level ${matchInfo.orbit_level}`
              : "Collision"}
          </Text>
        </View>

        <TouchableOpacity onPress={drift} style={styles.driftButton}>
          <Text style={styles.driftText}>Drift</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const isMe = item.sender_id === user!.id;
          return (
            <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
              <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
                {item.content}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              You and {matchInfo?.other_user.name} have entered orbit.
            </Text>
            <Text style={styles.emptyChatSubtext}>Say something.</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor="#555"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!text.trim() || sending) && styles.sendDisabled]}
          onPress={sendMessage}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backArrow: {
    color: "#fff",
    fontSize: 22,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  headerStatus: {
    color: "#2A7DE1",
    fontSize: 12,
    marginTop: 2,
  },
  driftButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  driftText: {
    color: "#888",
    fontSize: 13,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  myBubble: {
    backgroundColor: "#2A7DE1",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: "#1a1a1a",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  myText: {
    color: "#fff",
  },
  theirText: {
    color: "#fff",
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyChatText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyChatSubtext: {
    color: "#555",
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#111",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A7DE1",
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.3,
  },
  sendText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
