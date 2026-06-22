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

  const [projects, agents, user] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: session.user.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        publishedAt: true,
        visitCount: true,
        isPrivate: true,
        versions: { select: { id: true }, take: 1 },
      },
    }),
    prisma.agent.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true, plan: true } }),
  ]);

  const projectsWithVersion = projects.map((p) => ({
    ...p,
    hasVersion: p.versions.length > 0,
  }));

  return (
    <div className="min-h-screen" style={{ background: "#0a0b0e" }}>
      {/* ambient glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-80"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% -30%, rgba(109,95,255,0.12) 0%, transparent 65%)",
        }}
      />

      {/* Header */}
      <header
        className="glass sticky top-0 z-30"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/templates" className="hidden text-xs transition-colors hover:text-white sm:block" style={{ color: "#7a8099" }}>Templates</Link>
            <Link href="/showcase" className="hidden text-xs transition-colors hover:text-white sm:block" style={{ color: "#7a8099" }}>Showcase</Link>
            <span className="hidden text-xs sm:block" style={{ color: "rgba(255,255,255,0.12)" }}>|</span>
            <span className="hidden text-xs sm:block" style={{ color: "#7a8099" }}>
              {session.user.email}
            </span>
            <Link href="/settings" className="hidden text-xs transition-colors hover:text-white sm:block" style={{ color: "#7a8099" }}>Settings</Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <DashboardTabs
          projects={projectsWithVersion}
          agents={agents}
          credits={user?.plan === "owner" ? null : (user?.credits ?? 100)}
        />
      </main>
    </div>
  );
}
