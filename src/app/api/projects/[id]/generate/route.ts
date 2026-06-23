import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProject, generateQuickEdit, smartRoute, estimateCost } from "@/lib/generate";
import { buildStandaloneHtml } from "@/lib/buildHtml";

// Pricing: for every $0.10 in AI cost, charge user $0.25 (2.5x markup, $0.15 profit per $0.10)
function costToCredits(aiCostUsd: number): number {
  return Math.max(0.5, Math.round((aiCostUsd / 0.10) * 0.25 * 100) / 100);
}

const ESTIMATED_CREDITS: Record<string, number> = {
  style:       0.25,
  content:     0.25,
  bugfix:      0.5,
  feature:     1,
  "new-build": 2,
  complex:     3,
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
  let streamOpen = true;

  // Fire generation as an independent background task — survives client disconnect
  const useQuickEdit = existingFiles &&
    (finalRoute.taskType === "style" || finalRoute.taskType === "content") &&
    !imageBase64;

  const statusUpdates: string[] = [];
  const genPromise = (async () => {
    try {
      const result = useQuickEdit
        ? await generateQuickEdit(
            prompt,
            existingFiles,
            undefined,
            (text) => { statusUpdates.push(text); },
          )
        : await generateProject(
            prompt,
            existingFiles,
            envVars,
            undefined,
            (text) => { statusUpdates.push(text); },
            imageBase64 ?? null,
            imageMimeType,
            finalRoute.model.model,
            customKnowledge,
            projectHistory
          );

      const wasPublished = !!project.publishSlug;
      const hideBadge = user?.plan === "pro" || user?.plan === "team" || user?.plan === "owner";
      const newHtml = wasPublished ? buildStandaloneHtml(result.files, project.name, id, hideBadge, project.publishSlug ?? undefined) : null;

      const actualCost = estimateCost(result.modelUsed ?? finalRoute.model.model, result.inputTokens ?? 0, result.outputTokens ?? 0);
      const actualCredits = costToCredits(actualCost);
      const creditsAfter = Math.max(0, currentCredits - actualCredits);

      // Save to DB regardless of whether client is still connected
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
        user?.plan !== "owner"
          ? prisma.user.update({ where: { id: session.user.id }, data: { credits: { decrement: actualCredits } } })
          : Promise.resolve(),
      ]);

      return { result, actualCredits, creditsAfter, wasPublished };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      await prisma.message.create({ data: { projectId: id, role: "assistant", content: `Error: ${message}` } });
      return { error: message };
    }
  })();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (!streamOpen) return;
        try { controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)); } catch { streamOpen = false; }
      };

      send("route", {
        intent: finalRoute.intent,
        taskType: finalRoute.taskType,
        creditsNeeded: estimatedCredits,
        creditsRemaining: currentCredits,
      });

      // Poll for status updates while generation runs
      const statusInterval = setInterval(() => {
        while (statusUpdates.length > 0) {
          send("status", { text: statusUpdates.shift() });
        }
      }, 500);

      const outcome = await genPromise;
      clearInterval(statusInterval);

      if ("error" in outcome) {
        send("error", { error: outcome.error });
      } else {
        send("done", {
          files: outcome.result.files,
          summary: outcome.result.summary,
          tempMessageId: `msg-${Date.now()}`,
          liveUpdated: outcome.wasPublished,
          creditsUsed: outcome.actualCredits,
          creditsRemaining: outcome.creditsAfter,
        });
      }

      controller.close();
    },
    cancel() { streamOpen = false; },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
