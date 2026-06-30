import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { projectId, slug } = await req.json();
    if (!projectId && !slug) return new Response("ok");

    const where = projectId
      ? { id: projectId as string }
      : { publishSlug: slug as string };

    const today = new Date().toISOString().split('T')[0]; // "2026-06-30"

    // Resolve the project id if we only have a slug
    let resolvedId = projectId as string | undefined;
    if (!resolvedId && slug) {
      const proj = await prisma.project.findUnique({ where: { publishSlug: slug as string }, select: { id: true } }).catch(() => null);
      resolvedId = proj?.id;
    }

    await prisma.project.update({
      where,
      data: { visitCount: { increment: 1 } },
    }).catch(() => {}); // Silently fail if project not found

    if (resolvedId) {
      await prisma.siteVisit.upsert({
        where: { projectId_date: { projectId: resolvedId, date: today } },
        create: { projectId: resolvedId, date: today, count: 1 },
        update: { count: { increment: 1 } },
      }).catch(() => {}); // ignore if model doesn't exist yet
    }

    return new Response("ok", { status: 200 });
  } catch {
    return new Response("ok", { status: 200 }); // Always return 200
  }
}
