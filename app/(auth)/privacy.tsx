import PolicyScreen from "@/components/PolicyScreen";

const sections = [
  {
    body: "This Privacy Policy explains how COMET collects, uses, and protects user information.",
  },
  {
    heading: "1. Information We Collect",
    body: "Account Information: When you create an account we may collect your name, email address, profile photos, profile prompts, dating preferences, and interests.\n\nUsage Information: We may collect information about how users interact with the Service, including matches, messages, and interactions with features.\n\nDevice Information: We may collect device type, operating system, and IP address.\n\nThird-Party Authentication: If you sign in using services like Google, we may receive basic profile information associated with your account.",
  },
  {
    heading: "2. How We Use Information",
    body: "We use collected information to create and maintain user accounts, enable matching and messaging, improve the Service, monitor safety and prevent abuse, and communicate updates and support.",
  },
  {
    heading: "3. Data Sharing",
    body: "COMET does not sell personal data. Information may be shared with service providers necessary to operate the Service, legal authorities when required by law, and safety and fraud prevention services.",
  },
  {
    heading: "4. User Profile Visibility",
    body: "Information you place in your profile may be visible to other users of COMET. You should not share sensitive personal information in your profile.",
  },
  {
    heading: "5. Data Security",
    body: "COMET implements reasonable security measures to protect user information. However, no system can guarantee absolute security.",
  },
  {
    heading: "6. Account Deletion",
    body: "Users may delete their accounts at any time. Deleting an account may remove associated profile information and content.",
  },
  {
    heading: "7. Policy Updates",
    body: "This Privacy Policy may be updated periodically. Continued use of the Service indicates acceptance of the updated policy.",
  },
  {
    heading: "8. Contact",
    body: "Questions about privacy may be sent to: support@comet.app",
  },
];

export default function Privacy() {
  return (
    <PolicyScreen
      title="Privacy Policy"
      updated="March 2026"
      sections={sections}
    />
  );
}
