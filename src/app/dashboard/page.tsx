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
    prisma.project.findMany({ where: { ownerId: session.user.id }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, updatedAt: true, publishedAt: true, visitCount: true, versions: { select: { id: true }, take: 1 } } }),
    prisma.agent.findMany({ where: { ownerId: session.user.id }, orderBy: { updatedAt: "desc" } }),
  ]);

  return (
    <div className="relative min-h-screen bg-[#0a0a0f]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-fuchsia-600/15 via-purple-600/10 to-indigo-600/10 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10 space-y-12">
        {/* Apps section */}
        <section>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white mb-1">Build an app</h1>
            <p className="text-sm text-gray-400 mb-4">Describe your app and I&apos;ll build it instantly.</p>
            <NewProjectButton />
          </div>

          {projects.length > 0 && (
            <p className="text-sm font-medium text-gray-400 mb-4">Recent apps</p>
          )}
          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
              <p className="text-gray-500 text-sm">No apps yet. Describe one above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={{ ...project, hasVersion: project.versions.length > 0 }} />
              ))}
            </div>
          )}
        </section>

        {/* Agents section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-1">AI Agents</h2>
            <p className="text-sm text-gray-400 mb-4">
              Create a custom AI assistant — give it a name, instructions, and share the link or embed it anywhere.
            </p>
            <NewAgentButton />
          </div>

          {agents.length > 0 && (
            <p className="text-sm font-medium text-gray-400 mb-4">Your agents</p>
          )}
          {agents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
              <p className="text-gray-500 text-sm">No agents yet. Create one above — takes 30 seconds.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}
                  className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur transition-all hover:border-indigo-400/40 hover:bg-white/[0.05] hover:-translate-y-0.5">
                  <div className="h-24 rounded-xl bg-gradient-to-br from-indigo-600/20 via-blue-600/15 to-cyan-600/20 mb-4 flex items-center justify-center">
                    <span className="text-4xl">{agent.avatar}</span>
                  </div>
                  <h2 className="font-medium text-white truncate">{agent.name}</h2>
                  {agent.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{agent.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${agent.public ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-white/10 text-gray-500"}`}>
                      {agent.public ? "Public" : "Private"}
                    </span>
                    <span className="text-[10px] text-gray-600">{agent.slug}.thatcode.dev/a/…</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
