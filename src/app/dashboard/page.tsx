import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewProjectButton from "./NewProjectButton";
import NewAgentButton from "./NewAgentButton";
import SignOutButton from "@/components/SignOutButton";
import Logo from "@/components/Logo";
import ProjectCard from "./ProjectCard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [projects, agents] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, updatedAt: true, publishedAt: true, visitCount: true, versions: { select: { id: true }, take: 1 } },
    }),
    prisma.agent.findMany({ where: { ownerId: session.user.id }, orderBy: { updatedAt: "desc" } }),
  ]);

  return (
    <div className="min-h-screen bg-[#080809]">

      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080809]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/"><Logo /></Link>
            <nav className="hidden sm:flex items-center gap-1">
              <span className="px-3 py-1.5 text-sm text-white rounded-md bg-white/[0.06]">Apps</span>
              <Link href="#agents" className="px-3 py-1.5 text-sm text-gray-500 hover:text-white rounded-md hover:bg-white/[0.04] transition-colors">Agents</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-600">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-14">

        {/* Apps */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>Your apps</h1>
              <p className="text-sm text-gray-600 mt-0.5">Describe what to build and it ships instantly.</p>
            </div>
          </div>

          <NewProjectButton />

          {projects.length > 0 && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={{ ...project, hasVersion: project.versions.length > 0 }} />
              ))}
            </div>
          )}

          {projects.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] p-14 text-center">
              <p className="text-sm text-gray-600">No apps yet — describe one above.</p>
            </div>
          )}
        </section>

        {/* Agents */}
        <section id="agents">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>AI Agents</h2>
              <p className="text-sm text-gray-600 mt-0.5">Custom assistants you can share or embed anywhere.</p>
            </div>
          </div>

          <NewAgentButton />

          {agents.length > 0 && (
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
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${agent.public ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.08]" : "border-white/10 text-gray-600"}`}>
                        {agent.public ? "Public" : "Private"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {agents.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] p-14 text-center">
              <p className="text-sm text-gray-600">No agents yet — create one above.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
