import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProject } from "@/lib/generate";

export async function POST(req: Request, ctx: RouteContext<"/api/projects/[id]/generate">) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const { prompt } = await req.json();

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
  const envVars = project.envVars ? JSON.parse(project.envVars) : null;

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

        const version = await prisma.version.create({
          data: {
            projectId: id,
            files: JSON.stringify(result.files),
            modelUsed: result.modelUsed,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
          },
        });

        const assistantMessage = await prisma.message.create({
          data: { projectId: id, role: "assistant", content: result.summary },
        });

        await prisma.project.update({ where: { id }, data: { updatedAt: new Date() } });

        send("done", { files: result.files, version, message: assistantMessage, modelUsed: result.modelUsed });
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
