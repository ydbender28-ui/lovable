import { auth } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { prompt } = await req.json();
  if (!prompt) return Response.json({ vague: false });

  try {
    const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
    const res = await client.models.generateContent({
      model: "gemini-2.5-flash",
      config: { maxOutputTokens: 5 },
      contents: [{
        role: "user",
        parts: [{ text: `Does this app request need clarification before building? Answer only YES or NO.\n\nExamples that need clarification: "make an app", "build a website", "create a tool"\nExamples that do NOT need clarification: "salesforce CRM", "e-commerce store for shoes", "landing page for my gym", "todo app"\n\nRequest: "${prompt}"` }],
      }],
    });
    const answer = res.text?.trim().toUpperCase() ?? "NO";
    return Response.json({ vague: answer.startsWith("YES") });
  } catch {
    return Response.json({ vague: false });
  }
}
