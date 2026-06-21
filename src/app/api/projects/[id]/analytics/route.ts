import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const events = await prisma.analyticsEvent.findMany({
    where: { projectId: id, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
  });

  type Evt = (typeof events)[number];
  const pageviews = events.filter((e: Evt) => e.eventType === "pageview").length;
  const clicks = events.filter((e: Evt) => e.eventType === "click").length;
  const rageclicks = events.filter((e: Evt) => e.eventType === "ragclick").length;
  const formSubmits = events.filter((e: Evt) => e.eventType === "form_submit").length;

  // Daily breakdown
  const dayMap: Record<string, { pageviews: number; clicks: number; rageclicks: number }> = {};
  for (const e of events) {
    const day = e.createdAt.toISOString().slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { pageviews: 0, clicks: 0, rageclicks: 0 };
    if (e.eventType === "pageview") dayMap[day].pageviews++;
    if (e.eventType === "click") dayMap[day].clicks++;
    if (e.eventType === "ragclick") dayMap[day].rageclicks++;
  }
  const daily = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

  // Top rage-click elements
  const rageMap: Record<string, number> = {};
  for (const e of events.filter((e: Evt) => e.eventType === "ragclick")) {
    if (e.element) rageMap[e.element] = (rageMap[e.element] ?? 0) + 1;
  }
  const topRageClicks = Object.entries(rageMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([el, count]) => ({ el, count }));

  return NextResponse.json({ pageviews, clicks, rageclicks, formSubmits, daily, topRageClicks });
}
