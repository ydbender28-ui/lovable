import Link from "next/link";
import Logo from "@/components/Logo";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export default async function ShowcasePage() {
  const published = await prisma.project.findMany({
    where: { publishedAt: { not: null }, publishSlug: { not: null } },
    orderBy: { visitCount: "desc" },
    take: 30,
    select: {
      id: true,
      name: true,
      publishSlug: true,
      visitCount: true,
      publishedAt: true,
      owner: { select: { name: true } },
    },
  });

  return (
    <div style={{ background: "#0a0b0e", minHeight: "100vh" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/"><Logo size="md" /></Link>
          <div className="flex items-center gap-4 text-sm" style={{ color: "#7a8099" }}>
            <Link href="/templates" className="transition-colors hover:text-white" style={{ color: "#7a8099" }}>Templates</Link>
            <Link href="/showcase" className="transition-colors" style={{ color: "#eef0f6" }}>Showcase</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm" style={{ color: "#7a8099" }}>Log in</Link>
            <Link href="/signup" className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "linear-gradient(135deg,#6d5fff,#5b4ee0)" }}>Start free</Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl" style={{ color: "#eef0f6", letterSpacing: "-0.045em" }}>
            Built with ThatCode
          </h1>
          <p className="mt-3 text-base" style={{ color: "#7a8099" }}>
            Real apps made by real people. Click any to visit the live site.
          </p>
        </div>

        {published.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">🚀</p>
            <p className="text-lg font-semibold mb-2" style={{ color: "#eef0f6" }}>Be the first to publish</p>
            <p className="text-sm mb-6" style={{ color: "#7a8099" }}>Build something amazing and publish it to get featured here.</p>
            <Link href="/signup" className="rounded-xl px-6 py-3 text-sm font-semibold text-white inline-block" style={{ background: "linear-gradient(135deg,#6d5fff,#5b4ee0)", boxShadow: "0 8px 24px rgba(109,95,255,0.35)" }}>
              Start building →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {published.map((p) => (
              <a
                key={p.id}
                href={`https://${p.publishSlug}.thatcode.dev`}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-1 block"
                style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(109,95,255,0.4)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Preview iframe */}
                <div className="relative overflow-hidden" style={{ height: 180, background: "#0d0e12" }}>
                  <iframe
                    src={`/api/projects/${p.id}/preview`}
                    scrolling="no"
                    style={{
                      position: "absolute", top: 0, left: 0,
                      width: 1280, height: 720,
                      transform: "scale(0.25)", transformOrigin: "top left",
                      pointerEvents: "none", border: "none",
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(to bottom, transparent, #0d0e12)" }} />
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px]" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
                    Live
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "#eef0f6" }}>{p.name}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "#7a8099" }}>
                      by {p.owner.name ?? "Anonymous"}
                      {p.visitCount > 0 && <span className="ml-2">· {p.visitCount} visits</span>}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs transition-colors" style={{ color: "#4b5263" }}>
                    ↗
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
