import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { prompt } = await req.json();

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existingContext = project.versions[0]
    ? `Existing app summary: The user already has a React app built. Existing files: ${Object.keys(JSON.parse(project.versions[0].files)).join(", ")}.`
    : "This is a new project with no existing code.";

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system: `You are an expert software architect. Given a build request, produce a concise implementation plan. Be specific and concrete — not vague. Think about what components, data models, and interactions are needed.

Return JSON only:
{
  "title": "What we'll build",
  "overview": "2-sentence summary",
  "components": ["list of key UI components"],
  "dataModels": ["key data structures/entities"],
  "features": ["specific interactive features"],
  "considerations": ["any important technical decisions or tradeoffs"]
}`,
    messages: [{ role: "user", content: `${existingContext}\n\nBuild request: ${prompt}` }],
  });

  try {
    const raw = (res.content[0] as { type: string; text: string }).text;
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
