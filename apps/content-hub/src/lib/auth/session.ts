// @ts-nocheck
import { createServerClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

let cachedClient: ReturnType<typeof createServerClient> | null = null;
function getSupabase() {
  if (!cachedClient) cachedClient = createServerClient();
  return cachedClient;
}

export async function getCurrentUser() {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentProfile() {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getUser();
    if (!data.user?.id) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    return profile ?? null;
  } catch {
    return null;
  }
}
