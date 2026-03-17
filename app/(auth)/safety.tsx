import PolicyScreen from "@/components/PolicyScreen";

const sections = [
  {
    body: "Your safety is important when meeting people online. Please read these guidelines carefully.",
  },
  {
    heading: "Protect Personal Information",
    body: "Avoid sharing sensitive information such as your home address, financial information, or workplace details until you have established trust with someone.",
  },
  {
    heading: "Meet in Public",
    body: "If meeting someone from COMET in person, always choose a public location, tell a friend or family member where you are going, and arrange your own transportation.",
  },
  {
    heading: "Trust Your Instincts",
    body: "If something feels uncomfortable or too good to be true, stop communication and report the user. Your gut is a valuable safety tool.",
  },
  {
    heading: "Report Suspicious Behavior",
    body: "Report users who request money, behave aggressively, or attempt scams. COMET will review all reports and take appropriate action.",
  },
];

export default function Safety() {
  return (
    <PolicyScreen
      title="Safety Guidelines"
      updated="March 2026"
      sections={sections}
    />
  );
}
