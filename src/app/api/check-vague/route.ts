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
        parts: [{ text: `You are deciding if an app request needs clarification. Answer only YES or NO.

Say YES only if the request has NO subject/domain at all — literally just generic words like "make an app" or "build a website" or "create a tool".

Say NO (build it) if the request mentions ANY specific thing: a product name, industry, company type, feature, or domain. When in doubt, say NO.

NO examples (build immediately): "salesforce app", "create salesforce", "crm", "e-commerce", "fitness tracker", "portfolio", "todo list", "dashboard", "inventory system", "booking app", "restaurant menu"
YES examples (needs clarification): "make an app", "build me something", "create a website", "build a tool"

Request: "${prompt}"` }],
      }],
    });
    const answer = res.text?.trim().toUpperCase() ?? "NO";
    return Response.json({ vague: answer.startsWith("YES") });
  } catch {
    return Response.json({ vague: false });
  }
}
