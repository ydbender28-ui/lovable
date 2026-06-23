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
    if (signInRes?.error) {
      setError("Account created — try logging in.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 10,
    padding: "11px 14px",
    color: "#eef0f6",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const focus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(109,95,255,0.6)";
    e.target.style.boxShadow = "0 0 0 4px rgba(109,95,255,0.12)";
  };
  const blur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.10)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#f6f6f8" }}>
      {/* Left panel */}
      <div
        className="relative hidden w-[44%] shrink-0 flex-col justify-between overflow-hidden px-12 py-12 lg:flex"
        style={{ borderRight: "1px solid rgba(255,255,255,0.07)", background: "#0c0d11" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(109,95,255,0.18) 0%, transparent 60%)",
          }}
        />
        <Link href="/" className="relative z-10">
          <Logo size="md" />
        </Link>

        <div className="relative z-10 space-y-7">
          <h2
            className="text-3xl font-bold"
            style={{ color: "#eef0f6", letterSpacing: "-0.035em", lineHeight: 1.1 }}
          >
            From a sentence
            <br />
            to a shipped app.
          </h2>
          {[
            { icon: "⚡", t: "Built in seconds", d: "Full working apps, not boilerplate" },
            { icon: "🖥", t: "Real live preview", d: "See it render as it is written" },
            { icon: "🚀", t: "Publish anywhere", d: "Custom domain or thatcode.dev" },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-3.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                style={{
                  background: "rgba(109,95,255,0.14)",
                  border: "1px solid rgba(109,95,255,0.26)",
                }}
              >
                {f.icon}
              </span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#eef0f6" }}>
                  {f.t}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "#7a8099" }}>
                  {f.d}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-xs" style={{ color: "#4b5263" }}>
          © 2025 ThatCode · thatcode.dev
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Link href="/">
              <Logo size="md" />
            </Link>
          </div>

          <h1
            className="mb-1 text-2xl font-bold"
            style={{ color: "#eef0f6", letterSpacing: "-0.03em" }}
          >
            Create your account
          </h1>
          <p className="mb-8 text-sm" style={{ color: "#7a8099" }}>
            Start building apps for free.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Name", type: "text", val: name, set: setName, ph: "Your name" },
              { label: "Email", type: "email", val: email, set: setEmail, ph: "you@example.com" },
              { label: "Password", type: "password", val: password, set: setPassword, ph: "Min. 6 characters" },
            ].map((f) => (
              <div key={f.label}>
                <label
                  className="mb-1.5 block text-xs font-medium"
                  style={{ color: "#7a8099", textTransform: "uppercase", letterSpacing: "0.08em" }}
                >
                  {f.label}
                </label>
                <input
                  type={f.type}
                  required={f.type !== "text"}
                  minLength={f.type === "password" ? 6 : undefined}
                  value={f.val}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.ph}
                  style={inputStyle}
                  onFocus={focus}
                  onBlur={blur}
                />
              </div>
            ))}

            {error && (
              <p
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  color: "#fb7185",
                  background: "rgba(244,63,94,0.08)",
                  border: "1px solid rgba(244,63,94,0.22)",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #6d5fff, #5b4ee0)",
                boxShadow: "0 6px 24px rgba(109,95,255,0.35)",
              }}
            >
              {loading ? "Creating account…" : "Get started free →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "#7a8099" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium transition-opacity hover:opacity-80" style={{ color: "#a78bfa" }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
