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
  // Avoid hydration mismatch — Date.now() differs between server and client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl transition-all duration-200"
      style={{ background: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(109,95,255,0.45)";
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 18px 50px rgba(0,0,0,0.45), 0 0 0 1px rgba(109,95,255,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <DeleteProjectButton projectId={project.id} />

      <Link href={`/projects/${project.id}`} className="block">
        {/* Preview area */}
        <div className="relative overflow-hidden" style={{ height: 160, background: "#0d0e12" }}>
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
                style={{ background: "linear-gradient(to bottom, transparent, #0d0e12)" }}
              />
            </>
          ) : (
            <div
              className="flex h-full flex-col items-center justify-center gap-1"
              style={{
                background:
                  "radial-gradient(ellipse 80% 80% at 50% 30%, rgba(109,95,255,0.10) 0%, transparent 70%)",
              }}
            >
              <span
                className="text-6xl font-bold"
                style={{
                  backgroundImage: "linear-gradient(135deg, rgba(167,139,250,0.35), rgba(109,95,255,0.10))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.04em",
                }}
              >
                {project.name[0]?.toUpperCase()}
              </span>
              <span className="text-xs" style={{ color: "#5b6070" }}>
                Generate your first build
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-2 px-4 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: "#eef0f6" }}>
              {project.name}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "#7a8099" }}>
              {mounted ? timeAgo(project.updatedAt) : formatDate(project.updatedAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {project.isPrivate && (
              <span className="text-[10px] font-medium text-amber-400/80" title="Private project">🔒</span>
            )}
            {project.publishedAt && (
              <div
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: "#4ade80" }}
              >
                <span className="animate-dot-pulse h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
                Live
                {project.visitCount > 0 && (
                  <span className="ml-1" style={{ color: "#7a8099" }}>· {project.visitCount}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
