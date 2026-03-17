import PolicyScreen from "@/components/PolicyScreen";

const sections = [
  {
    body: "Welcome to COMET. These Terms of Service govern your access to and use of the COMET mobile application, website, and related services. By creating an account or using COMET, you agree to these Terms. If you do not agree, you may not use the Service.",
  },
  {
    heading: "1. Eligibility",
    body: "COMET is intended only for adults. By using the Service, you represent and warrant that you are at least 18 years old, are legally permitted to use the Service, and will comply with these Terms and all applicable laws.\n\nAccounts belonging to users under 18 will be removed.",
  },
  {
    heading: "2. Account Registration",
    body: "To use COMET, you must create an account. You agree to provide accurate and truthful information, maintain the confidentiality of your account credentials, and accept responsibility for activity occurring under your account.\n\nYou may not impersonate another person or create accounts for others.",
  },
  {
    heading: "3. User Conduct",
    body: "You agree not to use COMET to harass, threaten, or intimidate other users; post abusive, hateful, or discriminatory content; share sexually explicit or pornographic content; engage in scams, fraud, or solicitation; promote illegal activities; or upload content that violates intellectual property rights.\n\nCOMET reserves the right to remove content or suspend accounts violating these rules.",
  },
  {
    heading: "4. User Content",
    body: "Users may upload profile photos, text prompts, interests, and messages. You retain ownership of your content but grant COMET a non-exclusive, worldwide, royalty-free license to display and distribute that content within the Service.\n\nYou are responsible for the content you upload.",
  },
  {
    heading: "5. Moderation",
    body: "COMET may monitor content and interactions within the Service. We reserve the right to remove content, restrict accounts, and suspend or terminate users if activity violates these Terms or harms the community.",
  },
  {
    heading: "6. Matches and Interactions",
    body: "COMET facilitates introductions between users but does not guarantee compatibility or behavior of any user. Users are responsible for their own interactions and decisions.",
  },
  {
    heading: "7. Safety Disclaimer",
    body: "COMET does not conduct criminal background checks on users. You agree that you are responsible for your own safety, COMET is not responsible for user behavior, and you should exercise caution when interacting with others.",
  },
  {
    heading: "8. Termination",
    body: "Users may delete their accounts at any time. COMET may suspend or terminate accounts that violate these Terms or harm the Service.",
  },
  {
    heading: "9. Limitation of Liability",
    body: "To the fullest extent permitted by law, COMET and its operators shall not be liable for indirect or consequential damages, loss of data or profits, or disputes or interactions between users.\n\nUse of the Service is at your own risk.",
  },
  {
    heading: "10. Changes to Terms",
    body: "COMET may update these Terms periodically. Continued use of the Service after changes constitutes acceptance of the updated Terms.",
  },
];

export default function Terms() {
  return (
    <PolicyScreen
      title="Terms of Service"
      updated="March 2026"
      sections={sections}
    />
  );
}
