import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(_req: Request, ctx: { params: Promise<{ id: string; versionId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, versionId } = await ctx.params;

  const versions = await prisma.version.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const target = versions.find(v => v.id === versionId);
  if (!target) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  const targetIndex = versions.indexOf(target);
  const prevVersion = versions[targetIndex + 1];

  if (!prevVersion) {
    return NextResponse.json({ explanation: "This is the first version of the project." });
  }

  const prevFiles: Record<string, string> = JSON.parse(prevVersion.files);
  const newFiles: Record<string, string> = JSON.parse(target.files);

  const diffLines: string[] = [];
  const allKeys = new Set([...Object.keys(prevFiles), ...Object.keys(newFiles)]);
  for (const k of allKeys) {
    if (!prevFiles[k]) diffLines.push(`+ Added file: ${k}`);
    else if (!newFiles[k]) diffLines.push(`- Removed file: ${k}`);
    else if (prevFiles[k] !== newFiles[k]) {
      const pLines = prevFiles[k].split("\n").length;
      const nLines = newFiles[k].split("\n").length;
      diffLines.push(`~ Modified: ${k} (${pLines} → ${nLines} lines)`);
    }
  }

  if (diffLines.length === 0) {
    return NextResponse.json({ explanation: "No changes between these versions." });
  }

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Summarize these code changes in 1-2 plain English sentences. Focus on what the user will see differently, not technical details:\n\n${diffLines.join("\n")}`,
    }],
  });

  const explanation = (res.content[0] as { type: string; text: string }).text.trim();
  return NextResponse.json({ explanation });
}
