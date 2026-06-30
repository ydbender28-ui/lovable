import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 2) return Response.json([]);

  const projects = await prisma.project.findMany({
    where: {
      ownerId: session.user.id,
      deletedAt: null,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      publishSlug: true,
      updatedAt: true,
      thumbnail: true,
      _count: { select: { versions: true } },
    },
  });

  return Response.json(projects);
}
