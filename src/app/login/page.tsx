"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError("Invalid email or password"); return; }
    router.push("/dashboard");
    router.refresh();
  }

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "11px 14px", color: "#f0f4ff", fontSize: 14, outline: "none",
  };

  return (
    <div className="min-h-screen flex"
      style={{ background: "radial-gradient(ellipse 70% 50% at 50% -5%, #1a1040 0%, #0e1117 60%)" }}>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-96 shrink-0 px-10 py-12 justify-between"
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/"><Logo size="md" /></Link>
        <div className="space-y-6">
          <h2 className="text-xl font-bold" style={{ color: "#f0f4ff", letterSpacing: "-0.03em" }}>
            Your ideas deserve to exist.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#8b92a5" }}>
            ThatCode turns plain English into working apps — with live preview, instant publish, and version history.
          </p>
          <div className="space-y-3 pt-2">
            {["Build apps in under a minute", "Live preview as it generates", "Publish with custom domain"].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#c4cad6" }}>
                <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px]"
                  style={{ background: "rgba(124,106,247,0.2)", color: "#a78bfa" }}>✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: "#4b5263" }}>© {new Date().getFullYear()} ThatCode</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10"><Link href="/"><Logo size="md" /></Link></div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#f0f4ff", letterSpacing: "-0.03em" }}>Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: "#8b92a5" }}>Log in to continue building.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b92a5", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "rgba(124,106,247,0.6)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b92a5", textTransform: "uppercase", letterSpacing: "0.08em" }}>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "rgba(124,106,247,0.6)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
            </div>

            {error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7c6af7, #6366f1)", boxShadow: "0 4px 20px rgba(124,106,247,0.3)" }}>
              {loading ? "Logging in…" : "Log in →"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center" style={{ color: "#8b92a5" }}>
            No account?{" "}
            <Link href="/signup" className="font-medium transition-colors hover:opacity-80" style={{ color: "#a78bfa" }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
