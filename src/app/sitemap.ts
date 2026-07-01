import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://thatcode.dev", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://thatcode.dev/pricing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://thatcode.dev/showcase", lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: "https://thatcode.dev/docs", lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: "https://thatcode.dev/contact", lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  // Published projects
  let publishedProjects: MetadataRoute.Sitemap = [];
  try {
    const projects = await prisma.project.findMany({
      where: {
        publishSlug: { not: null },
        publishedAt: { not: null },
        isPrivate: false,
        deletedAt: null,
      },
      select: { publishSlug: true, updatedAt: true },
      take: 5000,
    });

    publishedProjects = projects
      .filter((p) => p.publishSlug)
      .map((p) => ({
        url: `https://thatcode.dev/p/${p.publishSlug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }));
  } catch {
    // DB unavailable at build time — skip dynamic entries
  }

  return [...staticRoutes, ...publishedProjects];
}
