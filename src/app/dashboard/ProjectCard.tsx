"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function ProjectCard({ project }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl transition-all duration-200"
      style={{ background: "#ffffff", border: "1px solid #ececf1", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(106,31,247,0.4)";
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(106,31,247,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#ececf1";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
      }}
    >
      <DeleteProjectButton projectId={project.id} />

      <Link href={`/projects/${project.id}`} className="block">
        <div className="relative overflow-hidden" style={{ height: 160, background: "#f6f6f8" }}>
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
                  transform: "scale(0.23)",
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
              className="flex h-full flex-col items-center justify-center gap-1"
              style={{
                background:
                  "radial-gradient(ellipse 80% 80% at 50% 30%, rgba(106,31,247,0.08) 0%, transparent 70%)",
              }}
            >
              <span
                className="text-6xl font-bold"
                style={{
                  backgroundImage: "linear-gradient(135deg, rgba(106,31,247,0.3), rgba(10,143,240,0.15))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.04em",
                }}
              >
                {project.name[0]?.toUpperCase()}
              </span>
              <span className="text-xs" style={{ color: "#71717f" }}>
                Generate your first build
              </span>
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-between gap-2 px-4 py-3"
          style={{ borderTop: "1px solid #ececf1" }}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: "#17171c" }}>
              {project.name}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "#71717f" }}>
              {mounted ? timeAgo(project.updatedAt) : formatDate(project.updatedAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {project.isPrivate && (
              <span className="text-[10px] font-medium text-amber-500/80" title="Private project">🔒</span>
            )}
            {project.publishedAt && (
              <div
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: "#16a34a" }}
              >
                <span className="animate-dot-pulse h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
                Live
                {project.visitCount > 0 && (
                  <span className="ml-1" style={{ color: "#71717f" }}>· {project.visitCount}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
