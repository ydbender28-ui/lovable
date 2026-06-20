import Link from "next/link";
import { auth } from "@/lib/auth";
import Logo from "@/components/Logo";

export default async function Home() {
  const session = await auth();

  return (
    <div className="relative flex flex-col min-h-screen bg-[#080809] overflow-hidden">

      {/* Subtle noise texture overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />

      {/* Glow spots */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-200px] left-[10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute top-[100px] right-[5%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #0ea5e9 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 w-full px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Logo size="md" />
        <div className="flex items-center gap-2 text-sm">
          {session?.user ? (
            <Link href="/dashboard"
              className="rounded-lg bg-white text-black px-4 py-2 font-medium text-sm hover:bg-gray-100 transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors px-3 py-2 text-sm">
                Log in
              </Link>
              <Link href="/signup"
                className="rounded-lg bg-white text-black px-4 py-2 font-medium text-sm hover:bg-gray-100 transition-colors">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6 pt-16 pb-24">

        {/* Pill badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-gray-400">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" style={{ boxShadow: "0 0 6px #7c3aed" }} />
          Build full-stack apps with one sentence
        </div>

        <h1 className="max-w-3xl text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.05] tracking-tight" style={{ letterSpacing: "-0.03em" }}>
          From idea to{" "}
          <span style={{ background: "linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            working app
          </span>
          <br />in seconds.
        </h1>

        <p className="mt-6 text-lg text-gray-500 max-w-xl leading-relaxed">
          Describe what you want. ThatCode writes the code, renders a live preview, and ships it — no setup, no config, no waiting.
        </p>

        {/* CTA input-style button */}
        <div className="mt-10 w-full max-w-xl">
          <Link href={session?.user ? "/dashboard" : "/signup"}
            className="group flex items-center gap-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left hover:border-white/20 hover:bg-white/[0.06] transition-all">
            <span className="flex-1 text-sm text-gray-500">Build a SaaS dashboard, e-commerce store, CRM…</span>
            <span className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all group-hover:translate-x-0.5"
              style={{ background: "linear-gradient(135deg, #7c3aed, #0ea5e9)" }}>
              Start →
            </span>
          </Link>
        </div>

        {/* Social proof / feature strip */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.06] max-w-2xl w-full">
          {[
            { label: "Live preview", desc: "Instant sandbox" },
            { label: "Multi-model", desc: "GPT · Claude · Gemini" },
            { label: "One-click publish", desc: "Custom domains" },
            { label: "Version history", desc: "Restore any build" },
          ].map((f) => (
            <div key={f.label} className="bg-[#080809] px-5 py-4">
              <p className="text-xs font-medium text-white">{f.label}</p>
              <p className="text-xs text-gray-600 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
