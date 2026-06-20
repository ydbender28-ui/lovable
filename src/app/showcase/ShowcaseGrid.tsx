"use client";

interface Project {
  id: string;
  name: string;
  publishSlug: string | null;
  visitCount: number;
  owner: { name: string | null };
}

export default function ShowcaseGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-5xl mb-4">🚀</p>
        <p className="text-lg font-semibold mb-2" style={{ color: "#eef0f6" }}>Be the first to publish</p>
        <p className="text-sm mb-6" style={{ color: "#7a8099" }}>Build something amazing and publish it to get featured here.</p>
        <a href="/signup" className="rounded-xl px-6 py-3 text-sm font-semibold text-white inline-block" style={{ background: "linear-gradient(135deg,#6d5fff,#5b4ee0)", boxShadow: "0 8px 24px rgba(109,95,255,0.35)" }}>
          Start building →
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <a
          key={p.id}
          href={`https://${p.publishSlug}.thatcode.xyz`}
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
            <span className="shrink-0 text-xs" style={{ color: "#4b5263" }}>↗</span>
          </div>
        </a>
      ))}
    </div>
  );
}
