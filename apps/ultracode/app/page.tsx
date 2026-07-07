import { ArrowRight, Zap, Shield, Cloud, Server, Lock } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex-1">
      {/* ── Hero / Section 0 ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface)] to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 py-32 text-center">
          <p className="fade-up text-sm uppercase tracking-widest text-[var(--amber-dim)]">
            The Quiet Entry
          </p>
          <h1 className="fade-up stagger-1 mt-6 text-5xl md:text-7xl font-bold leading-tight">
            They didn&apos;t shout{" "}
            <span className="gradient-text">when they entered</span> the arena.
          </h1>
          <p className="fade-up stagger-2 mx-auto mt-8 max-w-2xl text-lg text-[#a0a0a8]">
            A generation of Vietnamese developers proved themselves on the world
            stage — 55,000 livestream viewers, 4+ hours of prime-time broadcast.
            Now we bring that same discipline to your code.
          </p>
          <div className="fade-up stagger-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#sign-off"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--amber)] px-6 py-3 font-semibold text-[var(--background)] transition hover:brightness-110"
            >
              Request a Demo — 15 min
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#product"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-6 py-3 font-semibold text-[var(--foreground)] transition hover:border-[var(--amber-dim)]"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── Section 1 — The Proof ── */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <p className="fade-up text-sm uppercase tracking-widest text-[var(--amber-dim)]">
            What happened
          </p>
          <p className="fade-up stagger-1 mt-6 text-2xl leading-relaxed md:text-3xl">
            55,000 people watched.
          </p>
          <p className="fade-up stagger-2 mt-6 text-xl text-[#a0a0a8]">
            Not in a boardroom. On a livestream, late at night, because a
            Vietnamese team showed up and competed.
          </p>
          <p className="fade-up stagger-3 mt-6 text-xl text-[#a0a0a8]">
            No fanfare. No announcement campaign. Just execution.
          </p>
          <p className="fade-up stagger-4 mt-8 text-xl text-[var(--foreground)]">
            That&apos;s not a sports story. That&apos;s an{" "}
            <span className="text-[var(--amber)]">engineering culture</span>{" "}
            story.
          </p>
        </div>
      </section>

      {/* ── Section 2 — The Bridge ── */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <p className="fade-up text-sm uppercase tracking-widest text-[var(--amber-dim)]">
            From Sophia to Ultracode
          </p>
          <p className="fade-up stagger-1 mt-6 text-2xl leading-relaxed">
            Sophia AI Factory was the first chapter — AI-powered proposal
            generation for agencies in Southeast Asia.
          </p>
          <p className="fade-up stagger-2 mt-6 text-xl text-[#a0a0a8]">
            Ultracode is the next: competitive code review + sprint
            infrastructure built by the same team, for teams that ship fast and
            ship right.
          </p>
          <p className="fade-up stagger-3 mt-6 text-xl text-[#a0a0a8]">
            Sophia learned how to automate quality at scale. Ultracode applies
            that learning where it matters most: your codebase, every pull
            request, every sprint.
          </p>
        </div>
      </section>

      {/* ── Section 3 — The Product ── */}
      <section id="product" className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <h2 className="fade-up text-3xl font-bold md:text-4xl">
            Code review <span className="gradient-text">at sprint speed</span>.
          </h2>

          {/* Comparison Table */}
          <div className="fade-up stagger-1 mt-12 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="pb-4 pr-4 text-sm uppercase tracking-widest text-[#787880]" />
                  <th className="pb-4 pr-4 text-sm uppercase tracking-widest text-[#787880]">
                    Traditional review
                  </th>
                  <th className="pb-4 text-sm uppercase tracking-widest text-[var(--amber)]">
                    Ultracode
                  </th>
                </tr>
              </thead>
              <tbody className="text-lg">
                {([
                  ["Speed", "1–3 days per PR", "Minutes per PR"],
                  ["Coverage", "Spot-check, human-limited", "Every line, AI-assisted"],
                  ["Context loss", "Tribal knowledge leaves with devs", "Retained in review history"],
                ] as const).map(([label, oldTxt, newTxt]) => (
                  <tr key={label} className="border-b border-[var(--border)]">
                    <td className="py-5 pr-4 font-medium whitespace-nowrap">
                      {label}
                    </td>
                    <td className="py-5 pr-4 text-[#787880]">{oldTxt as string}</td>
                    <td className="py-5 text-[var(--amber)]">{newTxt as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Shadow Review */}
          <div className="fade-up stagger-2 mt-16 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-8">
            <h3 className="text-xl font-semibold">AI Shadow Review</h3>
            <p className="mt-4 text-[#a0a0a8]">
              Every pull request gets an automated review surface — defect
              density, logic gaps, consistency against your codebase&apos;s own
              conventions. Human senior review becomes <em>judgment</em>, not{" "}
              <em>discovery</em>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {["Defect density", "Logic gaps", "Convention drift"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[#a0a0a8]"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4 — The Stack ── */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <h2 className="fade-up text-3xl font-bold md:text-4xl">
            Built on <span className="gradient-text">proven</span> infrastructure.
          </h2>
          <ul className="fade-up stagger-1 mt-10 space-y-4 text-lg">
            {([
              ["Cloudflare Workers", "Edge-first, sub-50ms cold start", Cloud],
              ["D1 + KV", "Serverless, no ops overhead", Server],
              ["TypeScript", "End-to-end type safety", Shield],
              ["Inngest", "Async workflow orchestration", Zap],
              [
                "OpenRouter + Anthropic",
                "LLM routing — local-first with cloud fallback",
                Lock,
              ],
            ] as const).map(([name, desc, Icon], idx) => (
              <li
                key={idx}
                className="flex items-start gap-4 rounded-lg border border-transparent p-3 transition hover:border-[var(--border)] hover:bg-[var(--surface)]"
              >
                <Icon className="mt-1 h-5 w-5 shrink-0 text-[var(--amber)]" />
                <div>
                  <span className="font-semibold">{name as string}</span>
                  <span className="text-[#787880]"> — {desc as string}</span>
                </div>
              </li>
            ))}
          </ul>
          <blockquote className="fade-up stagger-2 mt-10 border-l-2 border-[var(--amber)] pl-6 text-xl text-[#a0a0a8] italic">
            We don&apos;t ask you to maintain anything. You bring a repo. We
            bring the feedback loop.
          </blockquote>
        </div>
      </section>

      {/* ── Section 5 — The Asks ── */}
      <section id="beta" className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <p className="fade-up text-sm uppercase tracking-widest text-[var(--amber-dim)]">
            Beta program — Q3 2026
          </p>
          <div className="fade-up stagger-1 mt-8 grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-6">
              <h3 className="font-semibold text-[var(--amber)]">What we need</h3>
              <ol className="mt-4 list-inside list-decimal space-y-2 text-[#a0a0a8]">
                <li>A repository (any language)</li>
                <li>A weekly 30-min sync</li>
                <li>Honest feedback on review quality</li>
              </ol>
            </div>
            <div className="rounded-xl border border-[var(--amber)]/30 bg-[var(--amber)]/5 p-6">
              <h3 className="font-semibold text-[var(--amber)]">What you get</h3>
              <ol className="mt-4 list-inside list-decimal space-y-2 text-[#a0a0a8]">
                <li>Unlimited AI shadow reviews during beta</li>
                <li>Sprint infrastructure access</li>
                <li>
                  Founding-member pricing locked for{" "}
                  <span className="text-[var(--amber)]">12 months</span>
                </li>
              </ol>
            </div>
          </div>
          <p className="fade-up stagger-2 mt-6 text-center text-sm text-[#787880]">
            5–10 teams · 4-week sprint · Free during beta
          </p>
        </div>
      </section>

      {/* ── Section 6 — Sign-off ── */}
      <section id="sign-off" className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-6 py-32 text-center">
          <h2 className="fade-up text-3xl font-bold md:text-5xl">
            Action over <span className="gradient-text">announcement</span>.
          </h2>
          <p className="fade-up stagger-1 mx-auto mt-8 max-w-xl text-lg text-[#a0a0a8]">
            You&apos;ve seen the story — 55,000 viewers didn&apos;t watch a
            promise. They watched execution.
          </p>
          <p className="fade-up stagger-2 mx-auto mt-4 max-w-xl text-lg text-[#a0a0a8]">
            If your team ships fast and wants feedback that keeps up, Ultracode
            is already running.
          </p>
          <a
            href="/api/leads"
            className="fade-up stagger-3 mt-10 inline-flex items-center gap-2 rounded-lg bg-[var(--amber)] px-8 py-4 text-lg font-semibold text-[var(--background)] transition hover:brightness-110"
          >
            Start the conversation
            <ArrowRight className="h-5 w-5" />
          </a>
          <p className="fade-up stagger-4 mt-4 text-sm text-[#787880]">
            Or email us directly — we respond within 24 hours.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-4xl px-6 py-8 text-center text-sm text-[#787880]">
          <p>
            Ultracode is a product of the{" "}
            <span className="text-[var(--amber-dim)]">MekongMind</span>{' '}
            operating system.
          </p>
          <p className="mt-1">
            Sophia AI Factory (
            <a
              href="https://sophia.agencyos.network"
              target="_blank"
              rel="noreferrer"
              className="underline transition hover:text-[var(--amber)]"
            >
              sophia.agencyos.network
            </a>
            ) is the client-facing layer for agency proposal automation.
          </p>
        </div>
      </footer>
    </main>
  );
}
