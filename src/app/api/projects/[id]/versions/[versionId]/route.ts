import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id, versionId } = await params;

  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return new Response("Not found", { status: 404 });

  const version = await prisma.version.findFirst({ where: { id: versionId, projectId: id } });
  if (!version) return new Response("Version not found", { status: 404 });

  return Response.json({ files: JSON.parse(version.files) });
}
