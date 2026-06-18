import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ctx.params; // unused but required
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { description } = await req.json();
  if (!description) return NextResponse.json({ error: "Description required" }, { status: 400 });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Write a system prompt for an AI agent based on this description:

"${description}"

The system prompt should:
- Define the agent's role, personality, and expertise clearly
- List specific things it should and shouldn't do
- Set the tone (formal/casual, helpful, etc.)
- Handle edge cases (what to do if asked something outside its scope)
- Be 150-300 words, written directly as instructions to the AI (start with "You are...")

Return ONLY the system prompt text, nothing else.`,
    }],
  });

  const prompt = response.content[0].type === "text" ? response.content[0].text : "";
  return NextResponse.json({ prompt });
}
