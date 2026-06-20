"use client";

import Link from "next/link";
import DeleteProjectButton from "./DeleteProjectButton";

interface Props {
  project: {
    id: string;
    name: string;
    updatedAt: Date;
    publishSlug: string | null;
    publishedAt: Date | null;
    visitCount: number;
  };
}

export default function ProjectCard({ project }: Props) {
  const previewUrl = project.publishSlug
    ? `https://${project.publishSlug}.thatcode.dev`
    : null;

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur transition-all hover:border-fuchsia-400/40 hover:bg-white/[0.05] hover:-translate-y-0.5 overflow-hidden">
      <DeleteProjectButton projectId={project.id} />
      <Link href={`/projects/${project.id}`} className="block">
        {/* Preview area */}
        <div className="relative h-36 bg-[#0d0d12] overflow-hidden rounded-t-2xl">
          {previewUrl ? (
            <>
              <iframe
                src={previewUrl}
                title={project.name}
                scrolling="no"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "1280px",
                  height: "720px",
                  transform: "scale(0.225)",
                  transformOrigin: "top left",
                  pointerEvents: "none",
                  border: "none",
                }}
              />
              {/* Overlay to block clicks on iframe, keep Link working */}
              <div className="absolute inset-0" />
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-4xl font-bold text-white/10 group-hover:text-white/20 transition-colors">
                {project.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Card footer */}
        <div className="p-4">
          <h2 className="font-medium text-white truncate text-sm">{project.name}</h2>
          <p className="text-xs text-gray-500 mt-1">Updated {new Date(project.updatedAt).toLocaleString()}</p>
          {project.publishedAt && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">Live</span>
              {project.visitCount > 0 && (
                <span className="text-[10px] text-gray-500">{project.visitCount} visit{project.visitCount !== 1 ? "s" : ""}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
