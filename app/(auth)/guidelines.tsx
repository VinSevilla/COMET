import PolicyScreen from "@/components/PolicyScreen";

const sections = [
  {
    body: "COMET is designed to foster respectful and meaningful connections. Users must follow these guidelines when using the Service.",
  },
  {
    heading: "Respect Other Users",
    body: "Treat others with respect. Harassment, bullying, or threats are not allowed under any circumstances.",
  },
  {
    heading: "No Hate Speech",
    body: "Content that promotes hatred, discrimination, or violence based on race, ethnicity, religion, gender, sexual orientation, disability, or any other identity is strictly prohibited.",
  },
  {
    heading: "No Explicit Sexual Content",
    body: "Pornographic or sexually explicit content is not permitted on COMET.",
  },
  {
    heading: "No Scams or Solicitation",
    body: "Users may not request money, promote financial schemes, or advertise products or services through COMET.",
  },
  {
    heading: "Authentic Profiles",
    body: "Users should represent themselves honestly. Impersonation, fake identities, or misleading profile information is prohibited.",
  },
  {
    heading: "Reporting Violations",
    body: "Users can report profiles or behavior that violate these guidelines. COMET may review and take action including removing content or suspending accounts.",
  },
];

export default function Guidelines() {
  return (
    <PolicyScreen
      title="Community Guidelines"
      updated="March 2026"
      sections={sections}
    />
  );
}
