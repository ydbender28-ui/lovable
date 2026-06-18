import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { type AgentTool, BUILTIN_TOOLS, toClaudeTool, executeTool } from "@/lib/agentTools";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_TOOL_ROUNDS = 10; // prevent infinite loops

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) return new Response("Not found", { status: 404 });

  if (!agent.public) {
    const session = await auth();
    if (!session?.user || session.user.id !== agent.ownerId)
      return new Response("Unauthorized", { status: 401 });
  }

  const { messages }: { messages: ChatMessage[] } = await req.json();
  if (!messages?.length) return new Response("Messages required", { status: 400 });

  const userTools: AgentTool[] = JSON.parse(agent.tools || "[]");
  const allTools: AgentTool[] = [...BUILTIN_TOOLS, ...userTools];
  const claudeTools = allTools.map(toClaudeTool);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      try {
        // Convert chat history to Anthropic format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let anthropicMessages: any[] = messages.map(m => ({ role: m.role, content: m.content }));

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          // Call Claude (non-streaming for tool-use rounds, streaming for final)
          const response = await client.messages.create({
            model: agent.model,
            max_tokens: 4096,
            system: agent.systemPrompt,
            tools: claudeTools,
            messages: anthropicMessages,
          });

          if (response.stop_reason === "tool_use") {
            // Extract text + tool calls from response
            const textParts = response.content.filter(b => b.type === "text");
            const toolCalls = response.content.filter(b => b.type === "tool_use");

            // Stream any thinking text the model produced before tool calls
            for (const part of textParts) {
              if (part.type === "text" && part.text) {
                send("text", { text: part.text });
              }
            }

            // Add assistant message to history
            anthropicMessages.push({ role: "assistant", content: response.content });

            // Execute all tool calls (in parallel)
            const toolResults = await Promise.all(
              toolCalls.map(async (tc) => {
                if (tc.type !== "tool_use") return null;
                const toolDef = allTools.find(t => t.name === tc.name);
                if (!toolDef) return null;

                // Tell the client we're using a tool
                send("tool_start", {
                  name: tc.name,
                  description: toolDef.description.split(".")[0],
                  input: tc.input,
                });

                const result = await executeTool(toolDef, tc.input as Record<string, unknown>);

                send("tool_result", { name: tc.name, result: result.slice(0, 500) });

                return { type: "tool_result" as const, tool_use_id: tc.id, content: result };
              })
            );

            // Add tool results to history
            anthropicMessages.push({
              role: "user",
              content: toolResults.filter(Boolean),
            });

            // Loop — Claude will now respond with either more tools or a final answer

          } else {
            // Final text response — stream it
            for (const block of response.content) {
              if (block.type === "text") {
                // Stream word by word for smooth UX
                const words = block.text.split(/(\s+)/);
                for (const chunk of words) {
                  send("text", { text: chunk });
                  await new Promise(r => setTimeout(r, 8)); // ~125 words/sec
                }
              }
            }
            send("done", {});
            break;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error";
        send("error", { error: msg });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
