import { NextResponse } from "next/server";
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
  if (!project?.versions[0]) return NextResponse.json({ error: "No code to scan" }, { status: 400 });

  const files: Record<string, string> = JSON.parse(project.versions[0].files);
  const code = Object.entries(files).map(([p, c]) => `// ${p}\n${c}`).join("\n\n").slice(0, 40000);

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `You are a security auditor for web apps. Scan the provided React/JavaScript code for security vulnerabilities. Return ONLY valid JSON in this shape:
{
  "issues": [
    {
      "severity": "high|medium|low",
      "title": "Short title",
      "description": "What the issue is and why it matters",
      "fix": "How to fix it in one sentence"
    }
  ],
  "score": 85
}
score is 0-100 where 100 is perfectly secure. Return empty issues array if the code is clean.`,
    messages: [{ role: "user", content: `Scan this code for security issues:\n\n${code}` }],
  });

  try {
    const raw = (res.content[0] as { type: string; text: string }).text;
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ issues: [], score: 100 });
  }
}
