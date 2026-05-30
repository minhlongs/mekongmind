"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(licenseKey.trim());
      router.push("/app");
    } catch (err) {
      const code = err instanceof Error ? err.message : "login_failed";
      setError(humanError(code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-8"
      >
        <header>
          <h1 className="text-2xl font-semibold">Mekong IDE</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Paste your license key from the welcome email.
          </p>
        </header>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-neutral-400">
            License Key
          </span>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="lic_..."
            autoComplete="off"
            required
            className="mt-1 block w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none"
          />
        </label>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || licenseKey.trim().length < 8}
          className="w-full rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Sign in"}
        </button>

        <p className="text-center text-xs text-neutral-500">
          No license?{" "}
          <a
            href="https://www.mekongmind.com/pricing"
            className="text-emerald-400 hover:underline"
          >
            See plans
          </a>
        </p>
      </form>
    </main>
  );
}

function humanError(code: string): string {
  switch (code) {
    case "invalid_license":
      return "License key not recognized. Check the email or contact support.";
    case "license_inactive":
      return "License is inactive or cancelled. Renew via your billing page.";
    case "Failed to fetch":
      return "Cannot reach the API. Try again in a moment.";
    default:
      return "Login failed. Double-check the key and try again.";
  }
}
