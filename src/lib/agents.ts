// @ts-nocheck
import Anthropic from "@anthropic-ai/sdk";
import { matchDesign, buildDesignContext } from "./designs";
import { getSmartDefaults, detectCategory } from "./learning";

// ─── PLANNER AGENT (Haiku — fast, cheap) ────────────────────────────────────
// Classifies the request, picks design, determines what features to include

export async function plannerAgent(prompt: string, hasExisting: boolean) {
  const category = detectCategory(prompt);
  const design = !hasExisting ? matchDesign(prompt) : null;
  const designContext = design ? buildDesignContext(design) : "";

  let smartDefaults = "";
  try {
    const defaults = await getSmartDefaults(prompt);
    if (defaults) smartDefaults = defaults;
  } catch {}

  return {
    category,
    designContext,
    smartDefaults,
    isEdit: hasExisting,
  };
}

// ─── STYLE AGENT (Haiku — fast) ─────────────────────────────────────────────
// Generates /index.css based on the design preset

export async function styleAgent(
  prompt: string,
  designContext: string,
  existingCss: string | null,
  onToken?: (t: string) => void,
): Promise<string> {
  if (existingCss && existingCss.length > 100) return existingCss; // Don't regenerate CSS on edits

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: `Generate a /index.css file for a website. Include:
1. Google Font import
2. CSS variables in :root for the design system
3. Basic body styles
4. Smooth scroll behavior
Only output the CSS code, nothing else.`,
    messages: [{
      role: "user",
      content: `Website: ${prompt}\n\n${designContext}\n\nGenerate the complete /index.css file. Only CSS, no explanation.`
    }],
  });

  const css = (response.content[0] as { text: string }).text
    .replace(/```css\n?/g, "").replace(/```\n?/g, "").trim();

  onToken?.("Generated styles");
  return css;
}

// ─── IMAGE AGENT (API calls — no AI needed) ──────────────────────────────────
// Pre-fetches images based on category so they're ready when code is generated

export async function imageAgent(
  prompt: string,
  category: string,
): Promise<Map<string, string>> {
  const PEXELS_KEY = process.env.PEXELS_API_KEY;
  if (!PEXELS_KEY) return new Map();

  const imageMap = new Map<string, string>();

  // Pre-fetch common image types for this category
  const queries = [
    `${prompt} interior professional`,
    `${prompt} product close up`,
    `${prompt} team professional portrait`,
    `${prompt} food drink item`,
  ];

  await Promise.all(queries.map(async (q, i) => {
    try {
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=3&orientation=landscape`;
      const r = await fetch(url, { headers: { Authorization: PEXELS_KEY }, signal: AbortSignal.timeout(4000) });
      if (r.ok) {
        const data = await r.json();
        const photos = data.photos || [];
        photos.forEach((p: any, j: number) => {
          const key = `${["hero", "product", "portrait", "item"][i]}_${j}`;
          imageMap.set(key, p.src?.large2x || p.src?.large);
        });
      }
    } catch {}
  }));

  return imageMap;
}

// ─── REVIEW AGENT (Haiku — fast quality check) ──────────────────────────────
// Checks generated code for common issues and fixes them

export async function reviewAgent(
  appTsx: string,
  indexCss: string,
  onToken?: (t: string) => void,
): Promise<{ appTsx: string; indexCss: string; fixes: string[] }> {
  const fixes: string[] = [];

  // Quick checks without AI:

  // 1. Check for missing default export
  if (!appTsx.includes("export default")) {
    fixes.push("Added missing default export");
    appTsx += "\nexport default function App() { return <div>Error: missing export</div>; }";
  }

  // 2. Check for unbalanced braces
  const opens = (appTsx.match(/\{/g) || []).length;
  const closes = (appTsx.match(/\}/g) || []).length;
  if (Math.abs(opens - closes) > 2) {
    fixes.push(`Fixed unbalanced braces (${opens} open, ${closes} close)`);
    for (let i = 0; i < opens - closes; i++) appTsx += "\n}";
  }

  // 3. Check for onClick handlers that are empty or undefined
  const emptyOnClicks = appTsx.match(/onClick=\{[\s]*\}/g);
  if (emptyOnClicks) {
    fixes.push(`Found ${emptyOnClicks.length} empty onClick handlers`);
  }

  // 4. Check for imports from non-existent local files
  const localImports = appTsx.match(/import .+ from ['"]\.\/(?!components\/sections)[^'"]+['"]/g);
  if (localImports) {
    fixes.push(`Removed ${localImports.length} imports from non-existent local files`);
    for (const imp of localImports) {
      appTsx = appTsx.replace(imp, `// REMOVED: ${imp}`);
    }
  }

  // 5. Strip fade-in animations
  if (indexCss.includes("fade-in")) {
    indexCss = indexCss.replace(/\.fade-in\s*\{[^}]*\}/g, "");
    fixes.push("Stripped fade-in animations");
  }

  // 6. Fix double semicolons
  appTsx = appTsx.replace(/;;\s*/g, ";\n");

  onToken?.(`Review: ${fixes.length} fixes applied`);

  return { appTsx, indexCss, fixes };
}
