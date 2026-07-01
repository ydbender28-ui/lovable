"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useState } from "react";
import { useRouter } from "next/navigation";

const TIERS = [
  {
    name: "Plus",
    price: { monthly: 9, annual: 7 },
    desc: "For individuals building side projects and personal apps.",
    features: [
      "15 apps",
      "Unlimited edits per app",
      "Live preview",
      "thatcode.dev subdomain",
      "Visit analytics",
      "Email support",
    ],
    plan: "plus",
    highlight: false,
  },
  {
    name: "Pro",
    price: { monthly: 19, annual: 15 },
    desc: "For builders who ship real products to real users.",
    features: [
      "Unlimited apps",
      "Private projects",
      "Custom domains",
      "Password protection",
      "GitHub export",
      "Fork & clone projects",
      "Priority AI (Claude Sonnet)",
      "Remove ThatCode badge",
      "Priority email support",
    ],
    plan: "pro",
    highlight: true,
  },
  {
    name: "Business",
    price: { monthly: 49, annual: 39 },
    desc: "For teams and agencies building client projects at scale.",
    features: [
      "Everything in Pro",
      "5 seats included",
      "Shared project library",
      "Team permissions",
      "API access",
      "White-label publishing",
      "Dedicated Slack support",
    ],
    plan: "business",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: { monthly: null, annual: null },
    desc: "For organizations that need security, compliance, and SLAs.",
    features: [
      "Everything in Business",
      "Unlimited seats",
      "SSO / SAML",
      "SOC 2 compliance",
      "Dedicated infrastructure",
      "Custom AI model routing",
      "SLA guarantee",
      "Dedicated account manager",
    ],
    plan: "enterprise",
    highlight: false,
  },
] as const;

const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings any time — no questions, no retention loops.",
  },
  {
    q: "What happens to my apps if I downgrade?",
    a: "Your apps stay live. Published projects remain accessible. You just won't be able to create new ones past the plan limit until you upgrade again.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Start free with no credit card required. Upgrade when you're ready.",
  },
  {
    q: "What AI models does ThatCode use?",
    a: "We route between Claude Sonnet, Claude Haiku, and Gemini 2.5 Flash based on task complexity. Pro users always get the best available model.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes, on Pro and above. Add any domain you own, set a CNAME record, and your app is live at your own URL in minutes.",
  },
  {
    q: "How do credits work?",
    a: "Credits power AI generations. Simple edits cost ~0.3–1 credit, new features 2–4 credits, and full app builds 3–8 credits. Credits never expire.",
  },
];

const COMPARISON_FEATURES = [
  { label: "Apps", free: "5", plus: "15", pro: "Unlimited", business: "Unlimited" },
  { label: "AI builds / month", free: "10", plus: "60", pro: "200", business: "500" },
  { label: "Custom domain", free: "✗", plus: "✗", pro: "✓", business: "✓" },
  { label: "Private projects", free: "✗", plus: "✗", pro: "✓", business: "✓" },
  { label: "GitHub export", free: "✗", plus: "✗", pro: "✓", business: "✓" },
  { label: "Remove badge", free: "✗", plus: "✗", pro: "✓", business: "✓" },
  { label: "Team seats", free: "1", plus: "1", pro: "1", business: "5" },
  { label: "API access", free: "✗", plus: "✗", pro: "✗", business: "✓" },
  { label: "White-label", free: "✗", plus: "✗", pro: "✗", business: "✓" },
  { label: "Support", free: "Community", plus: "Email", pro: "Priority email", business: "Slack" },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpgrade(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval: annual ? "annual" : "monthly" }),
      });

      if (res.status === 401) {
        router.push(`/login?next=/pricing`);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Something went wrong — please try again.");
      }
    } catch {
      alert("Network error — please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ background: "#f6f6f8", minHeight: "100vh" }}>
      {/* Nav */}
      <header>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/"><Logo size="md" /></Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm" style={{ color: "#71717f" }}>Log in</Link>
            <Link href="/signup" className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg,#6a1ff7,#0a8ff0)", boxShadow: "0 6px 22px rgba(106,31,247,0.25)" }}>
              Start free
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-28 pt-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl" style={{ color: "#17171c", letterSpacing: "-0.045em" }}>
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-base" style={{ color: "#71717f" }}>
            Start for free. Upgrade when you&apos;re ready to ship.
          </p>

          {/* Annual toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl px-4 py-2"
            style={{ background: "#ffffff", border: "1px solid #ececf1" }}>
            <span className="text-sm" style={{ color: annual ? "#71717f" : "#17171c", fontWeight: annual ? 400 : 600 }}>Monthly</span>
            <button
              onClick={() => setAnnual(v => !v)}
              style={{
                width: 44, height: 24, borderRadius: 12, position: "relative", cursor: "pointer", border: "none",
                background: annual ? "linear-gradient(135deg,#6a1ff7,#0a8ff0)" : "#e4e4ef",
                transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 3, left: annual ? 23 : 3,
                width: 18, height: 18, borderRadius: "50%", background: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
              }} />
            </button>
            <span className="text-sm" style={{ color: annual ? "#17171c" : "#71717f", fontWeight: annual ? 600 : 400 }}>
              Annual
              <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: "rgba(106,31,247,0.1)", color: "#6a1ff7" }}>
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Free tier strip */}
        <div className="mb-6 flex items-center justify-between rounded-2xl px-6 py-4"
          style={{ background: "#ffffff", border: "1px solid #ececf1" }}>
          <div>
            <span className="text-sm font-semibold" style={{ color: "#17171c" }}>Free</span>
            <span className="ml-3 text-sm" style={{ color: "#71717f" }}>5 apps · Live preview · thatcode.dev subdomain · Community support</span>
          </div>
          <Link href="/signup"
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px"
            style={{ background: "#f0f0f5", color: "#17171c", border: "1px solid #ececf1" }}>
            Get started free
          </Link>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className="relative flex flex-col overflow-hidden rounded-2xl p-6"
              style={
                t.highlight
                  ? { background: "linear-gradient(145deg,#f0ecff,#e8e4ff)", border: "1px solid rgba(106,31,247,0.3)", boxShadow: "0 0 60px rgba(106,31,247,0.08)" }
                  : { background: "#ffffff", border: "1px solid #ececf1" }
              }
            >
              {t.highlight && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{ background: "linear-gradient(90deg,transparent,rgba(106,31,247,0.4),transparent)" }} />
              )}
              {t.highlight && (
                <div className="mb-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold"
                  style={{ background: "rgba(106,31,247,0.1)", color: "#6a1ff7", border: "1px solid rgba(106,31,247,0.25)" }}>
                  Most popular
                </div>
              )}
              <h3 className="text-sm font-semibold" style={{ color: "#17171c" }}>{t.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                {t.price.monthly !== null ? (
                  <>
                    <span className="text-3xl font-bold" style={{ color: "#17171c", letterSpacing: "-0.04em" }}>
                      ${annual ? t.price.annual : t.price.monthly}
                    </span>
                    <span className="text-sm" style={{ color: "#71717f" }}>/ mo</span>
                    {annual && (
                      <span className="ml-1 text-[10px]" style={{ color: "#71717f" }}>
                        billed annually
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-3xl font-bold" style={{ color: "#17171c", letterSpacing: "-0.04em" }}>Custom</span>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "#71717f" }}>{t.desc}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "#51515c" }}>
                    <span className="mt-0.5 shrink-0 text-[10px]" style={{ color: "#4ade80" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {t.plan === "enterprise" ? (
                <a href="mailto:hi@thatcode.dev"
                  className="mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all hover:-translate-y-px"
                  style={{ background: "#f0f0f5", color: "#17171c", border: "1px solid #ececf1" }}>
                  Contact sales
                </a>
              ) : (
                <button
                  onClick={() => handleUpgrade(t.plan)}
                  disabled={loading === t.plan}
                  className="mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all hover:-translate-y-px disabled:opacity-60"
                  style={
                    t.highlight
                      ? { background: "linear-gradient(135deg,#6a1ff7,#0a8ff0)", color: "#fff", boxShadow: "0 8px 24px rgba(106,31,247,0.25)", cursor: loading === t.plan ? "wait" : "pointer", border: "none" }
                      : { background: "#f0f0f5", color: "#17171c", border: "1px solid #ececf1", cursor: loading === t.plan ? "wait" : "pointer" }
                  }
                >
                  {loading === t.plan ? "Redirecting…" : `Start ${t.name} →`}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div className="mt-20">
          <h2 className="mb-8 text-center text-2xl font-bold" style={{ color: "#17171c", letterSpacing: "-0.04em" }}>
            Compare plans
          </h2>
          <div className="overflow-x-auto rounded-2xl" style={{ background: "#ffffff", border: "1px solid #ececf1" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #ececf1" }}>
                  <th className="px-6 py-4 text-left text-xs font-semibold" style={{ color: "#71717f", width: "28%" }}>Feature</th>
                  {["Free", "Plus", "Pro", "Business"].map(col => (
                    <th key={col} className="px-4 py-4 text-center text-xs font-semibold"
                      style={{ color: col === "Pro" ? "#6a1ff7" : "#17171c" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((row, i) => (
                  <tr key={row.label}
                    style={{ borderBottom: i < COMPARISON_FEATURES.length - 1 ? "1px solid #f4f4f8" : "none" }}>
                    <td className="px-6 py-3 text-xs" style={{ color: "#51515c" }}>{row.label}</td>
                    {[row.free, row.plus, row.pro, row.business].map((val, j) => (
                      <td key={j} className="px-4 py-3 text-center text-xs"
                        style={{
                          color: val === "✓" ? "#4ade80" : val === "✗" ? "#e4e4ef" : "#51515c",
                          fontWeight: j === 2 ? 500 : 400,
                        }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="mb-8 text-center text-2xl font-bold" style={{ color: "#17171c", letterSpacing: "-0.04em" }}>
            Frequently asked questions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #ececf1" }}>
                <p className="mb-2 text-sm font-semibold" style={{ color: "#17171c" }}>{f.q}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#71717f" }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
