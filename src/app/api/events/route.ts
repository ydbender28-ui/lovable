import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { projectId, eventType, path, element } = await req.json();
    if (!projectId || !eventType) return NextResponse.json({ ok: false });
    await prisma.analyticsEvent.create({ data: { projectId, eventType, path, element } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
