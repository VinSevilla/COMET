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
        <Text style={styles.name}>
          {profile.name}, {profile.age}
        </Text>

        <View style={styles.tagRow}>
          {profile.gender ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{profile.gender}</Text>
            </View>
          ) : null}
          {profile.dating_intent ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{profile.dating_intent}</Text>
            </View>
          ) : null}
        </View>

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
});
