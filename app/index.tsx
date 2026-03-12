import { Redirect } from "expo-router";
import { useState } from "react";

export default function Index() {
  const [isLoggedIn] = useState(false); // toggle to true to test tab navigation

  return <Redirect href={isLoggedIn ? "/(tabs)" : "/(auth)/welcome"} />;
}
