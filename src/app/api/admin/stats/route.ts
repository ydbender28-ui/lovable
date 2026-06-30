import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OWNER_EMAIL = "ydbender28@gmail.com";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  if (session.user.email !== OWNER_EMAIL) return new Response("Forbidden", { status: 403 });

  const [
    totalUsers,
    totalProjects,
    totalVersions,
    publishedProjects,
    recentUsers,
    recentProjects,
    planCounts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.version.count(),
    prisma.project.count({ where: { publishSlug: { not: null }, deletedAt: null } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, email: true, plan: true, credits: true, createdAt: true },
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        createdAt: true,
        publishSlug: true,
        owner: { select: { email: true } },
      },
    }),
    prisma.user.groupBy({ by: ["plan"], _count: true }),
  ]);

  return Response.json({
    stats: { totalUsers, totalProjects, totalVersions, publishedProjects },
    recentUsers,
    recentProjects,
    planCounts,
  });
}
