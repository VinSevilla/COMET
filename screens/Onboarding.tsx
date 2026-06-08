import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Slider } from "@miblanchard/react-native-slider";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Dimensions,
  Image,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
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
    interests: [
      "Coffee",
      "Brunch",
      "Traveling",
      "Fashion",
      "Foodie",
      "Partying",
      "Shopping",
    ],
  },
  {
    category: "Outdoors",
    interests: ["Hiking", "Camping", "Beach", "Road trips", "Nature"],
  },
  {
    category: "Fitness",
    interests: [
      "Gym",
      "Running",
      "Yoga",
      "Cycling",
      "Pilates",
      "Swimming",
      "Sports",
    ],
  },
  {
    category: "Creative",
    interests: [
      "Art",
      "Writing",
      "Music",
      "Dancing",
      "Singing",
      "Film",
      "Photography",
    ],
  },
  {
    category: "Entertainment",
    interests: [
      "Gaming",
      "Movies",
      "TV shows",
      "Podcasts",
      "Anime",
      "Comics",
      "Cartoons",
      "D&D",
      "Card games",
    ],
  },
  {
    category: "Intellectual",
    interests: ["Reading", "History", "Science", "Tech", "Chess"],
  },
  {
    category: "Everyday",
    interests: [
      "Cooking",
      "Baking",
      "Gardening",
      "Animals",
      "Astrology",
      "Cars",
    ],
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
  const bumpAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    bumpAnim.setValue(1);
    Animated.sequence([
      Animated.timing(bumpAnim, {
        toValue: 1.035,
        duration: 75,
        useNativeDriver: true,
      }),
      Animated.timing(bumpAnim, {
        toValue: 1,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedIdx]);

  function onScrollEnd(e: { nativeEvent: { contentOffset: { y: number } } }) {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (clamped !== selectedIdx) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setter(clamped);
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
        {items.map((item, i) => {
          const isSelected = i === selectedIdx;
          return (
            <View
              key={item}
              style={{
                height: ITEM_HEIGHT,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Animated.View
                style={
                  isSelected ? { transform: [{ scale: bumpAnim }] } : undefined
                }
              >
                <Text
                  style={{
                    color: isSelected ? "#EAF6FF" : "rgba(234,246,255,0.38)",
                    fontSize: isSelected ? 21 : 16,
                    fontFamily: isSelected
                      ? "Montserrat-Bold"
                      : "Montserrat-Regular",
                  }}
                >
                  {item}
                </Text>
              </Animated.View>
            </View>
          );
        })}
      </ScrollView>
      <LinearGradient
        colors={["rgba(10,24,42,0.98)", "rgba(10,24,42,0.6)", "transparent"]}
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
        colors={["transparent", "rgba(10,24,42,0.6)", "rgba(10,24,42,0.98)"]}
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
        borderRadius: 20,
        marginTop: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(15,42,68,0.6)",
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {/* Selection band */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: PICKER_PADDING,
            left: 8,
            right: 8,
            height: ITEM_HEIGHT,
            borderRadius: 12,
            backgroundColor: "rgba(42,125,225,0.11)",
            borderWidth: 0.5,
            borderColor: "rgba(60,246,213,0.14)",
            shadowColor: "#3CF6D5",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.28,
            shadowRadius: 9,
            elevation: 4,
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
    </View>
  );
}

// ─── Interest Chip Button ────────────────────────────────────────────────────

function InterestChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [selected]);

  return (
    <TouchableOpacity
      style={styles.interestChip}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: anim, borderRadius: 30 }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["#3CF6D5", "#2A7DE1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.interestChipGradientBorder}
        >
          <View style={styles.interestChipInner} />
        </LinearGradient>
      </Animated.View>
      <Text
        style={[
          styles.interestChipText,
          selected && styles.interestChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Lifestyle Option Button ─────────────────────────────────────────────────

function LifestyleOption({
  opt,
  selected,
  onPress,
  wrapStyle,
}: {
  opt: string;
  selected: boolean;
  onPress: () => void;
  wrapStyle?: object;
}) {
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [selected]);

  return (
    <TouchableOpacity
      style={[styles.lifestyleOptionWrapper, wrapStyle]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.lifestyleOption} />
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: anim }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["#3CF6D5", "#2A7DE1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.lifestyleOptionGradientBorder}
        >
          <View style={styles.lifestyleOptionInner} />
        </LinearGradient>
      </Animated.View>
      <View
        style={[StyleSheet.absoluteFill, styles.lifestyleOptionLabel]}
        pointerEvents="none"
      >
        <Text
          style={[
            styles.lifestyleOptionText,
            selected && styles.lifestyleOptionTextSelected,
          ]}
        >
          {opt}
        </Text>
      </View>
    </TouchableOpacity>
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
  preferredDistance: number;
  lifestyle: { drink: string; smoke: string; workout: string };
  career: { school: string; work: string };
  photos: string[];
  prompts: PromptEntry[];
  interests: string[];
  datingIntent: string;
  locationLat: number | null;
  locationLng: number | null;
};

const TOTAL_STEPS = 15;

// ─── Main Component ──────────────────────────────────────────────────────────

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PROMPT_EXPAND_ANIMATION = {
  duration: 280,
  create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
};

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<number>(0);
  const [livePhotoUris, setLivePhotoUris] = useState<string[]>([]);
  const sheetAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const seeMoreOpacity = useRef(new Animated.Value(0.75)).current;
  const stepTranslateY = useRef(new Animated.Value(0)).current;
  const [suggestedPrompts] = useState<string[]>(getSuggestedPrompts());
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<
    "interests" | "lifestyle" | "prompts" | null
  >(null);
  const [localEditData, setLocalEditData] = useState<Partial<OnboardingData>>({});
  const [justEditedSection, setJustEditedSection] = useState<string | null>(null);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);
  const sectionHighlightAnim = useRef(new Animated.Value(0)).current;

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
  const [promptInputHeight, setPromptInputHeight] = useState(40);
  const blockNextNewline = useRef(false);
  const promptInputRef = useRef<TextInput>(null);

  const [data, setData] = useState<OnboardingData>({
    name: "",
    birthday: "",
    gender: "",
    lookingFor: "",
    ageRange: [18, 35],
    preferredDistance: 25,
    lifestyle: { drink: "", smoke: "", workout: "" },
    career: { school: "", work: "" },
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

  function animateStepIn() {
    stepOpacity.setValue(0);
    stepTranslateY.setValue(18);
    Animated.parallel([
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(stepTranslateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function nextStep() {
    setStep((s) => s + 1);
    animateStepIn();
  }

  function handleContinue() {
    if (step === 10 && !data.photos[0] && data.photos.some(Boolean)) {
      setShowPromoteModal(true);
      return;
    }
    nextStep();
  }

  function prevStep() {
    setStep((s) => s - 1);
    animateStepIn();
  }

  // ─── Photo Picker ──────────────────────────────────────────────────────────

  function openPhotoOptions(slot: number) {
    setPendingSlot(slot);
    sheetAnim.setValue(300);
    backdropAnim.setValue(0);
    setShowPhotoSheet(true);
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
        mass: 1,
      }),
    ]).start();
  }

  function closePhotoSheet() {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: 300,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setShowPhotoSheet(false));
  }

  async function takeLivePhoto(slotIndex: number) {
    setShowPhotoSheet(false);
    // REPLACE: requestCameraPermissionsAsync
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to take a photo.");
      return;
    }
    //REPLACE: witt --> .launchImageCameraAsync
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const next = [...data.photos];
      const old = next[slotIndex];
      if (old) setLivePhotoUris((prev) => prev.filter((u) => u !== old));
      next[slotIndex] = uri;
      setLivePhotoUris((prev) => [...prev, uri]);
      update({ photos: next });
    }
  }

  async function pickPhoto(slotIndex: number) {
    setShowPhotoSheet(false);
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
      const old = next[slotIndex];
      if (old) setLivePhotoUris((prev) => prev.filter((u) => u !== old));
      next[slotIndex] = result.assets[0].uri;
      update({ photos: next });
    }
  }

  function removePhoto(index: number) {
    const removed = data.photos[index];
    if (removed) setLivePhotoUris((prev) => prev.filter((u) => u !== removed));
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
    LayoutAnimation.configureNext(PROMPT_EXPAND_ANIMATION);
    setActivePrompt(prompt);
    setPromptAnswer("");
    setPromptInputHeight(40);
  }

  function savePromptAnswer() {
    if (!activePrompt || !promptAnswer.trim()) return;
    LayoutAnimation.configureNext(PROMPT_EXPAND_ANIMATION);
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

  // ─── Edit Section Helpers ─────────────────────────────────────────────────

  function updateLocal(fields: Partial<OnboardingData>) {
    setLocalEditData((prev) => ({ ...prev, ...fields }));
  }

  function enterEditSection(section: "interests" | "lifestyle" | "prompts") {
    setLocalEditData({ ...data });
    setActivePrompt(null);
    setPromptAnswer("");
    setEditingSection(section);
    animateStepIn();
  }

  function saveEditSection() {
    const section = editingSection!;
    update(localEditData as Partial<OnboardingData>);
    setEditingSection(null);
    setActivePrompt(null);
    setPromptAnswer("");
    setJustEditedSection(section);
    sectionHighlightAnim.setValue(1);
    Animated.timing(sectionHighlightAnim, {
      toValue: 0,
      duration: 1400,
      delay: 400,
      useNativeDriver: true,
    }).start(() => setJustEditedSection(null));
    animateStepIn();
  }

  function cancelEditSection() {
    setEditingSection(null);
    setActivePrompt(null);
    setPromptAnswer("");
    animateStepIn();
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

  // Uploads each local photo URI to the `profile-photos` Storage bucket and
  // returns an array of public URLs (preserving order). Throws on failure.
  async function uploadPhotos(uris: string[], userId: string): Promise<string[]> {
    const urls: string[] = [];
    for (let i = 0; i < uris.length; i++) {
      const uri = uris[i];
      // RN/Expo: read the local file:// URI into an ArrayBuffer for upload.
      const arraybuffer = await fetch(uri).then((res) => res.arrayBuffer());
      // Derive a content type the bucket accepts from the file extension.
      // Anything unrecognized falls back to JPEG (expo-image-picker with
      // allowsEditing typically returns JPEG).
      const ext = (uri.split(".").pop() || "jpg").toLowerCase().split("?")[0];
      const MIME: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
      };
      const contentType = MIME[ext] ?? "image/jpeg";
      // Use a normalized extension in the path so it matches the content type.
      const safeExt = MIME[ext] ? ext : "jpg";
      const path = `${userId}/${Date.now()}-${i}.${safeExt}`;

      const { error } = await supabase.storage
        .from("profile-photos")
        .upload(path, arraybuffer, { contentType, upsert: true });
      if (error) throw error;

      const { data: pub } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(path);
      urls.push(pub.publicUrl);
    }
    return urls;
  }

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

    // Upload photos to Storage first, then store their public URLs on the
    // profile. `data.photos` can be sparse (filled by slot index), so drop
    // any empty slots before uploading.
    let photoUrls: string[] = [];
    try {
      photoUrls = await uploadPhotos(data.photos.filter(Boolean), user.id);
    } catch (e: any) {
      setSaving(false);
      Alert.alert(
        "Photo upload failed",
        e?.message ?? "Could not upload your photos. Please try again.",
      );
      return;
    }

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
      lifestyle: data.lifestyle,
      career: data.career,
      photos: photoUrls,
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
        return (
          data.name.trim().length >= 1 &&
          !/[^a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]/.test(data.name)
        );
      case 1:
        return data.birthday.trim().length > 0;
      case 2:
        return data.gender !== "";
      case 3:
        return data.lookingFor !== "";
      case 4:
        return true; // age range — always valid
      case 5:
        return true; // preferred distance — always valid
      case 6:
        return (
          data.lifestyle.drink !== "" &&
          data.lifestyle.smoke !== "" &&
          data.lifestyle.workout !== ""
        );
      case 7:
        return data.career.school !== "" && data.career.work !== "";
      case 8:
        return data.interests.length > 0;
      case 9:
        return data.prompts.length >= 2;
      case 10:
        return data.photos.some(Boolean);
      case 11:
        return data.datingIntent !== "";
      case 12:
        return true; // location — always can skip
      case 13:
        return true;
      case 14:
        return true;
      default:
        return true;
    }
  }

  // ─── Edit Section Renderers ──────────────────────────────────────────────

  function renderInterestsEdit() {
    const selected = localEditData.interests ?? [];
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.editScreenHeader}>
          <Text style={styles.stepTitle}>Your Interests</Text>
          <Text style={styles.editCounter}>{selected.length}/5 selected</Text>
        </View>
        <Text style={styles.stepSubtitle}>Choose up to 5 that feel like you.</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {INTEREST_CATEGORIES.map((cat) => (
            <View key={cat.category}>
              <Text style={styles.sectionLabel}>{cat.category}</Text>
              <View style={styles.chipRow}>
                {cat.interests.map((interest) => (
                  <InterestChip
                    key={interest}
                    label={interest}
                    selected={selected.includes(interest)}
                    onPress={() => {
                      if (selected.includes(interest)) {
                        updateLocal({ interests: selected.filter((i) => i !== interest) });
                      } else if (selected.length < 5) {
                        updateLocal({ interests: [...selected, interest] });
                      }
                    }}
                  />
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
        <View style={styles.editActions}>
          <Button
            variant="primary"
            label="Save"
            onPress={saveEditSection}
            disabled={selected.length === 0}
          />
          <TouchableOpacity style={styles.editCancelButton} onPress={cancelEditSection}>
            <Text style={styles.editCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderLifestyleEdit() {
    const lifestyle = (localEditData.lifestyle ?? {
      drink: "",
      smoke: "",
      workout: "",
    }) as typeof data.lifestyle;

    const row = (
      icon: keyof typeof MaterialCommunityIcons.glyphMap,
      question: string,
      field: keyof typeof lifestyle,
      options: string[],
      showDivider: boolean,
    ) => (
      <View key={field}>
        <View style={styles.lifestyleQuestion}>
          <MaterialCommunityIcons name={icon} size={20} color="#6A8FAF" />
          <Text style={styles.lifestyleQuestionText}>{question}</Text>
        </View>
        <View style={styles.lifestyleOptions}>
          {options.map((opt) => (
            <LifestyleOption
              key={opt}
              opt={opt}
              selected={lifestyle[field] === opt}
              onPress={() =>
                updateLocal({ lifestyle: { ...lifestyle, [field]: opt } })
              }
            />
          ))}
        </View>
        {showDivider && <View style={styles.lifestyleDivider} />}
      </View>
    );

    const canSave =
      lifestyle.drink !== "" && lifestyle.smoke !== "" && lifestyle.workout !== "";

    return (
      <View style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>Your Lifestyle</Text>
        <Text style={styles.stepSubtitle}>Update how you live.</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {row("glass-wine", "Do you drink?", "drink", ["Frequently", "Socially", "Never"], true)}
          {row("smoking", "Do you smoke?", "smoke", ["Frequently", "Socially", "Never"], true)}
          {row("dumbbell", "Do you workout?", "workout", ["Often", "Sometimes", "Never"], false)}
          <View style={{ height: 24 }} />
        </ScrollView>
        <View style={styles.editActions}>
          <Button
            variant="primary"
            label="Save"
            onPress={saveEditSection}
            disabled={!canSave}
          />
          <TouchableOpacity style={styles.editCancelButton} onPress={cancelEditSection}>
            <Text style={styles.editCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderPromptsEdit() {
    const prompts = localEditData.prompts ?? [];

    return (
      <View style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>Your Prompts</Text>
        <Text style={styles.stepSubtitle}>Pick 2–3 and answer them.</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {prompts.map((p, i) => (
            <View key={i} style={styles.answeredPrompt}>
              <Text style={styles.answeredBadge}>✓ Answered</Text>
              <Text style={styles.answeredPromptLabel}>{p.prompt}</Text>
              <Text style={styles.answeredPromptAnswer}>{p.answer}</Text>
              <TouchableOpacity
                onPress={() =>
                  updateLocal({ prompts: prompts.filter((_, j) => j !== i) })
                }
              >
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          {prompts.length < 3 && (
            <>
              <Text style={styles.sectionLabel}>Suggested for you</Text>
              {(showAllPrompts ? ALL_PROMPTS : suggestedPrompts).map((prompt) => {
                const already = prompts.find((p) => p.prompt === prompt);
                const isActive = activePrompt === prompt;
                return (
                  <TouchableOpacity
                    key={prompt}
                    style={already && styles.promptOptionUsed}
                    onPress={() => {
                      if (already || isActive || prompts.length >= 3) return;
                      LayoutAnimation.configureNext(PROMPT_EXPAND_ANIMATION);
                      setActivePrompt(prompt);
                      setPromptAnswer("");
                      setPromptInputHeight(40);
                    }}
                    disabled={!!already}
                    activeOpacity={isActive ? 1 : 0.75}
                  >
                    <View style={[styles.promptOption, isActive && styles.promptOptionActive]}>
                      <Text style={styles.promptOptionText}>{prompt}</Text>
                      {isActive && (
                        <TouchableOpacity
                          style={styles.promptDismiss}
                          onPress={() => {
                            LayoutAnimation.configureNext(PROMPT_EXPAND_ANIMATION);
                            setActivePrompt(null);
                          }}
                          hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
                        >
                          <Text style={styles.promptDismissText}>✕</Text>
                        </TouchableOpacity>
                      )}
                      {isActive && (
                        <>
                          <View style={styles.promptInputContainer}>
                            <TextInput
                              ref={promptInputRef}
                              style={[styles.promptInputInner, { height: promptInputHeight }]}
                              placeholder="Enter response here"
                              placeholderTextColor="rgba(234,246,255,0.35)"
                              value={promptAnswer}
                              maxLength={100}
                              onChangeText={(text) => {
                                const firstNl = text.indexOf("\n");
                                const cleaned =
                                  firstNl !== -1
                                    ? text.slice(0, firstNl + 1) +
                                      text.slice(firstNl + 1).replace(/\n/g, "")
                                    : text;
                                setPromptAnswer(cleaned);
                              }}
                              onContentSizeChange={(e) =>
                                setPromptInputHeight(
                                  Math.max(40, e.nativeEvent.contentSize.height),
                                )
                              }
                              multiline
                              autoFocus
                            />
                          </View>
                          <View style={styles.promptFooter}>
                            {promptAnswer.length >= 100 ? (
                              <Text style={styles.promptCharCount}>
                                Character limit reached
                              </Text>
                            ) : (
                              <View />
                            )}
                            <TouchableOpacity
                              onPress={() => {
                                if (!activePrompt || !promptAnswer.trim()) return;
                                LayoutAnimation.configureNext(PROMPT_EXPAND_ANIMATION);
                                updateLocal({
                                  prompts: [
                                    ...prompts,
                                    { prompt: activePrompt, answer: promptAnswer.trim() },
                                  ],
                                });
                                setActivePrompt(null);
                                setPromptAnswer("");
                              }}
                            >
                              <Text style={styles.promptSaveText}>Save answer</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {!showAllPrompts && (
                <Animated.View style={{ opacity: seeMoreOpacity }}>
                  <TouchableOpacity
                    onPress={() => setShowAllPrompts(true)}
                    activeOpacity={1}
                  >
                    <Text style={styles.seeMore}>See more prompts</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
        <View style={styles.editActions}>
          <Button
            variant="primary"
            label="Save"
            onPress={saveEditSection}
            disabled={prompts.length < 2}
          />
          <TouchableOpacity style={styles.editCancelButton} onPress={cancelEditSection}>
            <Text style={styles.editCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Step Renderers ────────────────────────────────────────────────────────

  function renderStep() {
    if (step === 13 && editingSection === "interests") return renderInterestsEdit();
    if (step === 13 && editingSection === "lifestyle") return renderLifestyleEdit();
    if (step === 13 && editingSection === "prompts") return renderPromptsEdit();

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
              onChangeText={(v) => {
                const hasInvalid = /[^a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]/.test(v);
                setNameError(
                  hasInvalid
                    ? "Only letters, spaces, hyphens, and apostrophes are allowed."
                    : "",
                );
                update({ name: v });
              }}
              autoFocus
              autoCapitalize="words"
              maxLength={30}
            />
            {nameError ? (
              <Text style={styles.nameError}>{nameError}</Text>
            ) : null}
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
            <Text style={styles.stepTitle}>Who do you{"\n"}want to meet?</Text>
            <Text style={styles.stepSubtitle}>
              We'll show you people within this range.
            </Text>
            <View style={styles.ageRangeRow}>
              <Text style={styles.ageRangeLabel}>Age range:</Text>
              <Text style={styles.ageRangeLabel}>
                {data.ageRange[0]} – {data.ageRange[1]}
              </Text>
            </View>
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
              minimumTrackTintColor="#2AB6DC"
              maximumTrackTintColor="rgba(255,255,255,0.12)"
              thumbStyle={styles.sliderThumb}
            />
            <View style={styles.sliderBounds}>
              <Text style={styles.sliderBoundText}>18</Text>
              <Text style={styles.sliderBoundText}>80</Text>
            </View>
          </View>
        );

      // Step 5 — Preferred Distance
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>How far away?</Text>
            <Text style={styles.stepSubtitle}>
              Show me people within this distance.
            </Text>
            <Text style={styles.distanceValue}>
              {data.preferredDistance === 100
                ? "100+ miles"
                : `${data.preferredDistance} miles`}
            </Text>
            <Slider
              value={data.preferredDistance}
              onValueChange={(v) =>
                update({
                  preferredDistance: Math.round(Array.isArray(v) ? v[0] : v),
                })
              }
              minimumValue={1}
              maximumValue={100}
              step={1}
              minimumTrackTintColor="#2AB6DC"
              maximumTrackTintColor="rgba(255,255,255,0.12)"
              containerStyle={styles.sliderContainer}
              trackStyle={styles.sliderTrack}
              thumbStyle={styles.sliderThumb}
            />
            <View style={styles.distanceLabels}>
              <Text style={styles.distanceLabelText}>1 mi</Text>
              <Text style={styles.distanceLabelText}>100+ mi</Text>
            </View>
          </View>
        );

      // Step 6 — Lifestyle
      case 6: {
        const lifestyleRow = (
          icon: keyof typeof MaterialCommunityIcons.glyphMap,
          question: string,
          field: keyof typeof data.lifestyle,
          options: string[],
          showDivider: boolean,
        ) => (
          <View key={field}>
            <View style={styles.lifestyleQuestion}>
              <MaterialCommunityIcons name={icon} size={20} color="#6A8FAF" />
              <Text style={styles.lifestyleQuestionText}>{question}</Text>
            </View>
            <View style={styles.lifestyleOptions}>
              {options.map((opt) => (
                <LifestyleOption
                  key={opt}
                  opt={opt}
                  selected={data.lifestyle[field] === opt}
                  onPress={() =>
                    update({ lifestyle: { ...data.lifestyle, [field]: opt } })
                  }
                />
              ))}
            </View>
            {showDivider && <View style={styles.lifestyleDivider} />}
          </View>
        );

        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              What's your{"\n"}lifestyle like?
            </Text>
            <Text style={styles.stepSubtitle}>
              Help others understand how you live.
            </Text>
            {lifestyleRow(
              "glass-wine",
              "Do you drink?",
              "drink",
              ["Frequently", "Socially", "Never"],
              true,
            )}
            {lifestyleRow(
              "smoking",
              "Do you smoke?",
              "smoke",
              ["Frequently", "Socially", "Never"],
              true,
            )}
            {lifestyleRow(
              "dumbbell",
              "Do you workout?",
              "workout",
              ["Often", "Sometimes", "Never"],
              false,
            )}
          </View>
        );
      }

      // Step 7 — Career
      case 7: {
        const careerRow = (
          icon: keyof typeof MaterialCommunityIcons.glyphMap,
          question: string,
          field: keyof typeof data.career,
          options: string[],
          showDivider: boolean,
          wrap = false,
          wrapWidth = "31%",
          wrapGap = 6,
        ) => (
          <View key={field}>
            <View style={styles.lifestyleQuestion}>
              <MaterialCommunityIcons name={icon} size={20} color="#6A8FAF" />
              <Text style={styles.lifestyleQuestionText}>{question}</Text>
            </View>
            <View
              style={[
                styles.lifestyleOptions,
                wrap && { flexWrap: "wrap", gap: wrapGap },
              ]}
            >
              {options.map((opt) => (
                <LifestyleOption
                  key={opt}
                  opt={opt}
                  selected={data.career[field] === opt}
                  onPress={() =>
                    update({ career: { ...data.career, [field]: opt } })
                  }
                  wrapStyle={wrap ? { flex: 0, width: wrapWidth } : undefined}
                />
              ))}
            </View>
            {showDivider && <View style={styles.lifestyleDivider} />}
          </View>
        );

        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              What do you{"\n"}do with your time?
            </Text>
            <Text style={styles.stepSubtitle}>
              Share a little about your life.
            </Text>
            {careerRow(
              "school",
              "Are you in school?",
              "school",
              ["No", "College", "Grad school", "Trade school"],
              true,
              true,
            )}
            {careerRow(
              "briefcase",
              "Are you working?",
              "work",
              ["Unemployed", "Self-employed", "Part-Time", "Full-Time"],
              false,
              true,
              "32%",
              4,
            )}
          </View>
        );
      }

      // Step 11 — Dating intent
      case 11:
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

      // Step 10 — Photos
      case 10:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Add your photos</Text>
            <Text style={styles.stepSubtitle}>
              Add at least 1 photo. Up to 5.
            </Text>

            {/* Main photo slot */}
            <TouchableOpacity
              style={[
                styles.photoMainSlot,
                livePhotoUris.includes(data.photos[0]) && styles.photoLiveGlow,
              ]}
              onPress={() => openPhotoOptions(0)}
              activeOpacity={0.8}
            >
              {data.photos[0] ? (
                <>
                  <Image
                    source={{ uri: data.photos[0] }}
                    style={styles.photoMainImage}
                  />
                  {livePhotoUris.includes(data.photos[0]) && (
                    <LinearGradient
                      colors={["rgba(60,246,213,0.0)", "rgba(60,246,213,0.07)"]}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />
                  )}
                  {livePhotoUris.includes(data.photos[0]) && (
                    <View style={styles.verifiedBadge} pointerEvents="none">
                      <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                    </View>
                  )}
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
                    {[1, 2, 3, 4]
                      .filter((i) => data.photos[i])
                      .map((i) => (
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
                  style={[
                    styles.photoSecondarySlot,
                    livePhotoUris.includes(data.photos[slot]) &&
                      styles.photoLiveGlow,
                  ]}
                  onPress={() => openPhotoOptions(slot)}
                  activeOpacity={0.8}
                >
                  {data.photos[slot] ? (
                    <>
                      <Image
                        source={{ uri: data.photos[slot] }}
                        style={styles.photoSecondaryImage}
                      />
                      {livePhotoUris.includes(data.photos[slot]) && (
                        <LinearGradient
                          colors={[
                            "rgba(60,246,213,0.0)",
                            "rgba(60,246,213,0.07)",
                          ]}
                          style={StyleSheet.absoluteFill}
                          pointerEvents="none"
                        />
                      )}
                      {livePhotoUris.includes(data.photos[slot]) && (
                        <View style={styles.verifiedBadge} pointerEvents="none">
                          <Text style={styles.verifiedBadgeText}>✓</Text>
                        </View>
                      )}
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

            <Text style={styles.livePhotoSubtext}>
              *Live photos receive a verified badge
            </Text>

            {/* Photo action sheet */}
            <Modal
              visible={showPhotoSheet}
              transparent
              animationType="none"
              onRequestClose={closePhotoSheet}
            >
              <Animated.View
                style={[styles.photoSheetBackdrop, { opacity: backdropAnim }]}
                pointerEvents="box-none"
              >
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={closePhotoSheet}
                />
                <Animated.View
                  style={[
                    styles.photoSheet,
                    { transform: [{ translateY: sheetAnim }] },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.photoSheetOption}
                    activeOpacity={0.7}
                    onPress={() => pickPhoto(pendingSlot)}
                  >
                    <Text style={styles.photoSheetOptionText}>
                      Upload photo
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.photoSheetDivider} />
                  <TouchableOpacity
                    style={styles.photoSheetOption}
                    activeOpacity={0.7}
                    onPress={() => takeLivePhoto(pendingSlot)}
                  >
                    <View style={{ alignItems: "center" }}>
                      <Text style={styles.photoSheetOptionText}>
                        Take live photo
                      </Text>
                      <Text style={styles.photoSheetVerified}>(Verified)</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.photoSheetDivider} />
                  <TouchableOpacity
                    style={styles.photoSheetOption}
                    activeOpacity={0.7}
                    onPress={closePhotoSheet}
                  >
                    <Text style={styles.photoSheetCancel}>Cancel</Text>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </Modal>
          </View>
        );

      // Step 9 — Prompts
      case 9:
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
                <Text style={styles.answeredBadge}>✓ Answered</Text>
                <Text style={styles.answeredPromptLabel}>{p.prompt}</Text>
                <Text style={styles.answeredPromptAnswer}>{p.answer}</Text>
                <TouchableOpacity onPress={() => removePrompt(i)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Suggested prompts */}
            {data.prompts.length < 3 && (
              <>
                <Text style={styles.sectionLabel}>Suggested for you</Text>
                {(showAllPrompts ? ALL_PROMPTS : suggestedPrompts).map(
                  (prompt) => {
                    const already = data.prompts.find(
                      (p) => p.prompt === prompt,
                    );
                    const isActive = activePrompt === prompt;
                    return (
                      <TouchableOpacity
                        key={prompt}
                        style={already && styles.promptOptionUsed}
                        onPress={() =>
                          !already && !isActive && selectPrompt(prompt)
                        }
                        disabled={!!already}
                        activeOpacity={isActive ? 1 : 0.75}
                      >
                        <View
                          style={[
                            styles.promptOption,
                            isActive && styles.promptOptionActive,
                          ]}
                        >
                          <Text style={styles.promptOptionText}>{prompt}</Text>
                          {isActive && (
                            <TouchableOpacity
                              style={styles.promptDismiss}
                              onPress={() => {
                                LayoutAnimation.configureNext(PROMPT_EXPAND_ANIMATION);
                                setActivePrompt(null);
                              }}
                              hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
                            >
                              <Text style={styles.promptDismissText}>✕</Text>
                            </TouchableOpacity>
                          )}
                          {isActive && (
                            <>
                              <View style={styles.promptInputContainer}>
                                <TextInput
                                  ref={promptInputRef}
                                  style={[
                                    styles.promptInputInner,
                                    { height: promptInputHeight },
                                  ]}
                                  placeholder="Enter response here"
                                  placeholderTextColor="rgba(234,246,255,0.35)"
                                  value={promptAnswer}
                                  maxLength={100}
                                  onKeyPress={({ nativeEvent }) => {
                                    if (
                                      nativeEvent.key === "Enter" &&
                                      promptAnswer.includes("\n")
                                    ) {
                                      blockNextNewline.current = true;
                                    }
                                  }}
                                  onChangeText={(text) => {
                                    if (blockNextNewline.current) {
                                      blockNextNewline.current = false;
                                      promptInputRef.current?.setNativeProps({
                                        text: promptAnswer,
                                      });
                                      return;
                                    }
                                    const firstNl = text.indexOf("\n");
                                    const cleaned =
                                      firstNl !== -1
                                        ? text.slice(0, firstNl + 1) +
                                          text
                                            .slice(firstNl + 1)
                                            .replace(/\n/g, "")
                                        : text;
                                    setPromptAnswer(cleaned);
                                  }}
                                  onContentSizeChange={(e) =>
                                    setPromptInputHeight(
                                      Math.max(
                                        40,
                                        e.nativeEvent.contentSize.height,
                                      ),
                                    )
                                  }
                                  multiline
                                  autoFocus
                                />
                              </View>
                              <View style={styles.promptFooter}>
                                {promptAnswer.length >= 100 ? (
                                  <Text style={styles.promptCharCount}>
                                    Character limit reached
                                  </Text>
                                ) : (
                                  <View />
                                )}
                                <TouchableOpacity onPress={savePromptAnswer}>
                                  <Text style={styles.promptSaveText}>
                                    Save answer
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  },
                )}
                {!showAllPrompts && (
                  <Animated.View style={{ opacity: seeMoreOpacity }}>
                    <TouchableOpacity
                      onPress={() => setShowAllPrompts(true)}
                      onPressIn={() =>
                        Animated.timing(seeMoreOpacity, {
                          toValue: 1,
                          duration: 120,
                          useNativeDriver: true,
                        }).start()
                      }
                      onPressOut={() =>
                        Animated.timing(seeMoreOpacity, {
                          toValue: 0.75,
                          duration: 200,
                          useNativeDriver: true,
                        }).start()
                      }
                      activeOpacity={1}
                    >
                      <Text style={styles.seeMore}>See more prompts</Text>
                    </TouchableOpacity>
                  </Animated.View>
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
                  {cat.interests.map((interest) => (
                    <InterestChip
                      key={interest}
                      label={interest}
                      selected={data.interests.includes(interest)}
                      onPress={() => toggleInterest(interest)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        );

      // Step 12 — Location
      case 12:
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

      // Step 13 — Profile Preview
      case 13: {
        const previewAge = (() => {
          if (!data.birthday) return 0;
          const birth = new Date(data.birthday);
          if (isNaN(birth.getTime())) return 0;
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
          return age;
        })();

        const previewPhotos = data.photos.filter(Boolean);

        return (
          <View style={styles.stepContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              <Text style={styles.stepTitle}>How's your profile looking?</Text>
              <Text style={styles.stepSubtitle}>
                Take a quick look before you jump in.
              </Text>

              {/* 1. Photo hero */}
              <View style={styles.previewCardWrapper}>
                {previewPhotos.length > 0 ? (
                  <>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      scrollEventThrottle={16}
                      onMomentumScrollEnd={(e) => {
                        const page = Math.round(
                          e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                        );
                        setPreviewPhotoIndex(page);
                      }}
                    >
                      {previewPhotos.map((uri, i) => (
                        <Image
                          key={i}
                          source={{ uri }}
                          style={[styles.previewHeroImage, { width: SCREEN_WIDTH }]}
                        />
                      ))}
                    </ScrollView>
                    {previewPhotos.length > 1 && (
                      <View style={styles.previewPhotoDots}>
                        {previewPhotos.map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.previewPhotoDot,
                              i === previewPhotoIndex && styles.previewPhotoDotActive,
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.previewHeroPlaceholder}>
                    <Text style={styles.previewHeroInitial}>
                      {data.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* 2. Name + identity pills */}
              <View style={styles.previewIdentityBlock}>
                <Text style={styles.previewName}>
                  {data.name}
                  {previewAge > 0 && (
                    <Text style={styles.previewAge}>, {previewAge}</Text>
                  )}
                </Text>
                <View style={styles.previewPillRow}>
                  {data.gender ? (
                    <View style={styles.previewIdentityPill}>
                      <Text style={styles.previewIdentityPillText}>
                        {data.gender}
                      </Text>
                    </View>
                  ) : null}
                  {data.datingIntent ? (
                    <View style={styles.previewIdentityPill}>
                      <Text style={styles.previewIdentityPillText}>
                        {data.datingIntent}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* 3. Prompts — lightweight, max 2 */}
              <TouchableOpacity
                style={styles.previewEditableSection}
                onPress={() => enterEditSection("prompts")}
                activeOpacity={0.75}
              >
                <View style={styles.previewSectionHeader}>
                  <Text style={styles.previewSectionLabel}>Prompts</Text>
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={13}
                    color="rgba(234,246,255,0.22)"
                  />
                </View>
                {data.prompts.slice(0, 3).map((p, i) => (
                  <View
                    key={i}
                    style={[
                      styles.previewPromptRow,
                      { marginBottom: i < data.prompts.slice(0, 3).length - 1 ? 36 : 8 },
                    ]}
                  >
                    <Text style={styles.previewPromptQ} numberOfLines={1}>
                      {p.prompt}
                    </Text>
                    <Text style={styles.previewPromptA} numberOfLines={2}>
                      {p.answer}
                    </Text>
                  </View>
                ))}
                {justEditedSection === "prompts" && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      styles.previewSectionGlow,
                      { opacity: sectionHighlightAnim },
                    ]}
                  />
                )}
              </TouchableOpacity>

              {/* 4. Interests — pills only, max 6 */}
              {data.interests.length > 0 && (
                <TouchableOpacity
                  style={[styles.previewEditableSection, { marginTop: 52, marginBottom: 40 }]}
                  onPress={() => enterEditSection("interests")}
                  activeOpacity={0.75}
                >
                  <View style={styles.previewSectionHeader}>
                    <Text style={styles.previewSectionLabel}>Interests</Text>
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={13}
                      color="rgba(234,246,255,0.22)"
                    />
                  </View>
                  <View style={[styles.previewPillRow, { gap: 12 }]}>
                    {data.interests.slice(0, 6).map((interest) => (
                      <View key={interest} style={styles.previewPill}>
                        <Text style={styles.previewPillText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                  {justEditedSection === "interests" && (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        StyleSheet.absoluteFill,
                        styles.previewSectionGlow,
                        { opacity: sectionHighlightAnim },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              )}

              {/* 5. Lifestyle + Work — human-readable phrases */}
              {(() => {
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
                const phraseItems = [
                  data.lifestyle.drink && { icon: "glass-wine" as const, text: DRINK_LABEL[data.lifestyle.drink] },
                  data.lifestyle.smoke && { icon: "smoking" as const, text: SMOKE_LABEL[data.lifestyle.smoke] },
                  data.lifestyle.workout && { icon: "dumbbell" as const, text: WORKOUT_LABEL[data.lifestyle.workout] },
                  data.career.school &&
                    data.career.school !== "No" && { icon: "school" as const, text: SCHOOL_LABEL[data.career.school] },
                  data.career.work && { icon: "briefcase" as const, text: WORK_LABEL[data.career.work] },
                ].filter(Boolean) as { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }[];

                if (!phraseItems.length) return null;
                return (
                  <TouchableOpacity
                    style={styles.previewEditableSection}
                    onPress={() => enterEditSection("lifestyle")}
                    activeOpacity={0.75}
                  >
                    <View style={styles.previewSectionHeader}>
                      <Text style={styles.previewSectionLabel}>Lifestyle</Text>
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={13}
                        color="rgba(234,246,255,0.22)"
                      />
                    </View>
                    <View style={{ marginBottom: 8 }}>
                      {phraseItems.map((item, i) => (
                        <View key={i} style={styles.previewPhraseRow}>
                          <MaterialCommunityIcons
                            name={item.icon}
                            size={14}
                            color="rgba(234,246,255,0.32)"
                          />
                          <Text style={styles.previewPhrase}>{item.text}</Text>
                        </View>
                      ))}
                    </View>
                    {justEditedSection === "lifestyle" && (
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          StyleSheet.absoluteFill,
                          styles.previewSectionGlow,
                          { opacity: sectionHighlightAnim },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })()}

            </ScrollView>
          </View>
        );
      }

      // Step 14 — Orbit explanation
      case 14:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Welcome to COMET.</Text>

            <Text style={styles.orbitExplain}>COMET is built around one idea:</Text>

            <Text style={styles.orbitCoreIdea}>One match at a time.</Text>

            <Text style={styles.orbitBody}>
              If you're interested in someone, send them a{" "}
              <Text style={styles.orbitHighlight}>Signal</Text>.
            </Text>

            <Text style={styles.orbitBody}>
              When you and someone both signal each other, a{" "}
              <Text style={styles.orbitHighlight}>Collision</Text> occurs.
            </Text>

            <Text style={styles.orbitBody}>
              You enter <Text style={styles.orbitHighlight}>Orbit</Text> — an
              exclusive chat phase where discovery pauses and you focus on one
              connection.
            </Text>

            <Text style={styles.orbitDrift}>
              You can <Text style={styles.orbitHighlight}>Drift</Text> anytime.{" "}
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
  const isLocationStep = step === 12;

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
        <LinearGradient
          colors={["#2A7DE1", "#3CF6D5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.progressFill,
            { width: `${((step + 1) / TOTAL_STEPS) * 100}%` },
          ]}
        />
      </View>

      {/* Back button */}
      <TouchableOpacity
        onPress={
          editingSection !== null
            ? cancelEditSection
            : step === 0
            ? () => router.replace("/(auth)/signup")
            : prevStep
        }
        style={styles.backButton}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* Step content */}
      <Animated.View
        style={[
          styles.content,
          { opacity: stepOpacity, transform: [{ translateY: stepTranslateY }] },
        ]}
      >
        {renderStep()}
      </Animated.View>

      {/* Next / Finish button — hidden on location step and during section editing */}
      {!isLocationStep && editingSection === null && (
        <Button
          variant="primary"
          label={isLastStep ? "Let's go" : "Continue"}
          onPress={isLastStep ? saveProfile : handleContinue}
          loading={saving}
          disabled={!canAdvance() || saving}
          style={{ marginTop: isLastStep ? 28 : 16 }}
        />
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
    height: 2,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 24,
  },
  progressFill: {
    height: 2,
    borderRadius: 2,
    shadowColor: "#3CF6D5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 3,
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
  nameError: {
    color: "#FFB347",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    marginTop: 6,
  },
  input: {
    backgroundColor: "rgba(15,42,68,0.5)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 14,
    color: "#EAF6FF",
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
    marginBottom: 16,
  },
  agePreview: {
    color: "rgba(234,246,255,0.3)",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
    textAlign: "center",
    marginTop: 16,
  },
  ageRangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 24,
    marginTop: 8,
  },
  ageRangeLabel: {
    fontSize: 20,
    fontFamily: "Montserrat-Bold",
    color: "#fff",
  },
  sliderContainer: {
    marginHorizontal: 4,
  },
  distanceValue: {
    color: "#fff",
    fontSize: 25,
    fontFamily: "Montserrat-Bold",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  distanceLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  distanceLabelText: {
    color: "#6A8FAF",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#fff",
    shadowColor: "#3CF6D5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 7,
    elevation: 5,
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
    backgroundColor: "#0d1f33",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  optionSelected: {
    borderColor: "rgba(60,246,213,0.35)",
    backgroundColor: "rgba(42,125,225,0.12)",
    shadowColor: "#3CF6D5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 7,
    elevation: 2,
  },
  optionText: {
    color: "#aaa",
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
  },
  optionTextSelected: {
    color: "#EAF6FF",
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
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "solid",
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
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "solid",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  photoSecondaryImage: {
    width: "100%",
    height: "100%",
  },
  photoLiveGlow: {
    borderColor: "#3CF6D5",
    borderWidth: 1.5,
    shadowColor: "#3CF6D5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  addPhotoPlus: {
    color: "#EAF6FF",
    fontSize: 24,
    fontFamily: "Montserrat-Regular",
    lineHeight: 28,
  },
  addPhotoLabel: {
    color: "rgba(234,246,255,0.7)",
    fontSize: 11,
    fontFamily: "Montserrat-Regular",
    marginTop: 2,
  },
  removePhoto: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  verifiedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(60,246,213,0.13)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(60,246,213,0.35)",
  },
  verifiedBadgeText: {
    color: "#3CF6D5",
    fontSize: 10,
    fontFamily: "Montserrat-Bold",
  },
  removePhotoText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
  },
  lifestyleQuestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  lifestyleQuestionText: {
    color: "#EAF6FF",
    fontSize: 15,
    fontFamily: "Montserrat-Bold",
  },
  lifestyleOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  lifestyleOptionWrapper: {
    flex: 1,
  },
  lifestyleOptionSelectedGlow: {
    shadowColor: "#3CF6D5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 4,
  },
  lifestyleOptionGradientBorder: {
    flex: 1,
    borderRadius: 30,
    padding: 1.5,
  },
  lifestyleOptionInner: {
    flex: 1,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a1929",
  },
  lifestyleOption: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "transparent",
    alignItems: "center",
  },
  lifestyleOptionLabel: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  lifestyleOptionText: {
    color: "#6A8FAF",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
  },
  lifestyleOptionTextSelected: {
    color: "#EAF6FF",
  },
  lifestyleDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 24,
  },
  livePhotoSubtext: {
    color: "#6A8FAF",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 4,
  },
  photoSheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  photoSheet: {
    marginHorizontal: 16,
    marginBottom: 40,
    backgroundColor: "rgba(15,42,68,0.95)",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  photoSheetCancel: {
    color: "#6A8FAF",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
  },
  photoSheetOption: {
    paddingVertical: 18,
    alignItems: "center",
  },
  photoSheetOptionText: {
    color: "#EAF6FF",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
  },
  photoSheetDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  photoSheetVerified: {
    color: "#3CF6D5",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
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
    color: "#fff",
    fontSize: 12,
    fontFamily: "Montserrat-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  answeredPrompt: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(60,246,213,0.25)",
    backgroundColor: "rgba(42,125,225,0.07)",
    shadowColor: "#3CF6D5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  answeredBadge: {
    color: "rgba(60,246,213,0.45)",
    fontSize: 10,
    fontFamily: "Montserrat-Bold",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  answeredPromptLabel: {
    color: "#EAF6FF",
    fontSize: 12,
    fontFamily: "Montserrat-Bold",
    marginBottom: 4,
  },
  answeredPromptAnswer: {
    color: "rgba(234,246,255,0.85)",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
    marginBottom: 8,
  },
  removeText: {
    color: "rgba(234,246,255,0.5)",
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
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Montserrat-Bold",
    marginBottom: 10,
  },
  promptDismiss: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  promptDismissText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
  },
  promptFooter: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginTop: 10,
    gap: 6,
  },
  promptCharCount: {
    color: "rgba(234,246,255,0.5)",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
  },
  promptSaveText: {
    color: "#3CF6D5",
    fontSize: 13,
    fontFamily: "Montserrat-Bold",
    textAlign: "center",
    marginTop: 10,
    opacity: 0.78,
  },
  promptInputContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
    marginTop: 14,
    marginBottom: 4,
  },
  promptInputInner: {
    borderRadius: 7,
    padding: 10,
    color: "#EAF6FF",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
  },
  promptInput: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
    minHeight: 80,
    marginBottom: 12,
  },
  promptOption: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(15,42,68,0.6)",
  },
  promptOptionActive: {
    borderWidth: 1,
    borderColor: "rgba(60,246,213,0.35)",
    backgroundColor: "rgba(42,125,225,0.12)",
    shadowColor: "#3CF6D5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 3,
  },
  promptOptionUsed: {
    opacity: 0.3,
  },
  promptOptionText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Montserrat-Bold",
  },
  seeMore: {
    color: "#3CF6D5",
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
  interestChip: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "#0a1929",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  interestChipGradientBorder: {
    flex: 1,
    borderRadius: 30,
    padding: 1.5,
  },
  interestChipInner: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "#0a1929",
  },
  interestChipText: {
    color: "#6A8FAF",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
  },
  interestChipTextSelected: {
    color: "#EAF6FF",
  },
  orbitExplain: {
    color: "rgba(234,246,255,0.7)",
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
    lineHeight: 26,
    marginBottom: 10,
  },
  orbitCoreIdea: {
    color: "#EAF6FF",
    fontSize: 22,
    fontFamily: "Montserrat-Bold",
    lineHeight: 30,
    marginBottom: 28,
  },
  orbitHighlight: {
    color: "#4DA3FF",
    fontFamily: "Montserrat-Bold",
  },
  orbitBody: {
    color: "rgba(234,246,255,0.75)",
    fontSize: 16,
    fontFamily: "Montserrat-Regular",
    lineHeight: 26,
    marginBottom: 16,
  },
  orbitDrift: {
    color: "rgba(234,246,255,0.45)",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 24,
  },
  previewCardWrapper: {
    marginHorizontal: -24,
    marginBottom: 36,
    borderRadius: 16,
    overflow: "hidden",
  },
  previewHeroImage: {
    width: "100%",
    aspectRatio: 4 / 5,
    resizeMode: "cover",
  },
  previewPhotoDots: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  previewPhotoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  previewPhotoDotActive: {
    width: 18,
    backgroundColor: "#fff",
  },
  previewHeroPlaceholder: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: "#0d1f33",
    alignItems: "center",
    justifyContent: "center",
  },
  previewHeroInitial: {
    fontSize: 72,
    color: "#2A7DE1",
    fontFamily: "Montserrat-Bold",
  },
  previewIdentityBlock: {
    marginBottom: 36,
  },
  previewName: {
    color: "#EAF6FF",
    fontSize: 30,
    fontFamily: "Montserrat-Bold",
    marginBottom: 14,
  },
  previewAge: {
    color: "rgba(234,246,255,0.72)",
    fontSize: 30,
    fontFamily: "Montserrat-Regular",
  },
  previewIdentityPill: {
    backgroundColor: "rgba(60,246,213,0.05)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(60,246,213,0.12)",
  },
  previewIdentityPillText: {
    color: "#CFE9FF",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
  },
  previewDetails: {
    marginBottom: 4,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewLabel: {
    color: "rgba(234,246,255,0.45)",
    fontSize: 11,
    fontFamily: "Montserrat-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  previewValue: {
    color: "#EAF6FF",
    fontSize: 15,
    fontFamily: "Montserrat-Regular",
    lineHeight: 22,
  },
  previewPromptQ: {
    color: "rgba(234,246,255,0.26)",
    fontSize: 11,
    fontFamily: "Montserrat-Regular",
    marginBottom: 10,
  },
  previewPromptA: {
    color: "#EAF6FF",
    fontSize: 18,
    fontFamily: "Montserrat-Regular",
    lineHeight: 26,
  },
  previewEditBtn: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 24,
  },
  previewEditText: {
    color: "#3CF6D5",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
    opacity: 0.7,
  },
  previewPromptRow: {
    marginBottom: 0,
  },
  previewInfoRow: {
    marginBottom: 10,
  },
  previewInfoLabel: {
    color: "rgba(234,246,255,0.62)",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
  },
  previewInfoValue: {
    color: "#EAF6FF",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
  },
  previewPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  previewPill: {
    backgroundColor: "rgba(60,246,213,0.03)",
    borderWidth: 1,
    borderColor: "rgba(60,246,213,0.09)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  previewPillText: {
    color: "#EAF6FF",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
  },
  previewPhraseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 7,
  },
  previewPhrase: {
    color: "rgba(234,246,255,0.62)",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
  },
  previewEditableSection: {
    position: "relative",
    marginBottom: 8,
  },
  previewSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  previewSectionLabel: {
    color: "rgba(234,246,255,0.28)",
    fontSize: 10,
    fontFamily: "Montserrat-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  previewSectionGlow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(60,246,213,0.28)",
    backgroundColor: "rgba(60,246,213,0.03)",
  },
  editScreenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  editCounter: {
    color: "rgba(234,246,255,0.45)",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
    paddingBottom: 6,
  },
  editActions: {
    paddingTop: 16,
    gap: 4,
  },
  editCancelButton: {
    alignItems: "center",
    paddingVertical: 14,
  },
  editCancelText: {
    color: "rgba(234,246,255,0.38)",
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
  },
});
