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
  const code = Object.values(files).join("\n").slice(0, 40000);

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: `You are an adversarial security researcher. Think like an attacker trying to break this React app. Probe for real exploits — not theoretical ones. Focus on what's actually present in the code.

Return JSON only:
{
  "securityScore": 72,
  "exploits": [
    {
      "severity": "critical | high | medium | low",
      "type": "XSS | auth-bypass | data-leak | race-condition | injection | logic-error | insecure-storage",
      "location": "AdminPanel component, password check on line ~45",
      "description": "Password stored in React state is visible in React DevTools. Attacker with dev tools access can read it.",
      "exploit": "Open React DevTools → Components → AdminPanel → state → password = plaintext value",
      "fix": "Never store passwords in React state. Compare on submit only, then clear immediately. For local auth, use a hashed comparison."
    }
  ],
  "passed": ["No SQL injection vectors (no raw DB queries)", "localStorage data doesn't contain credentials"],
  "buildPrompt": "Fix all security vulnerabilities found: [specific code changes for each exploit found — exact patterns to add/remove]"
}`,
    messages: [{ role: "user", content: `Red-team this app. Find real exploits:\n\n${code}` }],
  });

  try {
    const text = (res.content[0] as { type: string; text: string }).text;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json({ error: "Red team scan failed" }, { status: 500 });
  }
}
