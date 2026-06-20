import Link from "next/link";
import { auth } from "@/lib/auth";
import Logo from "@/components/Logo";

export default async function Home() {
  const session = await auth();

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, #1e1545 0%, #0e1117 55%)" }}>

      {/* Grid overlay */}
      <div className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #6d28d9 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div className="absolute top-[40%] left-[15%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute top-[30%] right-[10%] w-[250px] h-[250px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)", filter: "blur(50px)" }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 w-full px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Link href="/dashboard"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7c6af7, #6366f1)" }}>
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login"
                className="px-4 py-2 text-sm text-[#8b92a5] hover:text-white transition-colors">
                Log in
              </Link>
              <Link href="/signup"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7c6af7, #6366f1)" }}>
                Get started free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6 py-20">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
          style={{ background: "rgba(124,106,247,0.12)", border: "1px solid rgba(124,106,247,0.3)", color: "#a78bfa" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Ship your idea today — no code needed
        </div>

        {/* Headline */}
        <h1 className="max-w-3xl text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.06] mb-6"
          style={{ letterSpacing: "-0.04em", color: "#f0f4ff" }}>
          Build real apps
          <br />
          <span style={{
            backgroundImage: "linear-gradient(135deg, #a78bfa 0%, #7c6af7 40%, #6366f1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            in seconds.
          </span>
        </h1>

        <p className="text-lg max-w-xl leading-relaxed mb-10" style={{ color: "#8b92a5" }}>
          Describe what you want in plain English. ThatCode writes the code,
          shows a live preview, and ships a working app — instantly.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg">
          <Link href={session?.user ? "/dashboard" : "/signup"}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #7c6af7, #6366f1)", boxShadow: "0 8px 32px rgba(124,106,247,0.35)" }}>
            Start building free →
          </Link>
          <Link href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#c4cad6" }}>
            Log in
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl w-full">
          {[
            { icon: "⚡", label: "Instant generation", desc: "Apps in under 30 seconds" },
            { icon: "👁", label: "Live preview", desc: "See it as it's built" },
            { icon: "🌐", label: "One-click publish", desc: "Custom domain support" },
            { icon: "🕐", label: "Version history", desc: "Restore any past build" },
          ].map((f) => (
            <div key={f.label} className="rounded-xl p-4 text-left"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <p className="text-sm font-medium mb-1" style={{ color: "#f0f4ff" }}>{f.label}</p>
              <p className="text-xs" style={{ color: "#8b92a5" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
