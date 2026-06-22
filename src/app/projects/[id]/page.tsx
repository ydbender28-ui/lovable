import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProjectWorkspace from "./ProjectWorkspace";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ prompt?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const { prompt } = await searchParams;

  const [project, user] = await Promise.all([
    prisma.project.findFirst({
      where: { id, ownerId: session.user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        versions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true, plan: true } }),
  ]);

  if (!project) notFound();

  const files = JSON.parse(project.versions[0]?.files ?? "{}");

  return (
    <ProjectWorkspace
      projectId={project.id}
      projectName={project.name}
      initialMessages={project.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      }))}
      initialFiles={files}
      initialPublishSlug={project.publishSlug}
      initialPrompt={prompt && project.messages.length === 0 ? prompt : undefined}
      initialCredits={user?.plan === "owner" ? null : (user?.credits ?? 50)}
      userPlan={user?.plan ?? "free"}
      initialIsPrivate={project.isPrivate}
    />
  );
}
