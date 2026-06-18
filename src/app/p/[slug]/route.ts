import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: RouteContext<"/p/[slug]">) {
  const { slug } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { publishSlug: slug } });

  if (!project?.publishedHtml) {
    return new Response("<h1>Not found</h1>", { status: 404, headers: { "Content-Type": "text/html" } });
  }

  return new Response(project.publishedHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
