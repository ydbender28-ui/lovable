import { NextResponse } from "next/server";

export const maxDuration = 120;
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!project?.versions[0]) return NextResponse.json({ error: "No code" }, { status: 400 });

  const files: Record<string, string> = JSON.parse(project.versions[0].files);
  const code = Object.values(files).join("\n").slice(0, 30000);

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: `You are a performance engineer. Analyze a React app's code and simulate realistic load testing by predicting bottlenecks. Return JSON only:
{
  "appType": "e-commerce | saas | social | dashboard | other",
  "simulatedUsers": 10000,
  "scenarios": [
    { "name": "New user signup flow", "steps": ["Load homepage", "Click signup", "Fill form", "Submit"], "usersPerMinute": 500 }
  ],
  "bottlenecks": [
    { "severity": "critical | high | medium", "location": "Cart checkout state update", "issue": "Re-renders all 500 products on every cart change", "fix": "Memoize cart calculations with useMemo" }
  ],
  "peakConcurrentUsers": 847,
  "estimatedCrashPoint": "~1200 concurrent users due to localStorage quota exhaustion",
  "buildPrompt": "Fix all identified performance bottlenecks: [specific React optimization instructions — useMemo, useCallback, virtualization for long lists, debounce on search, avoid re-renders, lazy loading]"
}`,
    messages: [{ role: "user", content: `Load test this app:\n\n${code}` }],
  });

  try {
    const text = (res.content[0] as { type: string; text: string }).text;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json({ error: "Load test failed" }, { status: 500 });
  }
}
