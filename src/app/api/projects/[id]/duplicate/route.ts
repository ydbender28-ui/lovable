import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!project) return new Response("Not found", { status: 404 });

  const newProject = await prisma.project.create({
    data: {
      name: `${project.name} (Copy)`,
      ownerId: session.user.id,
    },
  });

  if (project.versions[0]) {
    await prisma.version.create({
      data: {
        projectId: newProject.id,
        files: project.versions[0].files,
        modelUsed: project.versions[0].modelUsed,
        inputTokens: 0,
        outputTokens: 0,
      },
    });
  }

  return Response.json({ id: newProject.id, name: newProject.name });
}
