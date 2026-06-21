import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  let pageContent = "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ThatCode/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    // Strip tags, keep text content
    pageContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 8000);
  } catch {
    return NextResponse.json({ error: "Could not fetch URL. Make sure it's publicly accessible." }, { status: 400 });
  }

  const analysis = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `You are a product analyst. Given the text content of a web page, extract its core features, layout structure, and UI patterns. Return JSON only:
{
  "appName": "Inferred product name",
  "category": "landing page | saas | e-commerce | dashboard | portfolio | social | marketplace | tool",
  "coreSections": ["Hero with headline + CTA", "Features grid", "Pricing table", "Footer with links"],
  "keyFeatures": ["Email signup", "Testimonials carousel", "Dark/light mode"],
  "designStyle": "minimal clean white | dark professional | bold colorful | corporate blue",
  "buildPrompt": "Build an app inspired by the structure and functionality of this product. Include: [specific list of sections and features to recreate]. DO NOT copy any branding, logos, or copyrighted content — create an original design with the same structural approach. [Very specific, complete build instructions]"
}`,
    messages: [{ role: "user", content: `Page content from ${url}:\n\n${pageContent}` }],
  });

  try {
    const text = (analysis.content[0] as { type: string; text: string }).text;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
