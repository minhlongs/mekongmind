"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const IconGithub = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.333-1.723-1.333-1.723-1.089-.73.083-.716.083-.716 1.205.083 1.838 1.215 1.838 1.215 1.07 1.802 2.807 1.281 3.492.98.108-.763.418-1.282.762-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.228-3.166-.123-.297-.532-1.497.117-3.12 0 0 1.001-.314 3.28 1.209A11.52 11.52 0 0 1 12 7.866c1.023.005 2.047.133 3.005.394 2.278-1.523 3.277-1.209 3.277-1.209.65 1.623.242 2.823.119 3.12.766.827 1.226 1.879 1.226 3.166 0 4.53-2.807 5.529-5.477 5.818.43.364.814 1.084.814 2.182 0 1.575-.014 2.846-.014 3.232 0 .316.216.683.825.567C20.565 21.917 24 17.5 24 12.292 24 5.78 18.627.5 12 .5Z" />
  </svg>
);

const IconShield = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
);

const IconLayers = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 5.93a1 1 0 0 0 0 1.77l8.57 3.74a2 2 0 0 0 1.66 0l8.57-3.74a1 1 0 0 0 0-1.77Z" />
    <path d="m22 10.93-8.57 3.74a2 2 0 0 1-1.66 0l-8.57-3.74" />
    <path d="M22 17.65 13.43 21.39a2 2 0 0 1-1.66 0L2 17.65" />
  </svg>
);

const IconSettings = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconLogOut = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

type IconKey = "github" | "shield" | "layers" | "settings" | "logout";

const ICONS: Record<IconKey, React.FC<{ className?: string }>> = {
  github: IconGithub,
  shield: IconShield,
  layers: IconLayers,
  settings: IconSettings,
  logout: IconLogOut,
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "github" as IconKey },
  { href: "/dashboard/repos", label: "Repos", icon: "github" as IconKey },
  { href: "/dashboard/reviews", label: "Reviews", icon: "shield" as IconKey },
  { href: "/dashboard/sprints", label: "Sprints", icon: "layers" as IconKey },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" as IconKey },
];

export const dynamic = "force-dynamic";

type Session = {
  login: string;
  name: string | null;
  avatar_url: string | null;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function readSession() {
      try {
        const raw = document.cookie
          .split("; ")
          .find((c) => c.startsWith("ultracode_session="))
          ?.split("=")[1];
        if (!raw) {
          setSession(null);
          return;
        }
        const payload = JSON.parse(atob(raw.split(".")[1]));
        setSession({
          login: payload.login,
          name: payload.name,
          avatar_url: payload.avatar_url,
        });
      } catch {
        setSession(null);
      }
      setHydrated(true);
    }
    readSession();
    const onFocus = () => readSession();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-[#787880]">Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.replace("/auth/github");
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] p-4">
          <span className="text-lg font-bold tracking-tight text-[var(--amber)]">Ultracode</span>
          <span className="ml-2 text-xs text-[#787880]">beta</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const IconComp = ICONS[icon];
            return (
              <a
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#a0a0a8] transition hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              >
                <IconComp />
                {label}
              </a>
            );
          })}
        </nav>
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            {session.avatar_url ? (
              <img
                src={session.avatar_url}
                alt={session.login}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--amber)]/20 text-xs font-bold text-[var(--amber)]">
                {session.login.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{session.login}</p>
              <p className="truncate text-xs text-[#787880]">
                {session.name ?? "Developer"}
              </p>
            </div>
            <form action="/auth/signout" method="get">
              <button
                type="submit"
                className="rounded p-1.5 text-[#787880] transition hover:text-[var(--foreground)]"
                aria-label="Sign out"
              >
                <IconLogOut />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
