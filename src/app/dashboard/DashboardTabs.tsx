"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ProjectCard from "./ProjectCard";
import NewAgentButton from "./NewAgentButton";

interface Project {
  id: string;
  name: string;
  updatedAt: Date;
  publishedAt: Date | null;
  visitCount: number;
  hasVersion: boolean;
  isPrivate: boolean;
}

interface Agent {
  id: string;
  name: string;
  description: string | null;
  avatar: string;
  slug: string;
  public: boolean;
}

// 1 credit = $0.25 at base rate. Bulk packs discount down to ~17.5¢/credit.
const PACKAGES = [
  { id: "starter",  credits: 100,  price: "$25",  label: "Starter",  per: "25¢ per credit" },
  { id: "builder",  credits: 300,  price: "$65",  label: "Builder",  per: "21.7¢ per credit — save 13%", popular: true },
  { id: "pro",      credits: 700,  price: "$140", label: "Pro",      per: "20¢ per credit — save 20%" },
  { id: "agency",   credits: 2000, price: "$350", label: "Agency",   per: "17.5¢ per credit — save 30%" },
] as const;

function BuyCreditsModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function buy(packageId: string) {
    setLoading(packageId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.url) {
        alert(data.error ?? "Payment setup failed. Please check that Stripe is configured in Vercel env vars.");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      alert("Network error — please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0f17] p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Buy Credits</h2>
            <p className="text-xs text-gray-500 mt-0.5">Credits never expire. Use them on any generation.</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PACKAGES.map(pkg => (
            <button key={pkg.id} onClick={() => buy(pkg.id)} disabled={loading !== null}
              className={`relative rounded-xl border p-4 text-left transition-all hover:border-fuchsia-400/50 hover:bg-fuchsia-500/5 disabled:opacity-60 ${
                "popular" in pkg && pkg.popular
                  ? "border-fuchsia-400/40 bg-fuchsia-500/[0.06]"
                  : "border-white/10 bg-white/[0.02]"
              }`}>
              {"popular" in pkg && pkg.popular && (
                <span className="absolute -top-2 left-3 text-[10px] font-semibold bg-fuchsia-500 text-white px-2 py-0.5 rounded-full">Most popular</span>
              )}
              <p className="text-xl font-bold text-white">{pkg.price}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{pkg.credits.toLocaleString()} credits</p>
              <p className="text-[10px] text-gray-500 mt-1">{pkg.per}</p>
              {loading === pkg.id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                  <span className="text-xs text-gray-300">Redirecting…</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
          <p className="text-[11px] text-gray-500 font-medium">How credits work</p>
          <p className="text-[11px] text-gray-600">Simple edits (color, text) = ~0.3–1 credit &nbsp;·&nbsp; New features = 2–4 credits &nbsp;·&nbsp; Full app build = 3–8 credits</p>
        </div>

        <p className="text-[10px] text-gray-700 text-center">Secure payment via Stripe · No subscription · Credits never expire</p>
      </div>
    </div>
  );
}

export default function DashboardTabs({
  projects,
  agents,
  credits: initialCredits,
}: {
  projects: Project[];
  agents: Agent[];
  credits: number | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"apps" | "agents">("apps");
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [purchaseToast, setPurchaseToast] = useState(false);
  const [credits, setCredits] = useState(initialCredits);

  useEffect(() => {
    if (searchParams.get("credits") !== "purchased") return;
    router.replace("/dashboard");

    // Webhook fires after redirect — poll until balance increases
    const before = initialCredits ?? 0;
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const res = await fetch("/api/user/credits");
      const data = await res.json();
      if (data.credits > before || attempts >= 15) {
        clearInterval(poll);
        setCredits(data.credits);
        setPurchaseToast(true);
        setTimeout(() => setPurchaseToast(false), 5000);
      }
    }, 1000);
    return () => clearInterval(poll);
  }, [searchParams, router, initialCredits]);

  async function build() {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: trimmed }),
    });
    const project = await res.json();
    router.push(`/projects/${project.id}?prompt=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div>
      {/* Purchase success toast */}
      {purchaseToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-green-400/30 bg-green-950/90 px-4 py-3 text-sm text-green-200 shadow-xl backdrop-blur">
          ✓ Credits added to your account!
        </div>
      )}

      {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}

      {/* Credits bar */}
      {credits !== null && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-white">{credits < 0 ? 0 : credits.toFixed(1)} credits</span>
            {credits < 10 && (
              <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-400/20 rounded-full px-2 py-0.5">
                {credits <= 0 ? "Out of credits" : "Running low"}
              </span>
            )}
          </div>
          <button onClick={() => setShowBuyCredits(true)}
            className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-4 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity">
            Buy credits
          </button>
        </div>
      )}

      {/* ---------- Tab bar ---------- */}
      <div
        className="mb-8 flex items-center gap-1"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {(["apps", "agents"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative px-4 py-2.5 text-sm font-medium capitalize transition-colors"
            style={{ color: tab === t ? "#eef0f6" : "#7a8099" }}
          >
            {t}
            {t === "apps" && projects.length > 0 && (
              <span
                className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: "rgba(109,95,255,0.16)", color: "#a78bfa" }}
              >
                {projects.length}
              </span>
            )}
            {tab === t && (
              <span
                className="absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full"
                style={{ background: "linear-gradient(90deg, #6d5fff, #a78bfa)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ---------- Apps ---------- */}
      {tab === "apps" && (
        <div>
          {/* New app input */}
          <div
            className="w-full rounded-2xl transition-all"
            style={{
              background: "#111318",
              border: `1px solid ${focused ? "rgba(109,95,255,0.55)" : "rgba(255,255,255,0.08)"}`,
              boxShadow: focused ? "0 0 0 4px rgba(109,95,255,0.12)" : "none",
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  build();
                }
              }}
              placeholder="Describe the app you want to build…"
              rows={3}
              className="w-full resize-none bg-transparent px-4 py-3.5 text-sm focus:outline-none"
              style={{ color: "#eef0f6" }}
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <span className="text-[10px]" style={{ color: "#5b6070" }}>
                ⏎ to build · Shift+⏎ for newline
              </span>
              <button
                onClick={build}
                disabled={!prompt.trim() || loading}
                className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #6d5fff, #5b4ee0)",
                  boxShadow: "0 4px 18px rgba(109,95,255,0.30)",
                }}
              >
                {loading ? "Creating…" : "Build →"}
              </button>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.01)" }}>
                <p className="text-2xl mb-2">✨</p>
                <p className="text-sm font-medium mb-1" style={{ color: "#eef0f6" }}>No apps yet</p>
                <p className="text-xs mb-4" style={{ color: "#7a8099" }}>Describe what you want above, or start from a template.</p>
                <Link href="/templates" className="inline-block rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-px" style={{ background: "linear-gradient(135deg,#6d5fff,#5b4ee0)", boxShadow: "0 4px 16px rgba(109,95,255,0.30)" }}>
                  Browse templates →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- Agents ---------- */}
      {tab === "agents" && (
        <div>
          <NewAgentButton />
          {agents.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="group flex items-start gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                  style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.07)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(109,95,255,0.35)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ background: "rgba(109,95,255,0.12)", border: "1px solid rgba(109,95,255,0.22)" }}>
                    {agent.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "#eef0f6" }}>{agent.name}</p>
                    {agent.description && (
                      <p className="mt-0.5 truncate text-xs" style={{ color: "#7a8099" }}>{agent.description}</p>
                    )}
                    <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={agent.public
                        ? { background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.28)", color: "#4ade80" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "#7a8099" }}>
                      {agent.public ? "Public" : "Private"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl p-16 text-center"
              style={{ border: "1px dashed rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.01)" }}>
              <p className="text-sm" style={{ color: "#7a8099" }}>No agents yet — create one above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
