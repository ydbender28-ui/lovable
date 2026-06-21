import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectAId, projectBId, mergeGoal } = await req.json();
  if (!projectAId || !projectBId) return NextResponse.json({ error: "Two project IDs required" }, { status: 400 });

  const [projectA, projectB] = await Promise.all([
    prisma.project.findFirst({
      where: { id: projectAId, ownerId: session.user.id },
      include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.project.findFirst({
      where: { id: projectBId, ownerId: session.user.id },
      include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);

  if (!projectA?.versions[0] || !projectB?.versions[0]) {
    return NextResponse.json({ error: "Both projects must have code" }, { status: 400 });
  }

  const filesA: Record<string, string> = JSON.parse(projectA.versions[0].files);
  const filesB: Record<string, string> = JSON.parse(projectB.versions[0].files);

  const codeA = Object.entries(filesA).map(([p, c]) => `// ${p}\n${c}`).join("\n\n").slice(0, 20000);
  const codeB = Object.entries(filesB).map(([p, c]) => `// ${p}\n${c}`).join("\n\n").slice(0, 20000);

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `You are merging two React apps into one unified application.

APP A — "${projectA.name}":
${codeA}

APP B — "${projectB.name}":
${codeB}

MERGE GOAL: ${mergeGoal || "Combine both apps into one unified app with unified navigation and shared design system"}

Generate a complete, specific build prompt (3-5 paragraphs) that describes exactly how to merge these two apps. Include:
- What features/sections to keep from each
- How to unify navigation (tabs, sidebar, or router)
- How to resolve any conflicting state or data models
- The unified design language to use
- Any features that should be combined vs kept separate

Return ONLY the build prompt text, no JSON wrapper.`,
    }],
  });

  const buildPrompt = (res.content[0] as { type: string; text: string }).text.trim();
  return NextResponse.json({ buildPrompt, projectAName: projectA.name, projectBName: projectB.name });
}
