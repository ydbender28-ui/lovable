import Link from "next/link";
import Logo from "@/components/Logo";
import { auth } from "@/lib/auth";
import TemplateGrid from "./TemplateGrid";

export default async function TemplatesPage() {
  const session = await auth();
  return (
    <div style={{ background: "#0a0b0e", minHeight: "100vh" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/"><Logo size="md" /></Link>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link href="/dashboard" className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "linear-gradient(135deg,#6d5fff,#5b4ee0)", boxShadow: "0 6px 22px rgba(109,95,255,0.35)" }}>
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm" style={{ color: "#7a8099" }}>Log in</Link>
                <Link href="/signup" className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "linear-gradient(135deg,#6d5fff,#5b4ee0)" }}>Start free</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl" style={{ color: "#eef0f6", letterSpacing: "-0.045em" }}>
            Start from a template
          </h1>
          <p className="mt-3 text-base" style={{ color: "#7a8099" }}>
            Pick one and ThatCode customizes it to your exact needs. Faster than starting from scratch.
          </p>
        </div>
        <TemplateGrid isLoggedIn={!!session?.user} />
      </main>
    </div>
  );
}
