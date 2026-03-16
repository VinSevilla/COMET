import { useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

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

// ─── Types ───────────────────────────────────────────────────────────────────

type PromptEntry = { prompt: string; answer: string };

type OnboardingData = {
  name: string;
  birthday: string;
  gender: string;
  lookingFor: string;
  photos: string[];
  prompts: PromptEntry[];
  interests: string[];
  datingIntent: string;
  locationLat: number | null;
  locationLng: number | null;
};

const TOTAL_STEPS = 10;

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [suggestedPrompts] = useState<string[]>(getSuggestedPrompts());
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [promptAnswer, setPromptAnswer] = useState("");

  const [data, setData] = useState<OnboardingData>({
    name: "",
    birthday: "",
    gender: "",
    lookingFor: "",
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

  function prevStep() {
    setStep((s) => s - 1);
  }

  // ─── Photo Picker ──────────────────────────────────────────────────────────

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photos to add profile pictures.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      update({ photos: [...data.photos, result.assets[0].uri] });
    }
  }

  function removePhoto(index: number) {
    update({ photos: data.photos.filter((_, i) => i !== index) });
  }

  // ─── Location ─────────────────────────────────────────────────────────────

  async function requestLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      nextStep();
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
    update({ prompts: [...data.prompts, { prompt: activePrompt, answer: promptAnswer.trim() }] });
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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

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
      case 0: return data.name.trim().length > 0;
      case 1: return data.birthday.trim().length > 0;
      case 2: return data.gender !== "";
      case 3: return data.lookingFor !== "";
      case 4: return true; // location — always can skip
      case 5: return data.photos.length > 0;
      case 6: return data.prompts.length >= 2;
      case 7: return data.interests.length > 0;
      case 8: return data.datingIntent !== "";
      case 9: return true;
      default: return true;
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
            <Text style={styles.stepSubtitle}>This is how you'll appear to others.</Text>
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
            <Text style={styles.stepTitle}>When's your birthday?</Text>
            <Text style={styles.stepSubtitle}>Your age will be shown on your profile.</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#555"
              value={data.birthday}
              onChangeText={(v) => update({ birthday: v })}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        );

      // Step 2 — Gender
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>How do you identify?</Text>
            {["Man", "Woman", "Non-binary", "Prefer not to say"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.optionButton, data.gender === g && styles.optionSelected]}
                onPress={() => update({ gender: g })}
              >
                <Text style={[styles.optionText, data.gender === g && styles.optionTextSelected]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      // Step 3 — Who they want to see
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Who do you want to see?</Text>
            {["Men", "Women", "Everyone"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.optionButton, data.lookingFor === g && styles.optionSelected]}
                onPress={() => update({ lookingFor: g })}
              >
                <Text style={[styles.optionText, data.lookingFor === g && styles.optionTextSelected]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      // Step 4 — Location
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Enable location?</Text>
            <Text style={styles.stepSubtitle}>
              We use your location to show you people nearby. You can skip this.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={requestLocation}>
              <Text style={styles.primaryButtonText}>Allow Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={nextStep}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        );

      // Step 5 — Photos
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Add your photos</Text>
            <Text style={styles.stepSubtitle}>Add at least 1 photo. Up to 6.</Text>
            <View style={styles.photoGrid}>
              {data.photos.map((uri, i) => (
                <View key={i} style={styles.photoSlot}>
                  <Image source={{ uri }} style={styles.photo} />
                  <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(i)}>
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {data.photos.length < 6 && (
                <TouchableOpacity style={styles.addPhotoSlot} onPress={pickPhoto}>
                  <Text style={styles.addPhotoText}>+</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      // Step 6 — Prompts
      case 6:
        return (
          <ScrollView style={styles.scrollStep} showsVerticalScrollIndicator={false}>
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
                <TouchableOpacity style={styles.primaryButton} onPress={savePromptAnswer}>
                  <Text style={styles.primaryButtonText}>Save Answer</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Suggested prompts */}
            {data.prompts.length < 3 && !activePrompt && (
              <>
                <Text style={styles.sectionLabel}>Suggested for you</Text>
                {(showAllPrompts ? ALL_PROMPTS : suggestedPrompts).map((prompt) => {
                  const already = data.prompts.find((p) => p.prompt === prompt);
                  return (
                    <TouchableOpacity
                      key={prompt}
                      style={[styles.promptOption, already && styles.promptOptionUsed]}
                      onPress={() => !already && selectPrompt(prompt)}
                      disabled={!!already}
                    >
                      <Text style={styles.promptOptionText}>{prompt}</Text>
                    </TouchableOpacity>
                  );
                })}
                {!showAllPrompts && (
                  <TouchableOpacity onPress={() => setShowAllPrompts(true)}>
                    <Text style={styles.seeMore}>See more prompts</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        );

      // Step 7 — Interests
      case 7:
        return (
          <ScrollView style={styles.scrollStep} showsVerticalScrollIndicator={false}>
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
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
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

      // Step 8 — Dating intent
      case 8:
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
                style={[styles.optionButton, data.datingIntent === intent && styles.optionSelected]}
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

      // Step 9 — Orbit explanation
      case 9:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Welcome to COMET.</Text>
            <Text style={styles.orbitExplain}>
              COMET is built around one idea:{"\n\n"}
              <Text style={styles.orbitHighlight}>one match at a time.</Text>
            </Text>
            <Text style={styles.orbitBody}>
              When you and someone both signal each other, a{" "}
              <Text style={styles.orbitHighlight}>Collision</Text> occurs.{"\n\n"}
              You enter <Text style={styles.orbitHighlight}>Orbit</Text> — an exclusive chat phase
              where discovery pauses and you focus on one connection.{"\n\n"}
              You can <Text style={styles.orbitHighlight}>Drift</Text> anytime. No pressure.
            </Text>
          </View>
        );

      default:
        return null;
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const isLastStep = step === TOTAL_STEPS - 1;
  const isLocationStep = step === 4;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
      </View>

      {/* Back button */}
      {step > 0 && (
        <TouchableOpacity onPress={prevStep} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      )}

      {/* Step content */}
      <View style={styles.content}>{renderStep()}</View>

      {/* Next / Finish button — hidden on location step (it handles its own nav) */}
      {!isLocationStep && (
        <TouchableOpacity
          style={[styles.nextButton, !canAdvance() && styles.nextButtonDisabled]}
          onPress={isLastStep ? saveProfile : nextStep}
          disabled={!canAdvance() || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>{isLastStep ? "Let's go" : "Continue"}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
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
  },
  backArrow: {
    fontSize: 24,
    color: "#fff",
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
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: "#888",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
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
  },
  optionTextSelected: {
    color: "#2A7DE1",
    fontWeight: "bold",
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
    fontWeight: "bold",
  },
  skipButton: {
    alignItems: "center",
    padding: 12,
  },
  skipText: {
    color: "#555",
    fontSize: 14,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  photoSlot: {
    width: 100,
    height: 133,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  removePhoto: {
    position: "absolute",
    top: 4,
    right: 4,
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
  },
  addPhotoSlot: {
    width: 100,
    height: 133,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
    borderStyle: "dashed",
  },
  addPhotoText: {
    color: "#555",
    fontSize: 32,
  },
  sectionLabel: {
    color: "#555",
    fontSize: 12,
    fontWeight: "bold",
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
    marginBottom: 4,
  },
  answeredPromptAnswer: {
    color: "#fff",
    fontSize: 15,
    marginBottom: 8,
  },
  removeText: {
    color: "#e85d4a",
    fontSize: 13,
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
    marginBottom: 10,
  },
  promptInput: {
    color: "#fff",
    fontSize: 15,
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
  },
  seeMore: {
    color: "#2A7DE1",
    fontSize: 14,
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
  },
  chipTextSelected: {
    color: "#2A7DE1",
  },
  orbitExplain: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 20,
  },
  orbitHighlight: {
    color: "#2A7DE1",
    fontWeight: "bold",
  },
  orbitBody: {
    color: "#888",
    fontSize: 16,
    lineHeight: 26,
  },
  nextButton: {
    backgroundColor: "#2A7DE1",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  nextButtonDisabled: {
    opacity: 0.3,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
