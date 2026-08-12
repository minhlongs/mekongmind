"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Session = {
  login: string;
  name: string | null;
  avatar_url: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const raw =
        document.cookie
          .split("; ")
          .find((c) => c.startsWith("ultracode_session="))
          ?.split("=")[1];
      if (!raw) { setSession(null); return; }
      const payload = JSON.parse(atob(raw.split(".")[1]));
      setSession({ login: payload.login, name: payload.name, avatar_url: payload.avatar_url });
    } catch { setSession(null); }
  }, []);

  if (!session) {
    router.replace("/auth/github");
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-16">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-sm text-[#787880]">
        Manage your account, API keys, and preferences.
      </p>
      <div className="mt-12 rounded-xl border-2 border-dashed border-[var(--border)] p-12 text-center">
        <p className="text-sm font-semibold">Coming soon</p>
        <p className="mt-1 text-xs text-[#787880]">
          Account settings and configuration will be available in an upcoming release.
        </p>
      </div>
    </div>
  );
}
