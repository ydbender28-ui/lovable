import { auth } from "@/lib/auth";

export const maxDuration = 120;
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  await params; // unused but required

  const { prompt } = await req.json();
  if (!prompt || typeof prompt !== "string") return new Response("Prompt required", { status: 400 });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `You are an expert at writing prompts for AI web app generators. Rewrite the following prompt to be more specific, detailed, and actionable. Add relevant UI details, features, and design direction. Keep it under 120 words. Return ONLY the improved prompt with no preamble or explanation.\n\nOriginal prompt: ${prompt}`,
      }],
    });
    const enhanced = msg.content[0].type === "text" ? msg.content[0].text.trim() : prompt;
    return Response.json({ enhanced });
  } catch {
    return Response.json({ enhanced: prompt });
  }
}
