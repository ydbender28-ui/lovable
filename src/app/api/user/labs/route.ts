import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const LABS_FEATURES = [
  { key: "auto-preview-switch", name: "Auto Preview Switching", description: "Automatically switches preview to mobile/tablet/desktop based on what you're building." },
  { key: "design-directions", name: "Design Directions", description: "Shows 3 design options to choose from before building landing pages." },
  { key: "dev-mode", name: "Dev Mode", description: "Edit code directly in the editor without going to GitHub." },
  { key: "security-scan", name: "Security Scan", description: "Scans your app for vulnerabilities when you publish." },
  { key: "visual-edit", name: "Visual Edit (beta)", description: "Click any element in the preview to edit it directly." },
];

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const enabled: string[] = JSON.parse(user?.labsFlags ?? "[]");
  return NextResponse.json({ enabled, features: LABS_FEATURES });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { enabled } = await req.json();
  await prisma.user.update({ where: { id: session.user.id }, data: { labsFlags: JSON.stringify(enabled) } });
  return NextResponse.json({ ok: true });
}
