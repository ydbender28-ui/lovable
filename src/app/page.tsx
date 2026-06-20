import Link from "next/link";
import { auth } from "@/lib/auth";
import Logo from "@/components/Logo";

const FEATURES = [
  {
    icon: "⚡",
    title: "Built in seconds",
    desc: "Describe it once. A working app appears in under thirty seconds.",
    tint: "rgba(109,95,255,0.16)",
    ring: "rgba(109,95,255,0.32)",
  },
  {
    icon: "🖥",
    title: "Live preview",
    desc: "Watch the real app render as it is written, not a mockup.",
    tint: "rgba(45,212,191,0.14)",
    ring: "rgba(45,212,191,0.30)",
  },
  {
    icon: "🚀",
    title: "Publish anywhere",
    desc: "Ship to thatcode.dev or your own custom domain in one click.",
    tint: "rgba(245,158,11,0.14)",
    ring: "rgba(245,158,11,0.30)",
  },
  {
    icon: "↺",
    title: "Every version saved",
    desc: "Roll back to any past build the moment you change your mind.",
    tint: "rgba(244,63,94,0.13)",
    ring: "rgba(244,63,94,0.28)",
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
          <div
            className="hidden items-center gap-8 text-sm md:flex"
            style={{ color: "#7a8099" }}
          >
            {["Features", "Pricing", "Docs"].map((l) => (
              <a
                key={l}
                href="#"
                className="transition-colors"
                style={{ color: "#7a8099" }}
                onMouseEnter={undefined}
              >
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-px"
                style={{
                  background: "linear-gradient(135deg, #6d5fff, #5b4ee0)",
                  boxShadow: "0 6px 22px rgba(109,95,255,0.35)",
                }}
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm transition-colors"
                  style={{ color: "#c4cad6" }}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-px"
                  style={{
                    background: "linear-gradient(135deg, #6d5fff, #5b4ee0)",
                    boxShadow: "0 6px 22px rgba(109,95,255,0.35)",
                  }}
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
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#c4cad6",
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full"
                style={{ background: "#6d5fff", opacity: 0.7 }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: "#6d5fff" }}
              />
            </span>
            Now with multi-model AI
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-slide-up max-w-3xl text-5xl font-bold sm:text-6xl lg:text-[78px]"
            style={{
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
              color: "#eef0f6",
              animationDelay: "0.05s",
            }}
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
            live preview, and ships a real working app you can publish.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-slide-up mt-9 flex flex-col items-center gap-3 sm:flex-row"
            style={{ animationDelay: "0.15s" }}
          >
            <Link
              href={startHref}
              className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #7b6dff, #5b4ee0)",
                boxShadow: "0 10px 40px rgba(109,95,255,0.40)",
              }}
            >
              Start building free →
            </Link>
            <a
              href="#"
              className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-medium transition-all hover:bg-white/[0.06]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#c4cad6",
              }}
            >
              See how it works
            </a>
          </div>

          {/* ---------- Browser mockup ---------- */}
          <div
            className="animate-fade-slide-up relative mt-20 w-full max-w-4xl"
            style={{ animationDelay: "0.22s" }}
          >
            {/* glow underneath */}
            <div
              className="animate-glow-pulse pointer-events-none absolute -inset-x-10 bottom-[-40px] top-10 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse 60% 55% at 50% 60%, rgba(109,95,255,0.45) 0%, transparent 70%)",
                filter: "blur(50px)",
              }}
            />
            <div
              className="animate-float overflow-hidden rounded-2xl text-left"
              style={{
                background: "#111318",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow:
                  "0 40px 120px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Window chrome */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: "#febc2e" }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: "#28c840" }} />
                </div>
                <div
                  className="ml-2 flex h-7 flex-1 items-center gap-2 rounded-md px-3 text-xs"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#7a8099" }}
                >
                  <span style={{ color: "#22c55e" }}>●</span>
                  myapp.thatcode.dev
                </div>
              </div>

              {/* Fake app body */}
              <div className="relative" style={{ background: "#0d0e12" }}>
                {/* moving beam highlight */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div
                    className="animate-beam absolute -top-10 left-0 h-[160%] w-24"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
                    }}
                  />
                </div>

                <div className="grid grid-cols-[150px_1fr] gap-0">
                  {/* sidebar */}
                  <div
                    className="hidden flex-col gap-2 p-4 sm:flex"
                    style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-8 w-full rounded-md"
                      style={{ background: "linear-gradient(135deg, rgba(109,95,255,0.30), rgba(109,95,255,0.10))" }}
                    />
                    {[0.5, 0.7, 0.6, 0.8].map((w, i) => (
                      <div
                        key={i}
                        className="h-5 rounded"
                        style={{ width: `${w * 100}%`, background: "rgba(255,255,255,0.05)" }}
                      />
                    ))}
                  </div>

                  {/* main */}
                  <div className="p-6">
                    <div
                      className="mb-5 h-7 w-40 rounded"
                      style={{ background: "rgba(255,255,255,0.10)" }}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="rounded-lg p-4"
                          style={{
                            background: "rgba(255,255,255,0.035)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div
                            className="mb-3 h-9 w-9 rounded-lg"
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(109,95,255,0.45), rgba(61,169,255,0.30))",
                            }}
                          />
                          <div
                            className="mb-2 h-3 w-full rounded"
                            style={{ background: "rgba(255,255,255,0.09)" }}
                          />
                          <div
                            className="h-3 w-2/3 rounded"
                            style={{ background: "rgba(255,255,255,0.05)" }}
                          />
                        </div>
                      ))}
                    </div>
                    <div
                      className="mt-4 h-28 rounded-lg"
                      style={{
                        background:
                          "linear-gradient(120deg, rgba(109,95,255,0.16), rgba(61,169,255,0.06))",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stat pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {[
              { v: "10k+", l: "apps built" },
              { v: "< 30 sec", l: "to first build" },
              { v: "Free", l: "to start" },
            ].map((s) => (
              <div
                key={s.l}
                className="flex items-baseline gap-2 rounded-full px-4 py-2"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span className="text-sm font-semibold" style={{ color: "#eef0f6" }}>
                  {s.v}
                </span>
                <span className="text-xs" style={{ color: "#7a8099" }}>
                  {s.l}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Features strip ---------- */}
        <section className="mt-32 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl p-6 transition-all hover:-translate-y-1"
              style={{
                background: "#111318",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{ background: f.tint, border: `1px solid ${f.ring}` }}
              >
                {f.icon}
              </div>
              <h3 className="mb-1.5 text-sm font-semibold" style={{ color: "#eef0f6" }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#7a8099" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </section>

        {/* ---------- Footer ---------- */}
        <footer
          className="mt-28 flex items-center justify-center py-10 text-xs"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#7a8099" }}
        >
          © 2025 ThatCode · thatcode.dev
        </footer>
      </main>
    </div>
  );
}
