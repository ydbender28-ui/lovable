import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request, ctx: RouteContext<"/api/projects/[id]/chat">) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const { message, history } = body as { message: string; history: Array<{ role: "user" | "assistant"; content: string }> };

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!project) return new Response("Not found", { status: 404 });

  const existingFiles = project.versions[0] ? JSON.parse(project.versions[0].files) : null;
  const codeContext = existingFiles
    ? `\n\nCurrent app code (for reference):\n${Object.entries(existingFiles as Record<string, string>).map(([p, c]) => `// ${p}\n${c.slice(0, 2000)}`).join("\n\n")}`
    : "";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      try {
        const response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: `You are a helpful coding assistant for ThatCode, an AI app builder. The user is building an app and wants to discuss it with you — planning features, understanding code, getting advice — WITHOUT generating new code right now.

Be concise and practical. When referencing specific parts of their code, be specific. If they ask you to explain something, explain it clearly. If they want advice on how to build something, give concrete suggestions they can use in their next prompt to the AI builder.${codeContext}`,
          messages: [
            ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
          ],
          stream: true,
        });

        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send(event.delta.text);
          }
        }
      } catch (e) {
        send("\n\n[Error: " + (e instanceof Error ? e.message : "Unknown error") + "]");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}
