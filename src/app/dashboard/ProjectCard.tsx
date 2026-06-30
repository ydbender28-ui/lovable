"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DeleteProjectButton from "./DeleteProjectButton";

interface Props {
  project: {
    id: string;
    name: string;
    updatedAt: Date;
    publishedAt: Date | null;
    visitCount: number;
    hasVersion: boolean;
    isPrivate: boolean;
  };
}

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getProjectColor(id: string): string {
  const colors = ["#6366F1", "#E11D48", "#10B981", "#F59E0B", "#7C3AED", "#0EA5E9", "#F97316", "#EC4899"];
  const idx = id.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function ProjectCard({ project }: Props) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  async function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDuplicating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.id) router.push(`/projects/${data.id}`);
    } catch {
      setDuplicating(false);
    }
  }

  const color = getProjectColor(project.id);
  const initials = project.name.slice(0, 2).toUpperCase();
  const isPublished = !!project.publishedAt;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl transition-all duration-200"
      style={{
        background: "#ffffff",
        border: `1px solid ${hovered ? "rgba(106,31,247,0.4)" : "#ececf1"}`,
        boxShadow: hovered
          ? "0 12px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(106,31,247,0.12)"
          : "0 1px 3px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <DeleteProjectButton projectId={project.id} />

      <Link href={`/projects/${project.id}`} className="block">
        {/* Thumbnail */}
        <div className="relative overflow-hidden" style={{ height: 140, borderRadius: "12px 12px 0 0" }}>
          {project.hasVersion ? (
            <>
              <iframe
                src={`/api/projects/${project.id}/preview`}
                title={project.name}
                scrolling="no"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 1280,
                  height: 720,
                  transform: "scale(0.22)",
                  transformOrigin: "top left",
                  pointerEvents: "none",
                  border: "none",
                }}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-12"
                style={{ background: "linear-gradient(to bottom, transparent, #f6f6f8)" }}
              />
            </>
          ) : (
            <div
              style={{
                height: 140,
                background: `linear-gradient(135deg, ${color}20, ${color}05)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                fontWeight: 900,
                color: color,
                letterSpacing: "-0.05em",
                userSelect: "none",
              }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Card body */}
        <div
          className="px-4 py-3"
          style={{ borderTop: "1px solid #ececf1" }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: "#17171c" }}>
                {project.name}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "#71717f" }}>
                {mounted ? timeAgo(project.updatedAt) : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {/* Status badge */}
              {isPublished ? (
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.28)", color: "#16a34a" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
                  Published
                </span>
              ) : (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: "#f6f6f8", border: "1px solid #ececf1", color: "#71717f" }}
                >
                  Draft
                </span>
              )}
              {/* Visit count */}
              {isPublished && project.visitCount > 0 && (
                <span className="text-[10px]" style={{ color: "#71717f" }}>
                  👁 {project.visitCount.toLocaleString()} views
                </span>
              )}
              {project.isPrivate && (
                <span className="text-[10px] text-amber-500/80" title="Private project">🔒</span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Quick actions — visible on hover */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 px-4 pb-3 pt-6 transition-all duration-200"
        style={{
          background: "linear-gradient(to top, rgba(255,255,255,0.97) 60%, transparent)",
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? "auto" : "none",
          transform: hovered ? "translateY(0)" : "translateY(4px)",
        }}
      >
        <Link
          href={`/projects/${project.id}`}
          onClick={(e) => e.stopPropagation()}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{ background: "linear-gradient(135deg,#6a1ff7,#0a8ff0)", color: "#fff" }}
        >
          Edit
        </Link>
        {project.hasVersion && (
          <Link
            href={`/api/projects/${project.id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[#f6f6f8]"
            style={{ borderColor: "#ececf1", color: "#17171c" }}
          >
            Preview
          </Link>
        )}
        {isPublished && (
          <a
            href={`/a/${project.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[#f6f6f8]"
            style={{ borderColor: "#ececf1", color: "#16a34a" }}
          >
            Visit ↗
          </a>
        )}
        <button
          onClick={handleDuplicate}
          disabled={duplicating}
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[#f6f6f8]"
          style={{ borderColor: "#ececf1", color: "#71717f", opacity: duplicating ? 0.6 : 1 }}
        >
          {duplicating ? "Copying…" : "Duplicate"}
        </button>
      </div>
    </div>
  );
}
