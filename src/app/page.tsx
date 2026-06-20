import Link from "next/link";
import { auth } from "@/lib/auth";
import Logo from "@/components/Logo";
import HeroActions from "@/components/HeroActions";

const FEATURES = [
  {
    icon: "⚡",
    title: "Built in seconds",
    desc: "Describe it once. A working app with real code appears in under thirty seconds.",
    tint: "rgba(109,95,255,0.16)",
    ring: "rgba(109,95,255,0.32)",
  },
  {
    icon: "🖥",
    title: "Live preview",
    desc: "Watch the real app render as it is written, not a static mockup or screenshot.",
    tint: "rgba(45,212,191,0.14)",
    ring: "rgba(45,212,191,0.30)",
  },
  {
    icon: "🚀",
    title: "Publish anywhere",
    desc: "Ship to thatcode.dev or your own custom domain with password protection.",
    tint: "rgba(245,158,11,0.14)",
    ring: "rgba(245,158,11,0.30)",
  },
  {
    icon: "↺",
    title: "Every version saved",
    desc: "Roll back to any past build the moment you change your mind. Nothing is lost.",
    tint: "rgba(244,63,94,0.13)",
    ring: "rgba(244,63,94,0.28)",
  },
  {
    icon: "🤖",
    title: "Multi-model AI",
    desc: "Routes between Claude, GPT-4o and Gemini automatically based on task complexity.",
    tint: "rgba(34,197,94,0.12)",
    ring: "rgba(34,197,94,0.26)",
  },
  {
    icon: "🔒",
    title: "Password protection",
    desc: "Gate your published apps behind a password for client previews or private betas.",
    tint: "rgba(251,191,36,0.12)",
    ring: "rgba(251,191,36,0.26)",
  },
  {
    icon: "🍴",
    title: "Fork & clone",
    desc: "Duplicate any of your projects and use it as a starting point for the next build.",
    tint: "rgba(168,85,247,0.14)",
    ring: "rgba(168,85,247,0.30)",
  },
  {
    icon: "📤",
    title: "GitHub export",
    desc: "Push any project directly to a new GitHub repo with one click.",
    tint: "rgba(99,102,241,0.14)",
    ring: "rgba(99,102,241,0.30)",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for experimenting and personal projects.",
    features: [
      "5 apps",
      "Unlimited edits",
      "Live preview",
      "thatcode.dev subdomain",
      "Community support",
    ],
    cta: "Start free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/ month",
    desc: "For builders who ship real products.",
    features: [
      "Unlimited apps",
      "Custom domains",
      "Password protection",
      "Visit analytics",
      "GitHub export",
      "Priority AI (Claude Sonnet)",
      "Email support",
    ],
    cta: "Start Pro →",
    href: "/signup",
    highlight: true,
  },
  {
    name: "Team",
    price: "$39",
    period: "/ month",
    desc: "For agencies and small teams.",
    features: [
      "Everything in Pro",
      "5 seats",
      "Shared projects",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact us",
    href: "mailto:hi@thatcode.dev",
    highlight: false,
  },
];

export default async function Home() {
  const session = await auth();
  const startHref = session?.user ? "/dashboard" : "/signup";

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#0a0b0e" }}>
      {/* Ambient top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 50% -20%, rgba(109,95,255,0.18) 0%, rgba(10,11,14,0) 60%)",
        }}
      />
      {/* Faint grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 80%)",
        }}
      />

      {/* ---------- Nav ---------- */}
      <header className="relative z-20">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo size="md" />
          <div className="hidden items-center gap-8 text-sm md:flex" style={{ color: "#7a8099" }}>
            <Link href="/templates" className="transition-colors hover:text-white" style={{ color: "#7a8099" }}>Templates</Link>
            <Link href="/showcase" className="transition-colors hover:text-white" style={{ color: "#7a8099" }}>Showcase</Link>
            <a href="#pricing" className="transition-colors hover:text-white" style={{ color: "#7a8099" }}>Pricing</a>
            <Link href="/docs" className="transition-colors hover:text-white" style={{ color: "#7a8099" }}>Docs</Link>
          </div>
          <div className="flex items-center gap-2">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-px"
                style={{ background: "linear-gradient(135deg, #6d5fff, #5b4ee0)", boxShadow: "0 6px 22px rgba(109,95,255,0.35)" }}
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm transition-colors" style={{ color: "#c4cad6" }}>
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-px"
                  style={{ background: "linear-gradient(135deg, #6d5fff, #5b4ee0)", boxShadow: "0 6px 22px rgba(109,95,255,0.35)" }}
                >
                  Start free
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="flex flex-col items-center pt-20 text-center sm:pt-28">
          {/* Pill badge */}
          <div
            className="animate-fade-slide-up mb-9 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "#c4cad6" }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: "#6d5fff", opacity: 0.7 }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#6d5fff" }} />
            </span>
            Multi-model AI · Claude · GPT-4o · Gemini
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-slide-up max-w-3xl text-[36px] font-bold sm:text-5xl lg:text-[72px]"
            style={{ letterSpacing: "-0.04em", lineHeight: 1.05, color: "#eef0f6", animationDelay: "0.05s" }}
          >
            Build apps that
            <br />
            <span className="text-gradient">actually work.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="animate-fade-slide-up mt-7 max-w-xl text-lg leading-relaxed"
            style={{ color: "#7a8099", animationDelay: "0.1s" }}
          >
            Describe what you want in plain English. ThatCode writes it, renders a
            live preview, and ships a real working app you can publish in one click.
          </p>

          {/* CTAs — client component for demo modal */}
          <HeroActions startHref={startHref} />

          {/* ---------- Real browser mockup — hidden on mobile to avoid overlap ---------- */}
          <div className="animate-fade-slide-up relative mt-16 hidden w-full max-w-4xl sm:block" style={{ animationDelay: "0.22s" }}>
            {/* glow underneath */}
            <div
              className="animate-glow-pulse pointer-events-none absolute -inset-x-10 bottom-[-40px] top-10 -z-10"
              style={{
                background: "radial-gradient(ellipse 60% 55% at 50% 60%, rgba(109,95,255,0.45) 0%, transparent 70%)",
                filter: "blur(50px)",
              }}
            />
            <div
              className="animate-float overflow-hidden rounded-2xl text-left"
              style={{
                background: "#111318",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 40px 120px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Window chrome */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: "#febc2e" }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: "#28c840" }} />
                </div>
                <div className="ml-2 flex h-7 flex-1 items-center gap-2 rounded-md px-3 text-xs" style={{ background: "rgba(255,255,255,0.04)", color: "#7a8099" }}>
                  <span style={{ color: "#22c55e" }}>●</span>
                  mystore.thatcode.dev
                </div>
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "#5b6070" }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
                  Live
                </div>
              </div>

              {/* Real e-commerce app preview */}
              <div style={{ background: "#fafafa", overflow: "hidden" }}>
                {/* Store nav */}
                <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: "#111", letterSpacing: "-0.03em", flexShrink: 0 }}>ShopCraft</span>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                    {["Products", "Collections", "About"].map(l => <span key={l}>{l}</span>)}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <div style={{ background: "#111", color: "#fff", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600 }}>Cart (2)</div>
                  </div>
                </div>

                {/* Hero banner */}
                <div style={{ background: "linear-gradient(135deg,#0f0a23,#1e1150)", padding: "24px 24px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 600, letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>Summer Collection 2025</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", marginBottom: 4 }}>Style that speaks</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 14 }}>Free shipping on orders over $50</div>
                  <div style={{ display: "inline-block", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", borderRadius: 8, padding: "7px 18px", fontSize: 11, fontWeight: 700 }}>Shop Now →</div>
                </div>

                {/* Products grid — 2 cols on sm, 4 on lg */}
                <div style={{ padding: "18px 24px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 12 }}>Featured Products</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                    {[
                      { name: "Air Runner Pro", price: "$129", badge: "New", color: "#4f46e5" },
                      { name: "Classic Tee", price: "$34", badge: "Sale", color: "#dc2626" },
                      { name: "Cargo Pants", price: "$89", badge: null, color: "#065f46" },
                      { name: "Canvas Bag", price: "$56", badge: "Hot", color: "#d97706" },
                    ].map((p) => (
                      <div key={p.name} style={{ background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                        <div style={{ height: 72, background: `linear-gradient(135deg,${p.color}22,${p.color}44)`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {p.badge && (
                            <div style={{ position: "absolute", top: 5, left: 5, background: p.badge === "Sale" ? "#dc2626" : p.badge === "Hot" ? "#d97706" : "#4f46e5", color: "#fff", borderRadius: 4, padding: "2px 5px", fontSize: 8, fontWeight: 700 }}>
                              {p.badge}
                            </div>
                          )}
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: p.color, opacity: 0.6 }} />
                        </div>
                        <div style={{ padding: "8px 10px 7px" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#111", marginBottom: 4 }}>{p.name}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>{p.price}</span>
                            <div style={{ background: "#111", color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 9, fontWeight: 600 }}>Add</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-only: simple feature highlight instead of mockup */}
          <div className="mt-10 block w-full sm:hidden">
            <div className="rounded-2xl p-6 text-center" style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="mb-4 flex justify-center gap-3">
                {["⚡", "🖥", "🚀"].map(e => (
                  <span key={e} className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: "rgba(109,95,255,0.14)", border: "1px solid rgba(109,95,255,0.26)" }}>{e}</span>
                ))}
              </div>
              <p className="text-sm font-semibold" style={{ color: "#eef0f6" }}>From prompt to live app in seconds</p>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "#7a8099" }}>No code. No setup. Just describe it and watch it build.</p>
            </div>
          </div>

          {/* Stat pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {[
              { v: "10k+", l: "apps built" },
              { v: "< 30 sec", l: "to first build" },
              { v: "Free", l: "to start" },
            ].map((s) => (
              <div key={s.l} className="flex items-baseline gap-2 rounded-full px-4 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-sm font-semibold" style={{ color: "#eef0f6" }}>{s.v}</span>
                <span className="text-xs" style={{ color: "#7a8099" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section id="features" className="mt-32 scroll-mt-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold" style={{ color: "#eef0f6", letterSpacing: "-0.04em" }}>
              Everything you need to ship
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7a8099" }}>
              From first prompt to live URL — no code required.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl p-6 transition-all hover:-translate-y-1"
                style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: f.tint, border: `1px solid ${f.ring}` }}>
                  {f.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold" style={{ color: "#eef0f6" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7a8099" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Pricing ---------- */}
        <section id="pricing" className="mt-32 scroll-mt-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold" style={{ color: "#eef0f6", letterSpacing: "-0.04em" }}>
              Simple, honest pricing
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#7a8099" }}>
              Start for free. Upgrade when you need more.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {PRICING.map((p) => (
              <div
                key={p.name}
                className="relative overflow-hidden rounded-2xl p-7"
                style={
                  p.highlight
                    ? {
                        background: "linear-gradient(145deg,#1a1730,#141220)",
                        border: "1px solid rgba(109,95,255,0.45)",
                        boxShadow: "0 0 60px rgba(109,95,255,0.15)",
                      }
                    : { background: "#111318", border: "1px solid rgba(255,255,255,0.07)" }
                }
              >
                {p.highlight && (
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px"
                    style={{ background: "linear-gradient(90deg,transparent,rgba(109,95,255,0.7),transparent)" }}
                  />
                )}
                {p.highlight && (
                  <div
                    className="mb-4 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold"
                    style={{ background: "rgba(109,95,255,0.2)", color: "#a78bfa", border: "1px solid rgba(109,95,255,0.35)" }}
                  >
                    Most popular
                  </div>
                )}
                <h3 className="text-sm font-semibold" style={{ color: "#eef0f6" }}>{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold" style={{ color: "#eef0f6", letterSpacing: "-0.04em" }}>{p.price}</span>
                  <span className="text-sm" style={{ color: "#7a8099" }}>{p.period}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "#7a8099" }}>{p.desc}</p>
                <ul className="mt-5 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#c4cad6" }}>
                      <span className="text-[10px]" style={{ color: "#4ade80" }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className="mt-7 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all hover:-translate-y-px"
                  style={
                    p.highlight
                      ? { background: "linear-gradient(135deg,#6d5fff,#5b4ee0)", color: "#fff", boxShadow: "0 8px 24px rgba(109,95,255,0.35)" }
                      : { background: "rgba(255,255,255,0.06)", color: "#eef0f6", border: "1px solid rgba(255,255,255,0.10)" }
                  }
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Footer ---------- */}
        <footer
          className="mt-28 flex flex-col items-center justify-between gap-4 py-10 text-xs sm:flex-row"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#7a8099" }}
        >
          <Logo size="sm" />
          <div className="flex items-center gap-6">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
            <Link href="/docs" className="transition-colors hover:text-white">Docs</Link>
            <a href="mailto:hi@thatcode.dev" className="transition-colors hover:text-white">Contact</a>
          </div>
          <span>© 2025 ThatCode · thatcode.dev</span>
        </footer>
      </main>
    </div>
  );
}
