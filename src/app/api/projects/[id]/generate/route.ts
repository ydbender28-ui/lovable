import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProject, smartRoute, estimateCost } from "@/lib/generate";
import { buildStandaloneHtml } from "@/lib/buildHtml";

// Each credit costs user $0.25. AI cost per credit = $0.10. Profit = $0.15/credit.
// credits = actualCostUsd / 0.10, rounded to 1 decimal, minimum 1.
function costToCredits(costUsd: number): number {
  return Math.max(1, Math.round((costUsd / 0.10) * 10) / 10);
}

// Estimated credits before generation (for the route chip) — based on typical cost per task
const ESTIMATED_CREDITS: Record<string, number> = {
  style:       0.5,
  content:     0.5,
  bugfix:      1,
  feature:     2,
  "new-build": 5,
  complex:     5,
};

export async function POST(req: Request, ctx: RouteContext<"/api/projects/[id]/generate">) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const { prompt, envVars: bodyEnvVars, imageBase64, imageMimeType, forceModel } = body;

  if (!prompt || typeof prompt !== "string") {
    return new Response("Prompt is required", { status: 400 });
  }

  // Fetch project + user credits in parallel
  const [project, user] = await Promise.all([
    prisma.project.findFirst({
      where: { id, ownerId: session.user.id },
      include: {
        versions: { orderBy: { createdAt: "desc" }, take: 1 },
        messages: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true, plan: true } }),
  ]);

  if (!project) return new Response("Not found", { status: 404 });

  const hasExisting = !!project.versions[0];

  // Smart route and message write in parallel
  const [finalRoute] = await Promise.all([
    smartRoute(prompt, hasExisting, forceModel ?? undefined),
    prisma.message.create({ data: { projectId: id, role: "user", content: prompt } }),
  ]);

  const estimatedCredits = ESTIMATED_CREDITS[finalRoute.taskType] ?? 2;
  const currentCredits = user?.credits ?? 0;

  // Check credits (skip check for owner plan)
  if (user?.plan !== "owner" && currentCredits < estimatedCredits) {
    return new Response(
      JSON.stringify({ error: "insufficient_credits", creditsNeeded: estimatedCredits, creditsRemaining: currentCredits }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  const existingFiles = project.versions[0] ? JSON.parse(project.versions[0].files) : null;
  const envVars = bodyEnvVars ?? (project.envVars ? JSON.parse(project.envVars) : null);
  const knowledge: Array<{ title: string; content: string }> = JSON.parse(project.knowledge || "[]");
  const customKnowledge = knowledge.length > 0
    ? knowledge.map(k => `## ${k.title}\n${k.content}`).join("\n\n")
    : null;

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

      // Stream routing decision with estimated credits
      send("route", {
        intent: finalRoute.intent,
        taskType: finalRoute.taskType,
        creditsNeeded: estimatedCredits,
        creditsRemaining: currentCredits,
      });

      try {
        const result = await generateProject(
          prompt,
          existingFiles,
          envVars,
          undefined,
          (text) => send("status", { text }),
          imageBase64 ?? null,
          imageMimeType,
          finalRoute.model.model,
          customKnowledge,
          projectHistory
        );

        const wasPublished = !!project.publishSlug;
        const newHtml = wasPublished ? buildStandaloneHtml(result.files, project.name) : null;

        // Calculate actual credits based on real token cost
        const actualCost = estimateCost(result.modelUsed ?? finalRoute.model.model, result.inputTokens ?? 0, result.outputTokens ?? 0);
        const actualCredits = costToCredits(actualCost);
        const creditsAfter = Math.max(0, currentCredits - actualCredits);

        send("done", {
          files: result.files,
          summary: result.summary,
          tempMessageId: `msg-${Date.now()}`,
          liveUpdated: wasPublished,
          creditsUsed: actualCredits,
          creditsRemaining: creditsAfter,
        });

        // Deduct credits + write version/message/project in parallel
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
              ...(wasPublished && newHtml ? { publishedHtml: newHtml, publishedAt: new Date() } : {}),
            },
          }),
          // Only deduct if not owner plan
          user?.plan !== "owner"
            ? prisma.user.update({ where: { id: session.user.id }, data: { credits: { decrement: actualCredits } } })
            : Promise.resolve(),
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
