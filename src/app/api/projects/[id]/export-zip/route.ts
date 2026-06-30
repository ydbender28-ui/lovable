import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!project || !project.versions[0]) return new Response("Not found", { status: 404 });

  const files: Record<string, string> = JSON.parse(project.versions[0].files);
  const appTsx = files["/App.tsx"] || files["/App.js"] || "";
  const indexCss = files["/index.css"] || files["/styles.css"] || "";

  // Bundle into a single self-contained file devs can drop into any React project
  const bundled = `/* ${project.name} - exported from thatcode.dev */
/* Drop App.tsx into your React project — CSS is embedded at the bottom */

/* === App.tsx === */
${appTsx}

/* === index.css === */
/*
${indexCss}
*/
`;

  const safeName = project.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  return new Response(bundled, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}-source.tsx"`,
      "Cache-Control": "no-store",
    },
  });
}
