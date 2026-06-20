"use client";

import { useState } from "react";
import Link from "next/link";
import NewProjectButton from "./NewProjectButton";
import NewAgentButton from "./NewAgentButton";
import ProjectCard from "./ProjectCard";

interface Project {
  id: string;
  name: string;
  updatedAt: Date;
  publishedAt: Date | null;
  visitCount: number;
  hasVersion: boolean;
}

interface Agent {
  id: string;
  name: string;
  description: string | null;
  avatar: string;
  slug: string;
  public: boolean;
}

export default function DashboardTabs({ projects, agents }: { projects: Project[]; agents: Agent[] }) {
  const [tab, setTab] = useState<"apps" | "agents">("apps");

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        {(["apps", "agents"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="relative px-4 py-2.5 text-sm font-medium capitalize transition-colors"
            style={{ color: tab === t ? "#f0f4ff" : "#8b92a5" }}>
            {t}
            {t === "apps" && projects.length > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(124,106,247,0.15)", color: "#a78bfa" }}>
                {projects.length}
              </span>
            )}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, #7c6af7, #6366f1)" }} />
            )}
          </button>
        ))}
      </div>

      {/* Apps */}
      {tab === "apps" && (
        <div>
          <NewProjectButton />
          {projects.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl p-16 text-center"
              style={{ border: "1px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.01)" }}>
              <p className="text-sm" style={{ color: "#8b92a5" }}>No apps yet — describe one above to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Agents */}
      {tab === "agents" && (
        <div>
          <NewAgentButton />
          {agents.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {agents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}
                  className="group flex items-start gap-4 rounded-2xl p-5 transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
                  <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(124,106,247,0.12)", border: "1px solid rgba(124,106,247,0.2)" }}>
                    {agent.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#f0f4ff" }}>{agent.name}</p>
                    {agent.description && <p className="text-xs mt-0.5 truncate" style={{ color: "#8b92a5" }}>{agent.description}</p>}
                    <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={agent.public
                        ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#8b92a5" }}>
                      {agent.public ? "Public" : "Private"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl p-16 text-center"
              style={{ border: "1px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.01)" }}>
              <p className="text-sm" style={{ color: "#8b92a5" }}>No agents yet — create one above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
