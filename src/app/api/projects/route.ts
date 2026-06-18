import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function nameFromPrompt(prompt: string): Promise<string> {
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 20,
      messages: [{
        role: "user",
        content: `Give a 2-4 word project name for this app idea. Reply with ONLY the name, title case, no punctuation.\n\nIdea: ${prompt.slice(0, 300)}`,
      }],
    });
    const name = (msg.content[0] as { text: string }).text.trim().replace(/['"]/g, "");
    return name || fallbackName(prompt);
  } catch {
    return fallbackName(prompt);
  }
}

function fallbackName(prompt: string): string {
  const filler = /^(build|make|create|i need|i want|please|can you|generate|a|an|the|me|us)\s+/gi;
  const cleaned = prompt.trim().replace(filler, "").trim();
  const words = cleaned.split(/\s+/).slice(0, 4).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1) || "New Project";
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, prompt } = await req.json();

  const projectName = name || (prompt ? await nameFromPrompt(prompt) : "New Project");

  const project = await prisma.project.create({
    data: {
      name: projectName,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(project);
}
