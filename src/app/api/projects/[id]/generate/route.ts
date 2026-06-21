import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProject } from "@/lib/generate";
import { buildStandaloneHtml } from "@/lib/buildHtml";

export async function POST(req: Request, ctx: RouteContext<"/api/projects/[id]/generate">) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const { prompt, envVars: bodyEnvVars, imageBase64, imageMimeType, forceModel } = body;

  if (!prompt || typeof prompt !== "string") {
    return new Response("Prompt is required", { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      versions: { orderBy: { createdAt: "desc" }, take: 1 },
      messages: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!project) return new Response("Not found", { status: 404 });

  await prisma.message.create({ data: { projectId: id, role: "user", content: prompt } });

  const existingFiles = project.versions[0] ? JSON.parse(project.versions[0].files) : null;
  const envVars = bodyEnvVars ?? (project.envVars ? JSON.parse(project.envVars) : null);
  const knowledge: Array<{ title: string; content: string }> = JSON.parse(project.knowledge || "[]");
  const customKnowledge = knowledge.length > 0
    ? knowledge.map(k => `## ${k.title}\n${k.content}`).join("\n\n")
    : null;

  // Build project history from recent messages (reverse to get chronological order)
  const recentMsgs = (project.messages ?? []).reverse();
  const projectHistory = recentMsgs.length > 2
    ? recentMsgs
        .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content.slice(0, 200)}`)
        .join("\n")
        .slice(0, 3000)
    : null;

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
          (text) => send("status", { text }),
          imageBase64 ?? null,
          imageMimeType,
          forceModel ?? undefined,
          customKnowledge,
          projectHistory
        );

        // Auto-republish if already live — build new HTML before sending done
        const wasPublished = !!project.publishSlug;
        const newHtml = wasPublished ? buildStandaloneHtml(result.files, project.name) : null;

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
          liveUpdated: wasPublished,
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
          prisma.project.update({
            where: { id },
            data: {
              updatedAt: new Date(),
              // Auto-update published HTML so live site reflects changes immediately
              ...(wasPublished && newHtml ? { publishedHtml: newHtml, publishedAt: new Date() } : {}),
            },
          }),
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
