import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return new Response("Not found", { status: 404 });

  const versions = await prisma.version.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, createdAt: true, modelUsed: true },
  });

  return Response.json(versions);
}
