import { prisma } from "@/lib/prisma";
import { generateProject, estimateCost, MODELS } from "@/lib/generate";

export const maxDuration = 300;

const ADMIN_SECRET = process.env.TEST_ADMIN_SECRET || "devforge-test-2026";
const ADMIN_USER_ID = "cmqk6skat000004l2tuxbz983";

export async function POST(req: Request) {
  const body = await req.json();
  const { secret, action, projectId, prompt, name } = body;

  if (secret !== ADMIN_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (action === "create") {
    const project = await prisma.project.create({
      data: { name: name || "Test Project", ownerId: ADMIN_USER_ID },
    });
    return Response.json({ id: project.id, name: project.name });
  }

  if (action === "generate") {
    if (!projectId || !prompt) {
      return Response.json({ error: "projectId and prompt required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId },
      include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!project) return Response.json({ error: "not found" }, { status: 404 });

    const existingFiles = project.versions[0] ? JSON.parse(project.versions[0].files) : null;

    const start = Date.now();
    try {
      const result = await generateProject(
        prompt, existingFiles, null,
        undefined, undefined,
        null, undefined,
        undefined, null, null
      );

      const finalFiles = existingFiles ? { ...existingFiles, ...result.files } : result.files;

      await Promise.all([
        prisma.version.create({
          data: { projectId, files: JSON.stringify(finalFiles), modelUsed: result.modelUsed, inputTokens: result.inputTokens, outputTokens: result.outputTokens },
        }),
        prisma.message.create({ data: { projectId, role: "user", content: prompt } }),
        prisma.message.create({ data: { projectId, role: "assistant", content: result.summary } }),
      ]);

      return Response.json({
        success: true,
        time: ((Date.now() - start) / 1000).toFixed(1),
        summary: result.summary,
        files: Object.keys(result.files),
        modelUsed: result.modelUsed,
        suggestions: result.suggestions,
      });
    } catch (err) {
      return Response.json({
        success: false,
        time: ((Date.now() - start) / 1000).toFixed(1),
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  if (action === "delete") {
    if (!projectId) return Response.json({ error: "projectId required" }, { status: 400 });
    await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
    return Response.json({ ok: true });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
