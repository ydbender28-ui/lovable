import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProject } from "@/lib/generate";

export async function POST(req: Request, ctx: RouteContext<"/api/projects/[id]/generate">) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const { prompt, envVars: bodyEnvVars } = body;

  if (!prompt || typeof prompt !== "string") {
    return new Response("Prompt is required", { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!project) return new Response("Not found", { status: 404 });

  await prisma.message.create({ data: { projectId: id, role: "user", content: prompt } });

  const existingFiles = project.versions[0] ? JSON.parse(project.versions[0].files) : null;
  // Use env vars from request body if provided (client may have just saved new keys), else fall back to DB
  const envVars = bodyEnvVars ?? (project.envVars ? JSON.parse(project.envVars) : null);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await generateProject(
          prompt,
          existingFiles,
          envVars,
          undefined,
          (text) => send("status", { text })
        );

        // Send done immediately — don't wait for DB writes
        const tempMessageId = `msg-${Date.now()}`;
        send("done", {
          files: result.files,
          summary: result.summary,
          tempMessageId,
          modelUsed: result.modelUsed,
          complexity: result.complexity,
          complexityReasons: result.complexityReasons,
          estimatedCostUsd: result.estimatedCostUsd,
        });

        // Write to DB in parallel after responding
        await Promise.all([
          prisma.version.create({
            data: {
              projectId: id,
              files: JSON.stringify(result.files),
              modelUsed: result.modelUsed,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
            },
          }),
          prisma.message.create({ data: { projectId: id, role: "assistant", content: result.summary } }),
          prisma.project.update({ where: { id }, data: { updatedAt: new Date() } }),
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        await prisma.message.create({ data: { projectId: id, role: "assistant", content: `Error: ${message}` } });
        send("error", { error: message });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
