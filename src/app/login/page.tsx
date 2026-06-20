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
    if (res?.error) {
      setError("Invalid email or password");
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
    <div className="flex min-h-screen" style={{ background: "#0a0b0e" }}>
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

        <div className="relative z-10 space-y-8">
          <h2
            className="text-3xl font-bold"
            style={{ color: "#eef0f6", letterSpacing: "-0.035em", lineHeight: 1.1 }}
          >
            Your ideas deserve
            <br />
            to actually exist.
          </h2>
          <div className="space-y-4 pt-2">
            {[
              "Build a working app in under a minute",
              "Watch a live preview render as it writes",
              "Publish to your own custom domain",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm" style={{ color: "#c4cad6" }}>
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]"
                  style={{
                    background: "rgba(109,95,255,0.18)",
                    border: "1px solid rgba(109,95,255,0.32)",
                    color: "#a78bfa",
                  }}
                >
                  ✓
                </span>
                {f}
              </div>
            ))}
          </div>
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
            Welcome back
          </h1>
          <p className="mb-8 text-sm" style={{ color: "#7a8099" }}>
            Log in to continue building.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="mb-1.5 block text-xs font-medium"
                style={{ color: "#7a8099", textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-xs font-medium"
                style={{ color: "#7a8099", textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={focus}
                onBlur={blur}
              />
            </div>

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
              {loading ? "Logging in…" : "Log in →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "#7a8099" }}>
            No account?{" "}
            <Link href="/signup" className="font-medium transition-opacity hover:opacity-80" style={{ color: "#a78bfa" }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
