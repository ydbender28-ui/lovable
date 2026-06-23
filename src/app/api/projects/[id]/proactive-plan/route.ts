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
  if (!project?.versions[0]) return NextResponse.json({ suggestions: [] });

  const files: Record<string, string> = JSON.parse(project.versions[0].files);
  const codeSnippet = Object.entries(files)
    .map(([p, c]) => `// ${p}\n${c.slice(0, 1500)}`)
    .join("\n\n")
    .slice(0, 8000);

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `You are a proactive product advisor for an AI app builder. Analyze the user's app code and suggest the 3 most strategically valuable next features they will likely need — think like a co-founder, not a UI polisher.

Focus on: authentication, real data persistence (database), payments, email notifications, user roles/permissions, analytics, onboarding flows, search, API integrations — things that make the app production-ready.

Do NOT suggest: dark mode, animations, responsive design, color changes, or cosmetic improvements.

Return JSON only:
{
  "appType": "brief description of what was built",
  "suggestions": [
    { "title": "short title", "description": "why they need this, 1 sentence", "prompt": "exact prompt the user can send to build this" }
  ]
}`,
    messages: [{ role: "user", content: `Analyze this app and suggest next steps:\n\n${codeSnippet}` }],
  });

  try {
    const raw = (res.content[0] as { type: string; text: string }).text;
    const json = JSON.parse(raw);
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
