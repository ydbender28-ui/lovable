"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProjectCard from "./ProjectCard";
import NewAgentButton from "./NewAgentButton";

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

export default function DashboardTabs({
  projects,
  agents,
}: {
  projects: Project[];
  agents: Agent[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"apps" | "agents">("apps");
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  async function build() {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: trimmed }),
    });
    const project = await res.json();
    router.push(`/projects/${project.id}?prompt=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div>
      {/* ---------- Tab bar ---------- */}
      <div
        className="mb-8 flex items-center gap-1"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {(["apps", "agents"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative px-4 py-2.5 text-sm font-medium capitalize transition-colors"
            style={{ color: tab === t ? "#eef0f6" : "#7a8099" }}
          >
            {t}
            {t === "apps" && projects.length > 0 && (
              <span
                className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: "rgba(109,95,255,0.16)", color: "#a78bfa" }}
              >
                {projects.length}
              </span>
            )}
            {tab === t && (
              <span
                className="absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full"
                style={{ background: "linear-gradient(90deg, #6d5fff, #a78bfa)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ---------- Apps ---------- */}
      {tab === "apps" && (
        <div>
          {/* New app input */}
          <div
            className="w-full rounded-2xl transition-all"
            style={{
              background: "#111318",
              border: `1px solid ${focused ? "rgba(109,95,255,0.55)" : "rgba(255,255,255,0.08)"}`,
              boxShadow: focused ? "0 0 0 4px rgba(109,95,255,0.12)" : "none",
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  build();
                }
              }}
              placeholder="Describe the app you want to build…"
              rows={3}
              className="w-full resize-none bg-transparent px-4 py-3.5 text-sm focus:outline-none"
              style={{ color: "#eef0f6" }}
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <span className="text-[10px]" style={{ color: "#5b6070" }}>
                ⏎ to build · Shift+⏎ for newline
              </span>
              <button
                onClick={build}
                disabled={!prompt.trim() || loading}
                className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #6d5fff, #5b4ee0)",
                  boxShadow: "0 4px 18px rgba(109,95,255,0.30)",
                }}
              >
                {loading ? "Creating…" : "Build →"}
              </button>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.01)" }}>
                <p className="text-2xl mb-2">✨</p>
                <p className="text-sm font-medium mb-1" style={{ color: "#eef0f6" }}>No apps yet</p>
                <p className="text-xs mb-4" style={{ color: "#7a8099" }}>Describe what you want above, or start from a template.</p>
                <Link href="/templates" className="inline-block rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-px" style={{ background: "linear-gradient(135deg,#6d5fff,#5b4ee0)", boxShadow: "0 4px 16px rgba(109,95,255,0.30)" }}>
                  Browse templates →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- Agents ---------- */}
      {tab === "agents" && (
        <div>
          <NewAgentButton />
          {agents.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="group flex items-start gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                  style={{
                    background: "#111318",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "rgba(109,95,255,0.35)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")
                  }
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{
                      background: "rgba(109,95,255,0.12)",
                      border: "1px solid rgba(109,95,255,0.22)",
                    }}
                  >
                    {agent.avatar}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-semibold"
                      style={{ color: "#eef0f6" }}
                    >
                      {agent.name}
                    </p>
                    {agent.description && (
                      <p className="mt-0.5 truncate text-xs" style={{ color: "#7a8099" }}>
                        {agent.description}
                      </p>
                    )}
                    <span
                      className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={
                        agent.public
                          ? {
                              background: "rgba(34,197,94,0.10)",
                              border: "1px solid rgba(34,197,94,0.28)",
                              color: "#4ade80",
                            }
                          : {
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.10)",
                              color: "#7a8099",
                            }
                      }
                    >
                      {agent.public ? "Public" : "Private"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div
              className="mt-6 rounded-2xl p-16 text-center"
              style={{
                border: "1px dashed rgba(255,255,255,0.09)",
                background: "rgba(255,255,255,0.01)",
              }}
            >
              <p className="text-sm" style={{ color: "#7a8099" }}>
                No agents yet — create one above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
