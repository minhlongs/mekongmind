"use client";

import { useEffect, useState } from "react";
import { fetchBalance } from "@/lib/api-client";
import { getTenantId, getTier, logout } from "@/lib/auth";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 30_000;

export function BalanceHeader() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [tier] = useState<string | null>(getTier());

  useEffect(() => {
    const tenantId = getTenantId();
    if (!tenantId) return;

    let active = true;
    async function refresh() {
      try {
        const data = await fetchBalance(tenantId!);
        if (active) setBalance(data.balance);
      } catch {
        // Surface as null; user can still see other UI.
      }
    }
    refresh();
    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900 px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold text-emerald-400">Mekong IDE</span>
        {tier && (
          <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs uppercase tracking-wider text-neutral-300">
            {tier}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-sm text-neutral-300">
          MCU: {balance === null ? "—" : balance}
        </span>
        <a
          href="https://www.mekongmind.com/billing"
          className="rounded border border-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-800"
        >
          Recharge
        </a>
        <button
          onClick={handleLogout}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
