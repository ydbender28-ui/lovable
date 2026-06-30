import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { projectId, slug } = await req.json();
    if (!projectId && !slug) return new Response("ok");

    const where = projectId
      ? { id: projectId as string }
      : { publishSlug: slug as string };

    await prisma.project.update({
      where,
      data: { visitCount: { increment: 1 } },
    }).catch(() => {}); // Silently fail if project not found

    return new Response("ok", { status: 200 });
  } catch {
    return new Response("ok", { status: 200 }); // Always return 200
  }
}
