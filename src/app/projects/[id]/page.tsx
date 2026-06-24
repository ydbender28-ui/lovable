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

  const isOwner = session.user.email === "ydbender28@gmail.com";
  const [project, user] = await Promise.all([
    prisma.project.findFirst({
      where: isOwner ? { id } : { id, ownerId: session.user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        versions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true, plan: true } }),
  ]);

  if (!project) notFound();

  const rawFiles = JSON.parse(project.versions[0]?.files ?? "{}");

  // Migrate old formats to current Tailwind + TypeScript format
  let files = rawFiles;
  if (rawFiles["src/App.tsx"] && !rawFiles["/App.tsx"] && !rawFiles["/App.js"]) {
    const appCode = rawFiles["src/App.tsx"] || "";
    files = {
      "/App.tsx": `import './index.css';\n\n${appCode.replace(/^import\s.*;\s*$/gm, "").replace(/export default/, "export default")}`,
      "/index.css": `:root { --background: 0 0% 100%; --foreground: 222 47% 11%; --primary: 262 83% 58%; --border: 214 32% 91%; --muted-foreground: 215 16% 47%; }\n* { box-sizing: border-box; margin: 0; padding: 0; }\nbody { font-family: system-ui, sans-serif; }`,
    };
  } else if (rawFiles["/App.js"] && !rawFiles["/App.tsx"]) {
    // Migrate .js to .tsx
    files = { ...rawFiles, "/App.tsx": rawFiles["/App.js"] };
    delete files["/App.js"];
    if (files["/styles.css"] && !files["/index.css"]) {
      files["/index.css"] = files["/styles.css"];
      delete files["/styles.css"];
    }
  }

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
