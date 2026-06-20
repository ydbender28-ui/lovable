import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildStandaloneHtml } from "@/lib/buildHtml";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!project) return new Response("Not found", { status: 404 });

  // Use published HTML if available, otherwise build from latest version
  const html = project.publishedHtml
    ?? (project.versions[0] ? buildStandaloneHtml(JSON.parse(project.versions[0].files), project.name) : null);

  if (!html) return new Response("<html><body></body></html>", { headers: { "Content-Type": "text/html" } });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
