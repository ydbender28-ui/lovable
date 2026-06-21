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
    include: {
      versions: { orderBy: { createdAt: "desc" }, take: 1 },
      messages: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const daysSinceUpdate = Math.floor((Date.now() - project.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceCreated = Math.floor((Date.now() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const files: Record<string, string> = project.versions[0] ? JSON.parse(project.versions[0].files) : {};
  const code = Object.values(files).join("\n").slice(0, 15000);

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: `You are an app lifecycle manager. Analyze an app that may be a candidate for sunsetting and provide actionable recommendations. Return JSON only:
{
  "recommendation": "keep | archive | sunset",
  "reason": "One sentence why",
  "idleDays": 45,
  "unusedFeatures": ["Dark mode toggle (likely never clicked)", "Export to PDF button (no data model for PDF)"],
  "dataToMigrate": ["User preferences in localStorage", "Product catalog data"],
  "cleanupActions": [
    "Cancel Stripe subscription if active",
    "Export localStorage data to JSON download",
    "Revoke any API keys hardcoded in ENV",
    "Archive project on ThatCode"
  ],
  "archivePrompt": "Add a graceful shutdown page to this app: display a 'This app has been retired' message with the date, export any user data as a JSON download button, and show contact info for support."
}`,
    messages: [{
      role: "user",
      content: `App: ${project.name}\nDays since last update: ${daysSinceUpdate}\nDays since created: ${daysSinceCreated}\nMessage count: ${project.messages.length}\nIs published: ${!!project.publishSlug}\n\nCode:\n${code}`,
    }],
  });

  try {
    const text = (res.content[0] as { type: string; text: string }).text;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const data = JSON.parse(match[0]);
    return NextResponse.json({ ...data, daysSinceUpdate, daysSinceCreated });
  } catch {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
