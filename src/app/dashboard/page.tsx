import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewProjectButton from "./NewProjectButton";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="relative min-h-screen bg-[#0a0a0f]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-fuchsia-600/15 via-purple-600/10 to-indigo-600/10 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500" />
            <span className="font-semibold text-white text-sm">lovable<span className="text-fuchsia-400">.clone</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-1">What do you want to build?</h1>
          <p className="text-sm text-gray-400 mb-4">Describe your app and I&apos;ll build it instantly.</p>
          <NewProjectButton />
        </div>

        {projects.length > 0 && (
          <p className="text-sm font-medium text-gray-400 mb-4">Recent projects</p>
        )}

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-16 text-center">
            <p className="text-gray-400 text-sm">
              No projects yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur transition-all hover:border-fuchsia-400/40 hover:bg-white/[0.05] hover:-translate-y-0.5"
              >
                <div className="h-24 rounded-xl bg-gradient-to-br from-fuchsia-600/20 via-purple-600/15 to-indigo-600/20 mb-4 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-white/20 group-hover:text-white/30 transition-colors">
                    {project.name.slice(0, 1).toUpperCase()}
                  </span>
                </div>
                <h2 className="font-medium text-white truncate">{project.name}</h2>
                <p className="text-xs text-gray-500 mt-1.5">
                  Updated {new Date(project.updatedAt).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
