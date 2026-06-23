import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProject, generateQuickEdit, smartRoute, estimateCost } from "@/lib/generate";
import { buildStandaloneHtml } from "@/lib/buildHtml";
import { decrypt, isEncrypted } from "@/lib/crypto";

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
  const { prompt, envVars: bodyEnvVars, imageBase64, imageMimeType, forceModel } = body;

  if (!prompt || typeof prompt !== "string") {
    return new Response("Prompt is required", { status: 400 });
  }

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

  // Skip classifier for first builds — we know it's "new-build"
  const [finalRoute] = await Promise.all([
    hasExisting
      ? smartRoute(prompt, true, forceModel ?? undefined)
      : Promise.resolve({ intent: prompt.slice(0, 80), taskType: "new-build" as const, model: { model: "claude-sonnet-4-6", displayName: "Claude Sonnet", provider: "anthropic" as const, maxTokens: 32000, costPer1kInput: 0.003, costPer1kOutput: 0.015 }, modelReason: "New build" }),
    prisma.message.create({ data: { projectId: id, role: "user", content: prompt } }),
  ]);

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

  // Self-learning system: detect failures and inject learnings
  let learningContext = "";
  try {
    if (!hasExisting) {
      const recentBuilds = await prisma.version.findMany({
        orderBy: { createdAt: "desc" }, take: 10,
        select: { project: { select: { name: true } } },
      });
      const names = [...new Set(recentBuilds.map(b => b.project.name).filter(Boolean))];
      if (names.length > 0) {
        learningContext += `\nAvoid these brand names (already used): ${names.join(", ")}`;
      }
    }

    // Detect failure patterns: user complained after AI's response
    const failurePatterns = /didn'?t|doesn'?t|where is|not working|still no|broken|missing|can'?t find|theres no|there'?s no|it only|just added|but no|nothing happen|didn'?t add|took off|removed|lost|gone/i;
    const allMsgs = (project.messages ?? []).slice(-20);
    const complaints: string[] = [];
    for (let i = 1; i < allMsgs.length; i++) {
      if (allMsgs[i].role === "user" && failurePatterns.test(allMsgs[i].content)) {
        // Found a complaint — the previous AI response failed
        const prevAi = allMsgs[i - 1]?.content?.slice(0, 100) ?? "";
        const userAsked = allMsgs[i].content.slice(0, 100);
        complaints.push(`User said "${userAsked}" after AI said "${prevAi}"`);
      }
    }
    if (complaints.length > 0) {
      learningContext += `\n\nPAST FAILURES IN THIS PROJECT — the user was unhappy with these results. Do NOT repeat these mistakes:\n${complaints.slice(-3).join("\n")}\nMake sure your response ACTUALLY implements what the user asks for. Don't just say you did it — actually do it.`;
    }

    // Global learnings from all users' complaints
    const globalComplaints = await prisma.message.findMany({
      where: {
        role: "user",
        content: { contains: "didn" },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { content: true },
    });
    if (globalComplaints.length > 3) {
      const patterns = globalComplaints.map(m => m.content.slice(0, 60));
      learningContext += `\n\nCOMMON USER COMPLAINTS (from all users):\n${[...new Set(patterns)].slice(0, 5).map(p => `- "${p}"`).join("\n")}\nLearn from these — make sure features are FULLY implemented with working UI.`;
    }
  } catch { /* non-critical */ }

  // Only use quick edit for truly trivial changes — text swaps and simple style tweaks
  // Feature requests (cart, search, admin, etc.) MUST use the full pipeline
  const useQuickEdit = existingFiles &&
    (finalRoute.taskType === "style" || finalRoute.taskType === "content") &&
    !imageBase64 &&
    prompt.length < 80 &&
    !/\b(add|cart|checkout|search|admin|login|auth|payment|form|modal|page|section|feature|button.*work|make.*work|implement)\b/i.test(prompt);

  // Token buffer for streaming to client
  const tokenBuffer: string[] = [];
  let tokenCount = 0;

  const onToken = (token: string) => {
    tokenCount++;
    // Buffer tokens in batches for efficiency
    if (tokenCount % 5 === 0) {
      tokenBuffer.push(token);
    }
  };

  const onStatus = (text: string) => {
    tokenBuffer.push(`__STATUS__${text}`);
  };

  // Run generation in after() — survives client disconnect on Vercel
  const genPromise = (async () => {
    try {
      const fullPrompt = learningContext ? prompt + learningContext : prompt;
      const result = useQuickEdit
        ? await generateQuickEdit(prompt, existingFiles, onToken, onStatus)
        : await generateProject(
            fullPrompt, existingFiles, envVars, onToken, onStatus,
            imageBase64 ?? null, imageMimeType,
            finalRoute.model.model, customKnowledge, projectHistory
          );

      const wasPublished = !!project.publishSlug;
      const hideBadge = user?.plan === "pro" || user?.plan === "team" || user?.plan === "owner";
      const newHtml = wasPublished ? buildStandaloneHtml(result.files, project.name, id, hideBadge, project.publishSlug ?? undefined) : null;

      const actualCost = estimateCost(result.modelUsed ?? finalRoute.model.model, result.inputTokens ?? 0, result.outputTokens ?? 0);
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
      await prisma.message.create({ data: { projectId: id, role: "assistant", content: `Error: ${message}` } });
      return { error: message };
    }
  })();

  // Register with after() so Vercel keeps the function alive even if client disconnects
  after(async () => { await genPromise; });

  // Stream progress to client while connected
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

      // Stream tokens to client while generation runs
      const tokenInterval = setInterval(() => {
        while (tokenBuffer.length > 0 && streamOpen) {
          const item = tokenBuffer.shift()!;
          if (item.startsWith("__STATUS__")) {
            send("status", { text: item.slice(10) });
          } else {
            send("token", { t: item });
          }
        }
      }, 100);

      const outcome = await genPromise;
      clearInterval(tokenInterval);
      // Flush remaining tokens
      while (tokenBuffer.length > 0 && streamOpen) {
        const item = tokenBuffer.shift()!;
        if (item.startsWith("__STATUS__")) send("status", { text: item.slice(10) });
      }

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
