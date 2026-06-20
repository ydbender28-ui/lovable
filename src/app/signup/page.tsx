"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Something went wrong");
      setLoading(false);
      return;
    }
    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) { setError("Account created — try logging in."); return; }
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
        <div className="space-y-5">
          <h2 className="text-xl font-bold" style={{ color: "#f0f4ff", letterSpacing: "-0.03em" }}>
            From idea to shipped app in minutes.
          </h2>
          {[
            { icon: "⚡", t: "Instant generation", d: "Full apps built in seconds" },
            { icon: "🎨", t: "Real live preview", d: "See it render as it's built" },
            { icon: "🌐", t: "Publish anywhere", d: "Custom domain or thatcode.dev" },
          ].map(f => (
            <div key={f.t} className="flex items-start gap-3">
              <span className="text-lg mt-0.5">{f.icon}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: "#f0f4ff" }}>{f.t}</p>
                <p className="text-xs mt-0.5" style={{ color: "#8b92a5" }}>{f.d}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: "#4b5263" }}>© {new Date().getFullYear()} ThatCode</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10"><Link href="/"><Logo size="md" /></Link></div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#f0f4ff", letterSpacing: "-0.03em" }}>Create your account</h1>
          <p className="text-sm mb-8" style={{ color: "#8b92a5" }}>Start building apps with AI — free.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Name", type: "text", val: name, set: setName, ph: "Your name" },
              { label: "Email", type: "email", val: email, set: setEmail, ph: "you@example.com" },
              { label: "Password", type: "password", val: password, set: setPassword, ph: "Min. 6 characters" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b92a5", textTransform: "uppercase", letterSpacing: "0.08em" }}>{f.label}</label>
                <input type={f.type} required={f.type !== "text"} minLength={f.type === "password" ? 6 : undefined}
                  value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "rgba(124,106,247,0.6)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
              </div>
            ))}

            {error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7c6af7, #6366f1)", boxShadow: "0 4px 20px rgba(124,106,247,0.3)" }}>
              {loading ? "Creating account…" : "Get started free →"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center" style={{ color: "#8b92a5" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium hover:opacity-80 transition-opacity" style={{ color: "#a78bfa" }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
