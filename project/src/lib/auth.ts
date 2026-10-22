import { supabase } from "./supabase";
import type { AppUser } from "./types";

export async function signUp(name: string, email: string, password: string) {
  if (!supabase) {
    throw new Error("Authentication is not configured. Add your Supabase environment variables.");
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signIn(email: string, password: string) {
  if (!supabase) {
    throw new Error("Authentication is not configured. Add your Supabase environment variables.");
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  if (!supabase) {
    throw new Error("Authentication is not configured.");
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function requestPasswordReset(email: string) {
  if (!supabase) {
    throw new Error("Authentication is not configured.");
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(newPassword: string) {
  if (!supabase) {
    throw new Error("Authentication is not configured.");
  }
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  return data;
}

export async function getProfile(userId: string): Promise<AppUser | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  return {
    id: data.id,
    email: "",
    display_name: data.display_name || "",
    avatar_url: data.avatar_url,
  };
}

export async function ensureProfile(userId: string, displayName: string) {
  if (!supabase) return;
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!data) {
    await supabase.from("profiles").insert({
      id: userId,
      display_name: displayName,
    });
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
