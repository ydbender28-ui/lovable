import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nameFromPrompt } from "@/lib/project-namer";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id, deletedAt: null },
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
