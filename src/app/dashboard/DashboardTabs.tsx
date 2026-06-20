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
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-8 border-b border-white/[0.06]">
        <button
          onClick={() => setTab("apps")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${tab === "apps" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          Apps
          {tab === "apps" && <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />}
        </button>
        <button
          onClick={() => setTab("agents")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${tab === "agents" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          Agents
          {tab === "agents" && <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />}
        </button>
      </div>

      {/* Apps tab */}
      {tab === "apps" && (
        <div>
          <NewProjectButton />
          {projects.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] p-14 text-center">
              <p className="text-sm text-gray-600">No apps yet — describe one above.</p>
            </div>
          )}
        </div>
      )}

      {/* Agents tab */}
      {tab === "agents" && (
        <div>
          <NewAgentButton />
          {agents.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}
                  className="group flex items-start gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xl">
                    {agent.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                    {agent.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{agent.description}</p>}
                    <span className={`mt-2 inline-block text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${agent.public ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.08]" : "border-white/10 text-gray-600"}`}>
                      {agent.public ? "Public" : "Private"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] p-14 text-center">
              <p className="text-sm text-gray-600">No agents yet — create one above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
