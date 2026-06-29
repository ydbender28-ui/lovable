import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProject, estimateCost, MODELS } from "@/lib/generate";
import { buildStandaloneHtml } from "@/lib/buildHtml";
import { decrypt, isEncrypted } from "@/lib/crypto";
import { getSmartDefaults, getRecentMistakes, detectCategory } from "@/lib/learning";
import { buildSpec } from "@/lib/spec-builder";
import { buildWebsiteKnowledge } from "@/lib/website-knowledge";

export const maxDuration = 300;

// Pricing: 2.5x AI cost ($0.15 profit per $0.10 spent)
function costToCredits(aiCostUsd: number): number {
  return Math.round(aiCostUsd * 2.5 * 100) / 100 || 0.01;
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
  const { prompt, envVars: bodyEnvVars, forceModel } = body;

  if (!prompt || typeof prompt !== "string") {
    return new Response("Prompt is required", { status: 400 });
  }

  const [project, user] = await Promise.all([
    prisma.project.findFirst({
      where: { id, ownerId: session.user.id },
      include: {
        versions: { orderBy: { createdAt: "desc" }, take: 1 },
        messages: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true, plan: true } }),
  ]);

  if (!project) return new Response("Not found", { status: 404 });

  const hasExisting = !!project.versions[0];

  const sonnetModel = { model: "claude-sonnet-4-6", displayName: "Claude Sonnet", provider: "anthropic" as const, maxTokens: 10000, costPer1kInput: 0.003, costPer1kOutput: 0.015 };
  const p = prompt.toLowerCase();
  const taskType = !hasExisting ? "new-build" as const
    : /\b(change|update|rename|color|font|text|title)\b/.test(p) ? "style" as const
    : /\b(fix|bug|error|broken|crash)\b/.test(p) ? "bugfix" as const
    : /\b(add|create|build|implement|make|cart|checkout|search|auth|login)\b/.test(p) ? "feature" as const
    : "content" as const;
  const finalRoute = { intent: prompt.slice(0, 80), taskType, model: forceModel && MODELS[forceModel] ? MODELS[forceModel] : sonnetModel };

  prisma.message.create({ data: { projectId: id, role: "user", content: prompt } }).catch(() => {});

  const estimatedCredits = ESTIMATED_CREDITS[finalRoute.taskType] ?? 2;
  const currentCredits = user?.credits ?? 0;

  if (user?.plan !== "owner" && currentCredits < estimatedCredits) {
    return new Response(
      JSON.stringify({ error: "insufficient_credits", creditsNeeded: estimatedCredits, creditsRemaining: currentCredits }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  const existingFiles = project.versions[0] ? JSON.parse(project.versions[0].files) : null;
  let storedEnv = null;
  if (project.envVars) {
    const raw = project.envVars;
    storedEnv = JSON.parse(isEncrypted(raw) ? decrypt(raw) : raw);
  }
  const envVars = bodyEnvVars ?? storedEnv;

  // Enhance prompt with learning system, spec builder, and website knowledge for new builds
  let smartPrompt = prompt;
  if (!hasExisting) {
    const category = detectCategory(prompt);
    const [defaults, mistakes] = await Promise.all([
      getSmartDefaults(prompt).catch(() => null),
      getRecentMistakes(category).catch(() => null),
    ]);
    if (defaults) smartPrompt = `${prompt}\n\n${defaults}`;
    if (mistakes) smartPrompt = `${smartPrompt}\n\n${mistakes}`;

    try {
      const spec = await Promise.race([
        buildSpec(prompt),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      if (spec) {
        smartPrompt = spec.enhancedPrompt;
        if (defaults) smartPrompt += `\n\n${defaults}`;
        if (mistakes) smartPrompt += `\n\n${mistakes}`;
        if (spec.componentPlan) smartPrompt += `\n\n## Architecture Plan\n${spec.componentPlan}`;
      }
    } catch { /* spec builder failed — continue with raw prompt */ }

    // Inject website pattern knowledge (layout, sections, design tone)
    const websiteKnowledge = buildWebsiteKnowledge(prompt);
    smartPrompt += `\n\n${websiteKnowledge}`;
  }

  // SSE event buffer — drained to client every 100ms
  const eventBuffer: { event: string; data: unknown }[] = [];
  const pushEvent = (event: string, data: unknown) => { eventBuffer.push({ event, data }); };
  const onToken = (token: string) => pushEvent("token", { t: token });
  const onStatus = (text: string) => pushEvent("status", { text });

  // Run generation — after() keeps it alive even if client disconnects
  const genPromise = (async () => {
    try {
      const result = await generateProject(
        smartPrompt, existingFiles, envVars, onToken, onStatus,
        null, undefined, finalRoute.model.model, null, null
      );

      const wasPublished = !!project.publishSlug;
      const hideBadge = user?.plan === "pro" || user?.plan === "team" || user?.plan === "owner";
      const newHtml = wasPublished ? buildStandaloneHtml(result.files, project.name, id, hideBadge, project.publishSlug ?? undefined) : null;

      const actualCost = estimateCost(result.modelUsed, result.inputTokens, result.outputTokens);
      const actualCredits = costToCredits(actualCost);

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

      return { result, actualCredits, creditsAfter: Math.max(0, currentCredits - actualCredits), wasPublished };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      await prisma.message.create({ data: { projectId: id, role: "assistant", content: `Error: ${message}` } }).catch(() => {});
      return { error: message };
    }
  })();

  after(async () => { await genPromise; });

  const encoder = new TextEncoder();
  let streamOpen = true;

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

      const drainInterval = setInterval(() => {
        while (eventBuffer.length > 0 && streamOpen) {
          const item = eventBuffer.shift()!;
          send(item.event, item.data);
        }
      }, 100);

      const outcome = await genPromise;
      clearInterval(drainInterval);

      while (eventBuffer.length > 0 && streamOpen) {
        const item = eventBuffer.shift()!;
        send(item.event, item.data);
      }

      if ("error" in outcome) {
        send("error", { error: outcome.error });
      } else {
        send("done", {
          files: outcome.result.files,
          summary: outcome.result.summary,
          suggestions: [],
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
