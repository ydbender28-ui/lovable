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
  const timeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="group relative rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04] transition-all overflow-hidden">
      <DeleteProjectButton projectId={project.id} />

      <Link href={`/projects/${project.id}`} className="block">
        {/* Preview */}
        <div className="relative bg-[#0c0c10] overflow-hidden" style={{ height: 152 }}>
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
                  pointerEvents: "none",
                  border: "none",
                }}
              />
              <div className="absolute inset-0" />
              {/* Fade bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-10"
                style={{ background: "linear-gradient(to bottom, transparent, #0c0c10)" }} />
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-5xl font-bold text-white/[0.06] select-none">
                {project.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{project.name}</p>
            <p className="text-xs text-gray-600 mt-0.5">{timeAgo(project.updatedAt)}</p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            {project.publishedAt && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 4px #34d399" }} />
                Live
              </span>
            )}
            {project.visitCount > 0 && (
              <span className="text-[10px] text-gray-600">{project.visitCount} visits</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
