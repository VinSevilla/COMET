import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_HEIGHT = 480;

export type PromptEntry = { prompt: string; answer: string };

export type ProfileData = {
  id: string;
  name: string;
  age: number;
  gender: string;
  dating_intent: string;
  interests: string[];
  prompts: PromptEntry[];
  photos: string[];
  lifestyle?: { drink?: string; smoke?: string; workout?: string } | null;
  career?: { school?: string; work?: string } | null;
};

const DRINK_LABEL: Record<string, string> = {
  Frequently: "Drinks often",
  Socially: "Drinks socially",
  Never: "Doesn't drink",
};
const SMOKE_LABEL: Record<string, string> = {
  Frequently: "Smokes regularly",
  Socially: "Social smoker",
  Never: "Doesn't smoke",
};
const WORKOUT_LABEL: Record<string, string> = {
  Often: "Works out regularly",
  Sometimes: "Sometimes works out",
  Never: "Doesn't work out",
};
const SCHOOL_LABEL: Record<string, string> = {
  College: "In college",
  "Grad school": "In grad school",
  "Trade school": "In trade school",
};
const WORK_LABEL: Record<string, string> = {
  Unemployed: "Currently not working",
  "Self-employed": "Self-employed",
  "Part-Time": "Works part-time",
  "Full-Time": "Works full-time",
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

export default function ProfileCard({ profile }: { profile: ProfileData }) {
  return (
    <View>
      <PhotoSwiper photos={profile.photos} name={profile.name} />

      <View style={styles.info}>
        {/* Name + identity pills */}
        <View style={styles.identityBlock}>
          <Text style={styles.name}>
            {profile.name}
            {profile.age ? `, ${profile.age}` : ""}
          </Text>
          <View style={styles.pillRow}>
            {profile.gender ? (
              <View style={styles.identityPill}>
                <Text style={styles.identityPillText}>{profile.gender}</Text>
              </View>
            ) : null}
            {profile.dating_intent ? (
              <View style={styles.identityPill}>
                <Text style={styles.identityPillText}>{profile.dating_intent}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Prompts */}
        {profile.prompts?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Prompts</Text>
            {profile.prompts.map((p, i) => (
              <View
                key={i}
                style={{ marginBottom: i < profile.prompts.length - 1 ? 36 : 8 }}
              >
                <Text style={styles.promptQ} numberOfLines={1}>
                  {p.prompt}
                </Text>
                <Text style={styles.promptA} numberOfLines={3}>
                  {p.answer}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Interests */}
        {profile.interests?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Interests</Text>
            <View style={styles.pillRow}>
              {profile.interests.map((interest) => (
                <View key={interest} style={styles.pill}>
                  <Text style={styles.pillText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Lifestyle + Career */}
        {(() => {
          const l = profile.lifestyle;
          const c = profile.career;
          const phraseItems = [
            l?.drink && { icon: "glass-wine" as const, text: DRINK_LABEL[l.drink] },
            l?.smoke && { icon: "smoking" as const, text: SMOKE_LABEL[l.smoke] },
            l?.workout && { icon: "dumbbell" as const, text: WORKOUT_LABEL[l.workout] },
            c?.school && c.school !== "No" && { icon: "school" as const, text: SCHOOL_LABEL[c.school] },
            c?.work && { icon: "briefcase" as const, text: WORK_LABEL[c.work] },
          ].filter(Boolean) as { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }[];

          if (!phraseItems.length) return null;
          return (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Lifestyle</Text>
              {phraseItems.map((item, i) => (
                <View key={i} style={styles.phraseRow}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={14}
                    color="rgba(234,246,255,0.32)"
                  />
                  <Text style={styles.phraseText}>{item.text}</Text>
                </View>
              ))}
            </View>
          );
        })()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: "rgba(60,246,213,0.6)",
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
  info: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  identityBlock: {
    marginBottom: 36,
  },
  name: {
    fontSize: 30,
    fontFamily: "Montserrat-Bold",
    color: "#EAF6FF",
    marginBottom: 14,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  identityPill: {
    backgroundColor: "rgba(60,246,213,0.05)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(60,246,213,0.12)",
  },
  identityPillText: {
    color: "#CFE9FF",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    color: "rgba(234,246,255,0.28)",
    fontSize: 10,
    fontFamily: "Montserrat-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  promptQ: {
    color: "rgba(234,246,255,0.26)",
    fontSize: 11,
    fontFamily: "Montserrat-Regular",
    marginBottom: 10,
  },
  promptA: {
    color: "#EAF6FF",
    fontSize: 18,
    lineHeight: 26,
    fontFamily: "Montserrat-Regular",
  },
  pill: {
    backgroundColor: "rgba(60,246,213,0.03)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(60,246,213,0.09)",
  },
  pillText: {
    color: "#EAF6FF",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
  },
  phraseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 7,
  },
  phraseText: {
    color: "rgba(234,246,255,0.62)",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
  },
});
