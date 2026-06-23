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
  const code = Object.entries(files).map(([p, c]) => `// ${p}\n${c}`).join("\n\n").slice(0, 40000);

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `You are a legal compliance expert. Analyze React app code and identify applicable privacy/compliance laws. Return JSON only:
{
  "appType": "e-commerce | healthcare | social | saas | marketing | other",
  "applicableLaws": ["GDPR", "CCPA", "HIPAA", "COPPA"],
  "issues": ["No cookie consent banner", "No privacy policy link", "Collecting health data without consent"],
  "buildPrompt": "Detailed prompt to add all required compliance features: cookie consent banner with accept/reject (store preference in localStorage), privacy policy modal, data deletion option in settings, HIPAA-required disclaimers if health data detected, age gate if COPPA applies. Be specific about what UI to add and where."
}`,
    messages: [{ role: "user", content: code }],
  });

  try {
    const text = (res.content[0] as { type: string; text: string }).text;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
