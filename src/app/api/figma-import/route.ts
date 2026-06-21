import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

function extractFigmaFileKey(url: string): string | null {
  const m = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { figmaUrl, figmaToken } = await req.json();
  if (!figmaUrl || !figmaToken) return NextResponse.json({ error: "figmaUrl and figmaToken required" }, { status: 400 });

  const fileKey = extractFigmaFileKey(figmaUrl);
  if (!fileKey) return NextResponse.json({ error: "Invalid Figma URL" }, { status: 400 });

  // Fetch Figma file
  const figmaRes = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=3`, {
    headers: { "X-Figma-Token": figmaToken },
  });
  if (!figmaRes.ok) {
    return NextResponse.json({ error: "Failed to fetch Figma file. Check your token and URL." }, { status: 400 });
  }
  const figmaData = await figmaRes.json();

  // Extract relevant structure
  const pageName = figmaData.document?.children?.[0]?.name ?? "Page 1";
  const frames = figmaData.document?.children?.[0]?.children ?? [];

  // Summarize the Figma structure for Claude
  function summarize(node: Record<string, unknown>, depth = 0): string {
    if (depth > 4) return "";
    const indent = "  ".repeat(depth);
    const name = (node.name as string) ?? "";
    const type = (node.type as string) ?? "";
    const children = (node.children as Record<string, unknown>[]) ?? [];
    let out = `${indent}${type}: "${name}"`;
    if (node.characters) out += ` [text: "${String(node.characters).slice(0, 60)}"]`;
    if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
      const fill = node.fills[0] as Record<string, unknown>;
      if (fill.color) {
        const c = fill.color as { r: number; g: number; b: number };
        out += ` [fill: rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})]`;
      }
    }
    out += "\n";
    for (const child of children.slice(0, 20)) {
      out += summarize(child, depth + 1);
    }
    return out;
  }

  const structure = frames.slice(0, 5).map((f: Record<string, unknown>) => summarize(f)).join("\n");
  const prompt = `Convert this Figma design structure into a complete React app. Build a fully functional version that matches the design as closely as possible using inline styles.

Figma file: "${figmaData.name}"
Page: "${pageName}"

Design structure:
${structure}

Build a complete, production-quality React app with:
- Exact colors from the design
- Proper layout matching the Figma structure
- Real interactive components (buttons should work, forms should have state)
- Responsive design
- All the sections/screens visible in the frames`;

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8096,
    system: `You are an expert React developer converting Figma designs to code. Output ONLY a JSON object with this shape: {"prompt": "the build prompt to send to the generator"}. No other text.`,
    messages: [{ role: "user", content: prompt }],
  });

  try {
    const raw = (res.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(raw);
    return NextResponse.json({ prompt: parsed.prompt ?? prompt, fileName: figmaData.name });
  } catch {
    return NextResponse.json({ prompt, fileName: figmaData.name });
  }
}
