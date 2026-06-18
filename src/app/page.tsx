import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="relative flex flex-col flex-1 items-center justify-center overflow-hidden bg-[#0a0a0f]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-fuchsia-600/30 via-purple-600/20 to-indigo-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:32px_32px]" />
      </div>

      <nav className="relative z-10 w-full px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500" />
          <span className="font-semibold text-white">lovable<span className="text-fuchsia-400">.clone</span></span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-white text-black px-4 py-2 font-medium hover:bg-gray-200 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white transition-colors px-3 py-2">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-white text-black px-4 py-2 font-medium hover:bg-gray-200 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex flex-1 w-full max-w-3xl flex-col items-center justify-center text-center px-6 -mt-16">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse-glow" />
          Powered by Claude
        </span>

        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-white leading-[1.1]">
          Build something{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            extraordinary
          </span>
        </h1>
        <p className="mt-5 text-lg text-gray-400 max-w-xl">
          Describe the app you want in plain English. Watch Claude write the
          code, spin up a live preview, and ship a working product — in
          minutes.
        </p>

        <div className="mt-10 w-full">
          <Link
            href={session?.user ? "/dashboard" : "/signup"}
            className="group w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left backdrop-blur transition-colors hover:border-fuchsia-400/40 hover:bg-white/[0.05]"
          >
            <span className="flex-1 text-gray-400 text-sm sm:text-base">
              Ask Lovable Clone to build a&hellip; landing page, dashboard, SaaS app
            </span>
            <span className="rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white transition-transform group-hover:translate-x-0.5">
              Start building →
            </span>
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
          {["AI code generation", "Live sandbox preview", "Version history", "One-click export"].map((f) => (
            <span key={f} className="rounded-full border border-white/10 px-3 py-1">
              {f}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
