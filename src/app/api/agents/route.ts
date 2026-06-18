import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agents = await prisma.agent.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(agents);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, systemPrompt, model, avatar } = await req.json();
  if (!name || !systemPrompt) return NextResponse.json({ error: "Name and instructions required" }, { status: 400 });

  let slug = toSlug(name);
  const existing = await prisma.agent.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const agent = await prisma.agent.create({
    data: {
      name,
      description: description || null,
      systemPrompt,
      model: model || "claude-haiku-4-5-20251001",
      avatar: avatar || "🤖",
      slug,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(agent);
}
