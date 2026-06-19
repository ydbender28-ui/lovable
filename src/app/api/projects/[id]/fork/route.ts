import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const source = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!source) return new Response("Not found", { status: 404 });

  const forked = await prisma.project.create({
    data: {
      name: `${source.name} (copy)`,
      ownerId: session.user.id,
    },
  });

  if (source.versions[0]) {
    await prisma.version.create({
      data: {
        projectId: forked.id,
        files: source.versions[0].files,
        modelUsed: source.versions[0].modelUsed,
        inputTokens: source.versions[0].inputTokens,
        outputTokens: source.versions[0].outputTokens,
      },
    });
  }

  return Response.json({ id: forked.id });
}
