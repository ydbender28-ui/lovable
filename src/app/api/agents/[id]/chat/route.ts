import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) return new Response("Not found", { status: 404 });

  // Public agents anyone can chat with; private require auth
  if (!agent.public) {
    const session = await auth();
    if (!session?.user || session.user.id !== agent.ownerId) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const { messages }: { messages: ChatMessage[] } = await req.json();
  if (!messages?.length) return new Response("Messages required", { status: 400 });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));

      try {
        const s = client.messages.stream({
          model: agent.model,
          max_tokens: 2048,
          system: agent.systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        });
        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send(event.delta.text);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
