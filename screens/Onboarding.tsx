import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Slider } from "@miblanchard/react-native-slider";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Prompt Data ────────────────────────────────────────────────────────────

const PROMPT_CATEGORIES = [
  {
    category: "Personality / Fun",
    prompts: [
      "Two truths and a lie",
      "A random skill I have",
      "A hill I'll die on",
      "My most controversial opinion",
      "The weirdest thing about me",
      "Something I'll never get tired of",
    ],
  },
  {
    category: "Lifestyle",
    prompts: [
      "My perfect Sunday",
      "My ideal first date",
      "A place I want to travel",
      "My comfort food",
      "My go-to weekend plan",
      "The best trip I've taken",
    ],
  },
  {
    category: "Conversation Starters",
    prompts: [
      "Ask me about…",
      "The fastest way to my heart",
      "Something people are surprised about me",
      "My biggest green flag",
      "My biggest red flag",
      "Something I'm passionate about",
    ],
  },
  {
    category: "Values",
    prompts: [
      "What I value in a partner",
      "The kind of connection I'm looking for",
      "What makes a great conversation",
      "Something meaningful to me",
      "My love language is",
    ],
  },
  {
    category: "Light / Playful",
    prompts: [
      "I'm known for…",
      "My hidden talent",
      "My unpopular opinion",
      "A small thing that makes my day",
      "My guilty pleasure",
    ],
  },
];

// Flatten all prompts for "see more" view
const ALL_PROMPTS = PROMPT_CATEGORIES.flatMap((c) => c.prompts);

// Pick 6 random suggested prompts
function getSuggestedPrompts(): string[] {
  const shuffled = [...ALL_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
}

// ─── Interest Data ───────────────────────────────────────────────────────────

const INTEREST_CATEGORIES = [
  {
    category: "Social",
    interests: ["Coffee", "Brunch", "Traveling", "Fashion", "Foodie"],
  },
  {
    category: "Outdoors",
    interests: ["Hiking", "Camping", "Beach", "Road trips", "Nature"],
  },
  {
    category: "Fitness",
    interests: ["Gym", "Running", "Yoga", "Cycling", "Sports"],
  },
  {
    category: "Creative",
    interests: ["Art", "Writing", "Music", "Film", "Photography"],
  },
  {
    category: "Entertainment",
    interests: ["Gaming", "Movies", "TV shows", "Podcasts", "Anime"],
  },
  {
    category: "Intellectual",
    interests: ["Reading", "History", "Science", "Tech"],
  },
  {
    category: "Everyday",
    interests: ["Cooking", "Baking", "Gardening", "Board games"],
  },
];

// ─── Birthday Drum Picker ─────────────────────────────────────────────────────

const ITEM_HEIGHT = 52;
const PICKER_HEIGHT = ITEM_HEIGHT * 3;
const PICKER_PADDING = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const _CUR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 83 }, (_, i) => String(_CUR_YEAR - 18 - i));

function PickerColumn({
  items,
  selectedIdx,
  scrollRef,
  setter,
}: {
  items: string[];
  selectedIdx: number;
  scrollRef: { current: ScrollView | null };
  setter: (i: number) => void;
}) {
  function onScrollEnd(e: { nativeEvent: { contentOffset: { y: number } } }) {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    setter(Math.max(0, Math.min(idx, items.length - 1)));
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef as any}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        contentContainerStyle={{ paddingVertical: PICKER_PADDING }}
        style={{ height: PICKER_HEIGHT }}
      >
        {items.map((item, i) => (
          <View
            key={item}
            style={{
              height: ITEM_HEIGHT,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: i === selectedIdx ? "#EAF6FF" : "rgba(234,246,255,0.28)",
                fontSize: i === selectedIdx ? 20 : 16,
                fontFamily:
                  i === selectedIdx ? "Montserrat-Bold" : "Montserrat-Regular",
              }}
            >
              {item}
            </Text>
          </View>
        ))}
      </ScrollView>
      <LinearGradient
        colors={["#000000", "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: PICKER_PADDING,
        }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "#000000"]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: PICKER_PADDING,
        }}
        pointerEvents="none"
      />
    </View>
  );
}

function BirthdayPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const parts = value ? value.split("-") : [];
  const defaultYearIdx = Math.max(0, YEARS.indexOf(String(_CUR_YEAR - 26)));

  const [monthIdx, setMonthIdx] = useState(() =>
    parts[1] ? Math.max(0, parseInt(parts[1], 10) - 1) : 0,
  );
  const [dayIdx, setDayIdx] = useState(() =>
    parts[2] ? Math.max(0, parseInt(parts[2], 10) - 1) : 0,
  );
  const [yearIdx, setYearIdx] = useState(() => {
    if (!parts[0]) return defaultYearIdx;
    const idx = YEARS.indexOf(parts[0]);
    return idx >= 0 ? idx : defaultYearIdx;
  });

  const monthRef = useRef<ScrollView>(null);
  const dayRef = useRef<ScrollView>(null);
  const yearRef = useRef<ScrollView>(null);

  useEffect(() => {
    onChange(
      `${YEARS[yearIdx]}-${String(monthIdx + 1).padStart(2, "0")}-${DAYS[dayIdx]}`,
    );
  }, [monthIdx, dayIdx, yearIdx]);

  useEffect(() => {
    monthRef.current?.scrollTo({ y: monthIdx * ITEM_HEIGHT, animated: false });
    dayRef.current?.scrollTo({ y: dayIdx * ITEM_HEIGHT, animated: false });
    yearRef.current?.scrollTo({ y: yearIdx * ITEM_HEIGHT, animated: false });
  }, []);

  return (
    <View
      style={{
        backgroundColor: "#0d1a2d",
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(42,125,225,0.2)",
        marginTop: 8,
      }}
    >
      {/* Selection band */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: PICKER_PADDING,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: "rgba(42,125,225,0.5)",
          backgroundColor: "rgba(42,125,225,0.06)",
          zIndex: 1,
        }}
      />
      <View style={{ flexDirection: "row" }}>
        <PickerColumn
          items={MONTHS}
          selectedIdx={monthIdx}
          scrollRef={monthRef}
          setter={setMonthIdx}
        />
        <PickerColumn
          items={DAYS}
          selectedIdx={dayIdx}
          scrollRef={dayRef}
          setter={setDayIdx}
        />
        <PickerColumn
          items={YEARS}
          selectedIdx={yearIdx}
          scrollRef={yearRef}
          setter={setYearIdx}
        />
      </View>
    </View>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type PromptEntry = { prompt: string; answer: string };

type OnboardingData = {
  name: string;
  birthday: string;
  gender: string;
  lookingFor: string;
  ageRange: [number, number];
  photos: string[];
  prompts: PromptEntry[];
  interests: string[];
  datingIntent: string;
  locationLat: number | null;
  locationLng: number | null;
};

const TOTAL_STEPS = 11;

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [suggestedPrompts] = useState<string[]>(getSuggestedPrompts());
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  // When user returns from Settings after enabling location, auto-advance
  useEffect(() => {
    if (!locationDenied) return;
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          update({
            locationLat: location.coords.latitude,
            locationLng: location.coords.longitude,
          });
          nextStep();
        }
      }
    });
    return () => sub.remove();
  }, [locationDenied]);
  const [promptAnswer, setPromptAnswer] = useState("");

  const [data, setData] = useState<OnboardingData>({
    name: "",
    birthday: "",
    gender: "",
    lookingFor: "",
    ageRange: [18, 35],
    photos: [],
    prompts: [],
    interests: [],
    datingIntent: "",
    locationLat: null,
    locationLng: null,
  });

  function update(fields: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  function nextStep() {
    setStep((s) => s + 1);
  }

  function handleContinue() {
    if (step === 6 && !data.photos[0] && data.photos.some(Boolean)) {
      setShowPromoteModal(true);
      return;
    }
    nextStep();
  }

  function prevStep() {
    setStep((s) => s - 1);
  }

  // ─── Photo Picker ──────────────────────────────────────────────────────────

  async function takeLivePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      const next = [...data.photos];
      if (next.length === 0) {
        next.push(result.assets[0].uri);
      } else if (next.length < 5) {
        next.push(result.assets[0].uri);
      } else {
        next[0] = result.assets[0].uri;
      }
      update({ photos: next });
    }
  }

  async function pickPhoto(slotIndex: number) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow access to your photos to add profile pictures.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      const next = [...data.photos];
      next[slotIndex] = result.assets[0].uri;
      update({ photos: next });
    }
  }

  function removePhoto(index: number) {
    update({ photos: data.photos.filter((_, i) => i !== index) });
  }

  function promoteToMain(slotIndex: number) {
    const next = [...data.photos];
    const chosen = next[slotIndex];
    next[slotIndex] = next[0] ?? "";
    next[0] = chosen;
    // clean up any empty strings left behind
    update({ photos: next.filter(Boolean) });
    setShowPromoteModal(false);
  }

  // ─── Location ─────────────────────────────────────────────────────────────

  async function requestLocation() {
    setLocationDenied(false);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationDenied(true);
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    update({
      locationLat: location.coords.latitude,
      locationLng: location.coords.longitude,
    });
    nextStep();
  }

  // ─── Prompts ───────────────────────────────────────────────────────────────

  function selectPrompt(prompt: string) {
    if (data.prompts.find((p) => p.prompt === prompt)) return;
    if (data.prompts.length >= 3) {
      Alert.alert("Maximum reached", "You can choose up to 3 prompts.");
      return;
    }
    setActivePrompt(prompt);
    setPromptAnswer("");
  }

  function savePromptAnswer() {
    if (!activePrompt || !promptAnswer.trim()) return;
    update({
      prompts: [
        ...data.prompts,
        { prompt: activePrompt, answer: promptAnswer.trim() },
      ],
    });
    setActivePrompt(null);
    setPromptAnswer("");
  }

  function removePrompt(index: number) {
    update({ prompts: data.prompts.filter((_, i) => i !== index) });
  }

  // ─── Interests ────────────────────────────────────────────────────────────

  function toggleInterest(interest: string) {
    if (data.interests.includes(interest)) {
      update({ interests: data.interests.filter((i) => i !== interest) });
    } else {
      if (data.interests.length >= 5) {
        Alert.alert("Maximum reached", "You can choose up to 5 interests.");
        return;
      }
      update({ interests: [...data.interests, interest] });
    }
  }

  // ─── Save to Supabase ──────────────────────────────────────────────────────

  async function saveProfile() {
    if (!user) return;
    setSaving(true);

    // Calculate age from birthday
    const birthDate = new Date(data.birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    )
      age--;

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      name: data.name,
      birthday: data.birthday,
      age,
      gender: data.gender,
      looking_for: data.lookingFor,
      interests: data.interests,
      prompts: data.prompts,
      dating_intent: data.datingIntent,
      preferred_age_min: data.ageRange[0],
      preferred_age_max: data.ageRange[1],
      location_lat: data.locationLat,
      location_lng: data.locationLng,
      // Photos upload to Supabase Storage is a future step.
      // For now we store nothing — photos will be added later.
    });

    setSaving(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    router.replace("/(tabs)");
  }

  // ─── Validation per step ───────────────────────────────────────────────────

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return data.name.trim().length > 0;
      case 1:
        return data.birthday.trim().length > 0;
      case 2:
        return data.gender !== "";
      case 3:
        return data.lookingFor !== "";
      case 4:
        return true; // age range — always valid
      case 5:
        return true; // location — always can skip
      case 6:
        return data.photos.some(Boolean);
      case 7:
        return data.prompts.length >= 2;
      case 8:
        return data.interests.length > 0;
      case 9:
        return data.datingIntent !== "";
      case 10:
        return true;
      default:
        return true;
    }
  }

  // ─── Step Renderers ────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      // Step 0 — Name
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepSubtitle}>
              This is how you'll appear to others.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor="#555"
              value={data.name}
              onChangeText={(v) => update({ name: v })}
              autoFocus
            />
          </View>
        );

      // Step 1 — Birthday
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>When were you born?</Text>
            <Text style={styles.stepSubtitle}>
              Your age will be shown on your profile.
            </Text>
            <BirthdayPicker
              value={data.birthday}
              onChange={(v) => update({ birthday: v })}
            />
            {data.birthday
              ? (() => {
                  const birth = new Date(data.birthday);
                  const today = new Date();
                  let age = today.getFullYear() - birth.getFullYear();
                  const m = today.getMonth() - birth.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birth.getDate()))
                    age--;
                  return (
                    <Text style={styles.agePreview}>
                      You are {age} years old
                    </Text>
                  );
                })()
              : null}
          </View>
        );

      // Step 2 — Gender
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>How do you identify?</Text>
            <View style={styles.optionGroup}>
              {["Male", "Female", "Non-binary", "Prefer not to say"].map(
                (g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.optionButton,
                      data.gender === g && styles.optionSelected,
                    ]}
                    onPress={() => update({ gender: g })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        data.gender === g && styles.optionTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>
        );

      // Step 3 — Who they want to see
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              Who do you {"\n"}prefer to see?
            </Text>
            <View style={styles.optionGroup}>
              {["Men", "Women", "Everyone"].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.optionButton,
                    data.lookingFor === g && styles.optionSelected,
                  ]}
                  onPress={() => update({ lookingFor: g })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      data.lookingFor === g && styles.optionTextSelected,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // Step 4 — Age range
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              What is your{"\n"}preferred age range?
            </Text>
            <Text style={styles.stepSubtitle}>
              We'll show you people within this range.
            </Text>
            <Text style={styles.ageRangeLabel}>
              {data.ageRange[0]} — {data.ageRange[1]}
            </Text>
            <Slider
              value={data.ageRange}
              onValueChange={(v: number[]) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                update({ ageRange: [Math.round(v[0]), Math.round(v[1])] });
              }}
              minimumValue={18}
              maximumValue={80}
              step={1}
              containerStyle={styles.sliderContainer}
              trackStyle={styles.sliderTrack}
              minimumTrackTintColor="#FFB347"
              maximumTrackTintColor="#4B5563"
              thumbStyle={styles.sliderThumb}
            />
            <View style={styles.sliderBounds}>
              <Text style={styles.sliderBoundText}>18</Text>
              <Text style={styles.sliderBoundText}>80</Text>
            </View>
          </View>
        );

      // Step 5 — Location
      case 5:
        return (
          <View style={styles.stepContainer}>
            {locationDenied ? (
              <>
                <Text style={styles.stepTitle}>Location required</Text>
                <Text style={styles.stepSubtitle}>
                  Location is required to discover matches nearby.{"\n"}Please
                  enable location to continue.
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => Linking.openSettings()}
                >
                  <Text style={styles.primaryButtonText}>Open Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={requestLocation}
                >
                  <Text style={styles.skipText}>Try Again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.stepTitle}>Enable location?</Text>
                <Text style={styles.stepSubtitle}>
                  We use your location to show you people nearby.
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={requestLocation}
                >
                  <Text style={styles.primaryButtonText}>Allow Location</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );

      // Step 6 — Photos
      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Add your photos</Text>
            <Text style={styles.stepSubtitle}>
              Add at least 1 photo. Up to 5.
            </Text>

            {/* Main photo slot */}
            <TouchableOpacity
              style={styles.photoMainSlot}
              onPress={() => pickPhoto(0)}
              activeOpacity={0.8}
            >
              {data.photos[0] ? (
                <>
                  <Image
                    source={{ uri: data.photos[0] }}
                    style={styles.photoMainImage}
                  />
                  <TouchableOpacity
                    style={styles.removePhoto}
                    onPress={() => removePhoto(0)}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.addPhotoPlus}>+</Text>
                  <Text style={styles.addPhotoLabel}>
                    This is your first impression
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Promote modal */}
            <Modal
              visible={showPromoteModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowPromoteModal(false)}
            >
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setShowPromoteModal(false)}
              >
                <View style={styles.promoteModal}>
                  <TouchableOpacity
                    style={styles.promoteModalClose}
                    onPress={() => setShowPromoteModal(false)}
                  >
                    <Text style={styles.promoteModalCloseText}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.promoteModalTitle}>
                    Choose your main photo
                  </Text>
                  <View style={styles.promoteGrid}>
                    {[1, 2, 3, 4].filter((i) => data.photos[i]).map((i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => promoteToMain(i)}
                        activeOpacity={0.8}
                        style={styles.promoteThumb}
                      >
                        <Image
                          source={{ uri: data.photos[i] }}
                          style={styles.promoteThumbImage}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>

            {/* 3 secondary slots */}
            <View style={styles.photoRow}>
              {[1, 2, 3, 4].map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={styles.photoSecondarySlot}
                  onPress={() => pickPhoto(slot)}
                  activeOpacity={0.8}
                >
                  {data.photos[slot] ? (
                    <>
                      <Image
                        source={{ uri: data.photos[slot] }}
                        style={styles.photoSecondaryImage}
                      />
                      <TouchableOpacity
                        style={styles.removePhoto}
                        onPress={() => removePhoto(slot)}
                      >
                        <Text style={styles.removePhotoText}>✕</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.addPhotoPlus}>+</Text>
                      <Text style={styles.addPhotoLabel}>Add photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Take live photo */}
            <TouchableOpacity
              style={styles.livePhotoButton}
              onPress={takeLivePhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.livePhotoText}>Take live photo</Text>
            </TouchableOpacity>
            <Text style={styles.livePhotoSubtext}>Get a verified badge</Text>
          </View>
        );

      // Step 7 — Prompts
      case 7:
        return (
          <ScrollView
            style={styles.scrollStep}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.stepTitle}>Choose your prompts</Text>
            <Text style={styles.stepSubtitle}>
              Pick 2–3 prompts and answer them. They help start conversations.
            </Text>

            {/* Answered prompts */}
            {data.prompts.map((p, i) => (
              <View key={i} style={styles.answeredPrompt}>
                <Text style={styles.answeredPromptLabel}>{p.prompt}</Text>
                <Text style={styles.answeredPromptAnswer}>{p.answer}</Text>
                <TouchableOpacity onPress={() => removePrompt(i)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Answer input */}
            {activePrompt && (
              <View style={styles.promptAnswerBox}>
                <Text style={styles.activePromptLabel}>{activePrompt}</Text>
                <TextInput
                  style={styles.promptInput}
                  placeholder="Your answer..."
                  placeholderTextColor="#555"
                  value={promptAnswer}
                  onChangeText={setPromptAnswer}
                  multiline
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={savePromptAnswer}
                >
                  <Text style={styles.primaryButtonText}>Save Answer</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Suggested prompts */}
            {data.prompts.length < 3 && !activePrompt && (
              <>
                <Text style={styles.sectionLabel}>Suggested for you</Text>
                {(showAllPrompts ? ALL_PROMPTS : suggestedPrompts).map(
                  (prompt) => {
                    const already = data.prompts.find(
                      (p) => p.prompt === prompt,
                    );
                    return (
                      <TouchableOpacity
                        key={prompt}
                        style={[
                          styles.promptOption,
                          already && styles.promptOptionUsed,
                        ]}
                        onPress={() => !already && selectPrompt(prompt)}
                        disabled={!!already}
                      >
                        <Text style={styles.promptOptionText}>{prompt}</Text>
                      </TouchableOpacity>
                    );
                  },
                )}
                {!showAllPrompts && (
                  <TouchableOpacity onPress={() => setShowAllPrompts(true)}>
                    <Text style={styles.seeMore}>See more prompts</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        );

      // Step 8 — Interests
      case 8:
        return (
          <ScrollView
            style={styles.scrollStep}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.stepTitle}>What are you into?</Text>
            <Text style={styles.stepSubtitle}>Pick up to 5 interests.</Text>
            {INTEREST_CATEGORIES.map((cat) => (
              <View key={cat.category}>
                <Text style={styles.sectionLabel}>{cat.category}</Text>
                <View style={styles.chipRow}>
                  {cat.interests.map((interest) => {
                    const selected = data.interests.includes(interest);
                    return (
                      <TouchableOpacity
                        key={interest}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => toggleInterest(interest)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                        >
                          {interest}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        );

      // Step 9 — Dating intent
      case 9:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What are you hoping to find?</Text>
            {[
              "A meaningful relationship",
              "Something that could grow into more",
              "Taking things slow",
              "Still figuring it out",
            ].map((intent) => (
              <TouchableOpacity
                key={intent}
                style={[
                  styles.optionButton,
                  data.datingIntent === intent && styles.optionSelected,
                ]}
                onPress={() => update({ datingIntent: intent })}
              >
                <Text
                  style={[
                    styles.optionText,
                    data.datingIntent === intent && styles.optionTextSelected,
                  ]}
                >
                  {intent}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      // Step 10 — Orbit explanation
      case 10:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Welcome to COMET.</Text>
            <Text style={styles.orbitExplain}>
              COMET is built around one idea:{"\n\n"}
              <Text style={styles.orbitHighlight}>One match at a time.</Text>
            </Text>
            <Text style={styles.orbitBody}>
              If you're interested in someone, send them a{" "}
              <Text style={styles.orbitHighlight}>Signal</Text>.{"\n\n"}When you
              and someone both signal each other, a{" "}
              <Text style={styles.orbitHighlight}>Collision</Text> occurs.
              {"\n\n"}
              You enter <Text style={styles.orbitHighlight}>Orbit</Text> — an
              exclusive chat phase where discovery pauses and you focus on one
              connection.{"\n\n"}
              You can <Text style={styles.orbitHighlight}>Drift</Text> anytime.
              No pressure.
            </Text>
          </View>
        );

      default:
        return null;
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const isLastStep = step === TOTAL_STEPS - 1;
  const isLocationStep = step === 5;

  return (
    <LinearGradient
      colors={["#164271", "#000000"]}
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((step + 1) / TOTAL_STEPS) * 100}%` },
          ]}
        />
      </View>

      {/* Back button */}
      <TouchableOpacity
        onPress={step === 0 ? () => router.replace("/(auth)/signup") : prevStep}
        style={styles.backButton}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* Step content */}
      <View style={styles.content}>{renderStep()}</View>

      {/* Next / Finish button — hidden on location step (it handles its own nav) */}
      {!isLocationStep && (
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canAdvance() && styles.nextButtonDisabled,
          ]}
          onPress={isLastStep ? saveProfile : handleContinue}
          disabled={!canAdvance() || saving}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.40)", "rgba(0,0,0,0)", "rgba(0,0,0,0.40)"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {isLastStep ? "Let's go" : "Continue"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressBar: {
    height: 3,
    backgroundColor: "#1a1a1a",
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 24,
  },
  progressFill: {
    height: 3,
    backgroundColor: "#2A7DE1",
    borderRadius: 2,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: "flex-start",
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: "#fff",
    fontFamily: "Montserrat-Regular",
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  scrollStep: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 26,
    fontFamily: "Montserrat-Bold",
    color: "#fff",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
    color: "#888",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
    marginBottom: 16,
  },
  agePreview: {
    color: "#888",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
    textAlign: "center",
    marginTop: 16,
  },
  ageRangeLabel: {
    fontSize: 24,
    fontFamily: "Montserrat-Bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  sliderContainer: {
    marginHorizontal: 4,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  sliderBounds: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sliderBoundText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
  },
  optionGroup: {
    marginTop: 24,
  },
  optionButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  optionSelected: {
    borderColor: "#2A7DE1",
    backgroundColor: "#0d1f33",
  },
  optionText: {
    color: "#aaa",
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
  },
  optionTextSelected: {
    color: "#2A7DE1",
    fontFamily: "Montserrat-Bold",
  },
  primaryButton: {
    backgroundColor: "#2A7DE1",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
  },
  skipButton: {
    alignItems: "center",
    padding: 12,
  },
  skipText: {
    color: "#555",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
  },
  photoMainSlot: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
    position: "relative",
  },
  photoMainImage: {
    width: "100%",
    height: "100%",
  },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  photoSecondarySlot: {
    width: "48%",
    height: 88,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  photoSecondaryImage: {
    width: "100%",
    height: "100%",
  },
  addPhotoPlus: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Montserrat-Regular",
    lineHeight: 28,
  },
  addPhotoLabel: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Montserrat-Regular",
    marginTop: 2,
  },
  removePhoto: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  removePhotoText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
  },
  livePhotoButton: {
    alignSelf: "center",
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#2A7DE1",
  },
  livePhotoText: {
    color: "#2A7DE1",
    fontSize: 13,
    fontFamily: "Montserrat-Bold",
    letterSpacing: 0.5,
  },
  livePhotoSubtext: {
    color: "#6A8FAF",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 6,
  },
  promoteBanner: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(42,125,225,0.1)",
    borderWidth: 1,
    borderColor: "rgba(42,125,225,0.3)",
    alignItems: "center",
  },
  promoteBannerText: {
    color: "#2A7DE1",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  promoteModalClose: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  promoteModalCloseText: {
    color: "#6A8FAF",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
  },
  promoteModal: {
    backgroundColor: "#0d1f33",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  promoteModalTitle: {
    color: "#EAF6FF",
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
    textAlign: "center",
    marginBottom: 16,
  },
  promoteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  promoteThumb: {
    width: "45%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  promoteThumbImage: {
    width: "100%",
    height: "100%",
  },
  sectionLabel: {
    color: "#555",
    fontSize: 12,
    fontFamily: "Montserrat-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  answeredPrompt: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  answeredPromptLabel: {
    color: "#2A7DE1",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    marginBottom: 4,
  },
  answeredPromptAnswer: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
    marginBottom: 8,
  },
  removeText: {
    color: "#e85d4a",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
  },
  promptAnswerBox: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  activePromptLabel: {
    color: "#2A7DE1",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
    marginBottom: 10,
  },
  promptInput: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
    minHeight: 80,
    marginBottom: 12,
  },
  promptOption: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  promptOptionUsed: {
    opacity: 0.3,
  },
  promptOptionText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
  },
  seeMore: {
    color: "#2A7DE1",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
    textAlign: "center",
    paddingVertical: 16,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  chipSelected: {
    backgroundColor: "#0d1f33",
    borderColor: "#2A7DE1",
  },
  chipText: {
    color: "#aaa",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
  },
  chipTextSelected: {
    color: "#2A7DE1",
    fontFamily: "Montserrat-Bold",
  },
  orbitExplain: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Montserrat-Regular",
    lineHeight: 28,
    marginBottom: 20,
  },
  orbitHighlight: {
    color: "#2A7DE1",
    fontFamily: "Montserrat-Bold",
  },
  orbitBody: {
    color: "#888",
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
    lineHeight: 26,
  },
  nextButton: {
    backgroundColor: "#2A7DE1",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    overflow: "hidden",
  },
  nextButtonDisabled: {
    opacity: 0.3,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
  },
});
