// @ts-nocheck
import { createServerClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

export default async function AuthCallbackPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existing } = await supabase.from("profiles").select("id").eq("id", user.id).single();
    if (!existing) {
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email ?? "",
        full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "",
        role: "employee",
      });
    }
  }

  redirect("/audit");
}
