import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) {
      setHasProfile(null);
      return;
    }

    supabase
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setHasProfile(!!data);
      });
  }, [session]);

  if (loading) return null;

  // Logged in + has profile → go to main app
  if (session && hasProfile === true) {
    return <Redirect href="/(tabs)" />;
  }

  // All other cases (not logged in, or logged in but no profile yet)
  // just render the auth stack and let the screens handle navigation
  return <Stack screenOptions={{ headerShown: false }} />;
}
