import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogOut, Github, Layers, Shield, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/github");
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Github },
  { href: "/dashboard/repos", label: "Repos", icon: Github },
  { href: "/dashboard/reviews", label: "Reviews", icon: Shield },
    { href: "/dashboard/sprints", label: "Sprints", icon: Layers },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] p-4">
          <span className="text-lg font-bold tracking-tight text-[var(--amber)]">Ultracode</span>
          <span className="ml-2 text-xs text-[#787880]">beta</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <a key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#a0a0a8] transition hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]">
              <Icon className="h-4 w-4" />
              {label}
            </a>
          ))}
        </nav>
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            {session.avatar_url ? (
              <img src={session.avatar_url} alt={session.login} className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--amber)]/20 text-xs font-bold text-[var(--amber)]">
                {session.login.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{session.login}</p>
              <p className="truncate text-xs text-[#787880]">{session.name ?? "Developer"}</p>
            </div>
            <form action="/auth/signout" method="get">
              <button type="submit" className="rounded p-1.5 text-[#787880] transition hover:text-[var(--foreground)]" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
