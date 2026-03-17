import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export type PolicySection = {
  heading?: string;
  body: string;
};

type Props = {
  title: string;
  updated: string;
  sections: PolicySection[];
};

export default function PolicyScreen({ title, updated, sections }: Props) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#EAF6FF" />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.updated}>Last Updated: {updated}</Text>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            {s.heading ? (
              <Text style={styles.heading}>{s.heading}</Text>
            ) : null}
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1628",
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 4,
  },
  backLabel: {
    color: "#EAF6FF",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
  },
  title: {
    fontSize: 26,
    fontFamily: "Montserrat-Bold",
    color: "#EAF6FF",
    letterSpacing: 1,
    marginBottom: 4,
  },
  updated: {
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    color: "#6A8FAF",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "rgba(15,42,68,0.5)",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  heading: {
    fontSize: 15,
    fontFamily: "Montserrat-Bold",
    color: "#FFB347",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
    color: "#B8D4EE",
    lineHeight: 22,
  },
  bottomPad: {
    height: 40,
  },
});
