import Link from "next/link";
import Logo from "@/components/Logo";
import { prisma } from "@/lib/prisma";
import ShowcaseGrid from "./ShowcaseGrid";

export const revalidate = 60;

export default async function ShowcasePage() {
  const published = await prisma.project.findMany({
    where: { publishedAt: { not: null }, publishSlug: { not: null }, isPrivate: false },
    orderBy: { visitCount: "desc" },
    take: 30,
    select: {
      id: true,
      name: true,
      publishSlug: true,
      visitCount: true,
      owner: { select: { name: true } },
    },
  });

  return (
    <div style={{ background: "#0a0b0e", minHeight: "100vh" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/"><Logo size="md" /></Link>
          <div className="flex items-center gap-4 text-sm" style={{ color: "#7a8099" }}>
            <Link href="/templates" className="transition-colors hover:text-white" style={{ color: "#7a8099" }}>Templates</Link>
            <Link href="/showcase" className="transition-colors" style={{ color: "#eef0f6" }}>Showcase</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm" style={{ color: "#7a8099" }}>Log in</Link>
            <Link href="/signup" className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "linear-gradient(135deg,#6d5fff,#5b4ee0)" }}>Start free</Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl" style={{ color: "#eef0f6", letterSpacing: "-0.045em" }}>
            Built with ThatCode
          </h1>
          <p className="mt-3 text-base" style={{ color: "#7a8099" }}>
            Real apps made by real people. Click any to visit the live site.
          </p>
        </div>

        <ShowcaseGrid projects={published} />
      </main>
    </div>
  );
}
