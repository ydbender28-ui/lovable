import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/SignOutButton";
import Logo from "@/components/Logo";
import DashboardTabs from "./DashboardTabs";

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

  const projectsWithVersion = projects.map(p => ({ ...p, hasVersion: p.versions.length > 0 }));

  return (
    <div className="min-h-screen bg-[#080809]">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080809]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-600">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <DashboardTabs projects={projectsWithVersion} agents={agents} />
      </main>
    </div>
  );
}
