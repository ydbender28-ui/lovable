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

  return (
    <div className="min-h-screen flex bg-[#080809]">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[420px] shrink-0 border-r border-white/[0.06] p-10 justify-between">
        <Link href="/"><Logo size="md" /></Link>
        <div>
          <blockquote className="text-base text-gray-400 leading-relaxed">
            &ldquo;Built our internal CRM in 20 minutes. Would have taken our dev team two weeks.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-gray-600">— Early user</p>
        </div>
        <p className="text-xs text-gray-700">© {new Date().getFullYear()} ThatCode</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Link href="/"><Logo size="md" /></Link></div>

          <h1 className="text-2xl font-semibold text-white mb-1" style={{ letterSpacing: "-0.02em" }}>Welcome back</h1>
          <p className="text-sm text-gray-500 mb-8">Log in to continue building.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7c3aed, #0ea5e9)" }}>
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600 text-center">
            No account?{" "}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
