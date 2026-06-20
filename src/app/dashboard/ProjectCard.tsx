"use client";

import Link from "next/link";
import DeleteProjectButton from "./DeleteProjectButton";

interface Props {
  project: {
    id: string;
    name: string;
    updatedAt: Date;
    publishedAt: Date | null;
    visitCount: number;
    hasVersion: boolean;
  };
}

export default function ProjectCard({ project }: Props) {
  const timeAgo = (d: Date) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden transition-all"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(124,106,247,0.35)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}>

      <DeleteProjectButton projectId={project.id} />

      <Link href={`/projects/${project.id}`} className="block">
        {/* Preview thumbnail */}
        <div className="relative overflow-hidden" style={{ height: 156, background: "#161b27" }}>
          {project.hasVersion ? (
            <>
              <iframe
                src={`/api/projects/${project.id}/preview`}
                title={project.name}
                scrolling="no"
                style={{
                  position: "absolute", top: 0, left: 0,
                  width: 1280, height: 720,
                  transform: "scale(0.225)",
                  transformOrigin: "top left",
                  pointerEvents: "none", border: "none",
                }}
              />
              <div className="absolute inset-0" />
              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-12"
                style={{ background: "linear-gradient(to bottom, transparent, #161b27)" }} />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <span className="text-4xl font-bold" style={{ color: "rgba(255,255,255,0.06)" }}>
                {project.name[0]?.toUpperCase()}
              </span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>Not built yet</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#f0f4ff" }}>{project.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "#8b92a5" }}>{timeAgo(project.updatedAt)}</p>
          </div>
          {project.publishedAt && (
            <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium"
              style={{ color: "#34d399" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                style={{ boxShadow: "0 0 5px #34d399" }} />
              Live
              {project.visitCount > 0 && (
                <span className="ml-1" style={{ color: "#8b92a5" }}>· {project.visitCount}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
