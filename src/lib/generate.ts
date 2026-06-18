import Anthropic from "@anthropic-ai/sdk";

export type ProjectFiles = Record<string, string>;

// ─── Design seeds ─────────────────────────────────────────────────────────────

const DESIGN_THEMES = [
  {
    name: "dark-minimal",
    bg: "#0a0a0f", card: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)",
    accent: "#8b5cf6", accent2: "#6366f1", text: "#f4f4f5", muted: "#71717a", radius: "12px",
    layout: "centered",
    description: `Dark minimal — centered layout, sidebar navigation, generous whitespace.
LAYOUT: sidebar nav (240px) + main content area. Nav items stacked vertically with icon + label.
TYPOGRAPHY: font-size 13px base, 24px headings, tight letter-spacing on headings.
CARDS: subtle blur backdrop-filter, very low opacity backgrounds.`,
  },
  {
    name: "dark-tech",
    bg: "#020817", card: "rgba(14,165,233,0.06)", border: "rgba(14,165,233,0.18)",
    accent: "#0ea5e9", accent2: "#06b6d4", text: "#e2f3ff", muted: "#64748b", radius: "6px",
    layout: "dashboard",
    description: `Dark blue tech — dense dashboard, grid layout, data-heavy.
LAYOUT: top nav + grid of stat cards (3-4 cols), tables with monospace data, compact 12px text.
TYPOGRAPHY: monospace font for data (font-family:'Courier New',monospace), sans for labels.
CARDS: solid colored header row, striped table rows, dot indicators.`,
  },
  {
    name: "dark-terminal",
    bg: "#0d1117", card: "rgba(34,197,94,0.05)", border: "rgba(34,197,94,0.12)",
    accent: "#22c55e", accent2: "#10b981", text: "#c9d1d9", muted: "#6b7280", radius: "4px",
    layout: "terminal",
    description: `Dark terminal — hacker/dev aesthetic, monospace everything, command-line inspired.
LAYOUT: full-width, no sidebar, content in terminal-style panels. Prefix labels with > or $.
TYPOGRAPHY: font-family:'Courier New',monospace for ALL text. 13px base.
CARDS: border-left:3px solid accent, no border-radius, plain solid borders.`,
  },
  {
    name: "dark-bold",
    bg: "#09090b", card: "#18181b", border: "#27272a",
    accent: "#f97316", accent2: "#ef4444", text: "#fafafa", muted: "#a1a1aa", radius: "16px",
    layout: "bold",
    description: `Dark bold — large typography, expressive, magazine-like.
LAYOUT: hero section with huge headline (64px+), full-width sections, alternating left/right content.
TYPOGRAPHY: font-weight:900, font-size:56px+ for heroes, lots of visual contrast.
CARDS: large rounded corners (24px), gradient backgrounds, prominent CTAs.`,
  },
  {
    name: "light-clean",
    bg: "#ffffff", card: "#f8fafc", border: "#e2e8f0",
    accent: "#6366f1", accent2: "#8b5cf6", text: "#0f172a", muted: "#64748b", radius: "10px",
    layout: "saas",
    description: `Light clean SaaS — professional, Notion/Linear inspired.
LAYOUT: left sidebar (220px, white bg, light border) + main content, top breadcrumb bar.
TYPOGRAPHY: Inter-like sans-serif, 14px base, 600 weight for headings, very clean hierarchy.
CARDS: white bg, 1px border, subtle box-shadow, no heavy decorations.`,
  },
  {
    name: "light-editorial",
    bg: "#fafaf9", card: "#f5f5f4", border: "#d6d3d1",
    accent: "#dc2626", accent2: "#ea580c", text: "#1c1917", muted: "#78716c", radius: "2px",
    layout: "editorial",
    description: `Light editorial — newspaper/magazine, strong typographic hierarchy.
LAYOUT: 2-column editorial grid, wide left content + narrow right sidebar, ruled dividers.
TYPOGRAPHY: serif font (Georgia,serif) for body, 800 weight sans-serif for headlines.
CARDS: no rounded corners, thick left border accent, dividing lines instead of card shadows.`,
  },
  {
    name: "dark-glass",
    bg: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)",
    card: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.12)",
    accent: "#a78bfa", accent2: "#818cf8", text: "#e2e8f0", muted: "#94a3b8", radius: "20px",
    layout: "glass",
    description: `Dark purple glass — glassmorphism, floating cards, gradient background.
LAYOUT: centered floating cards, gradient mesh background, cards with blur effect.
CSS: backdrop-filter:blur(20px) on all cards, background must be the gradient string above.
TYPOGRAPHY: 15px base, light font-weight:300 for body, 700 for headings.
CARDS: rgba white background + blur, large rounded corners (20-28px), subtle glow shadows.`,
  },
  {
    name: "dark-premium",
    bg: "#0c0a00", card: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.15)",
    accent: "#fbbf24", accent2: "#f59e0b", text: "#fef9c3", muted: "#a1a1aa", radius: "8px",
    layout: "premium",
    description: `Dark gold premium — luxury, high-end, financial/crypto aesthetic.
LAYOUT: centered max-width 900px, prominent hero metric (huge number center), stacked sections.
TYPOGRAPHY: uppercase labels with letter-spacing:4px, thin font-weight:200 for large numbers.
CARDS: very dark bg, gold border-bottom:2px solid accent, minimalist data display.`,
  },
] as const;

let _lastThemeIdx = -1;
function pickDesign(prompt: string) {
  // Use prompt hash as seed but always pick differently from last time
  let h = 0;
  for (let i = 0; i < prompt.length; i++) h = ((h << 5) - h + prompt.charCodeAt(i)) | 0;
  let idx = Math.abs(h) % DESIGN_THEMES.length;
  if (idx === _lastThemeIdx) idx = (idx + 1) % DESIGN_THEMES.length;
  _lastThemeIdx = idx;
  return DESIGN_THEMES[idx];
}

// ─── System prompt ────────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are an expert React developer. Build exactly what the user asks — full, complete, production-quality apps with real data and working interactions.

CRITICAL OUTPUT FORMAT — use EXACTLY this delimiter format, nothing else, no markdown fences:

SUMMARY: <2-3 sentences describing what you built>

===FILE: index.html===
<full file content>
===FILE: src/main.tsx===
<full file content>
===FILE: src/App.tsx===
<full file content>
===END===

Rules: no JSON, no code fences, no commentary outside the format above.

FILE RULES:
- index.html: minimal shell with <style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0f;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}</style>
- src/main.tsx: just ReactDOM.createRoot + App mount
- src/App.tsx: THE ENTIRE APPLICATION in one file — every component, hook, util, and data

STYLING (mandatory):
- ALL styles via inline style={{}} — never className with Tailwind/CSS files
- Dark theme: bg #0a0a0f, cards rgba(255,255,255,0.05) border 1px solid rgba(255,255,255,0.1), accent #8b5cf6
- Hover effects: onMouseEnter/onMouseLeave + useState per element
- Transitions: transition:'all 0.2s'

HANDLING COMPLEX FEATURES:

Image uploads:
  const [img, setImg] = useState('');
  <input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>setImg(r.result as string);r.readAsDataURL(f)}}/>
  <img src={img} style={{maxWidth:'100%'}}/>

Data persistence:
  const [items, setItems] = useState<T[]>(()=>JSON.parse(localStorage.getItem('key')||'[]'));
  useEffect(()=>localStorage.setItem('key',JSON.stringify(items)),[items]);

Admin/CRUD panels:
  const [view, setView] = useState<'public'|'admin'>('public');
  const [editing, setEditing] = useState<Item|null>(null);
  // Admin view: form + list with edit/delete buttons
  // Public view: read-only display

SVG charts (never use external chart libraries):
  <svg viewBox="0 0 400 200" style={{width:'100%'}}>
    {data.map((v,i)=><rect key={i} x={i*40} y={200-v*2} width={30} height={v*2} fill="#8b5cf6"/>)}
  </svg>

Drag and drop:
  onDragStart={e=>e.dataTransfer.setData('id',item.id)}
  onDragOver={e=>e.preventDefault()}
  onDrop={e=>{const id=e.dataTransfer.getData('id'); /* reorder */}}

QUALITY BAR:
- 15-20 realistic hardcoded items minimum for lists/products
- Multiple views/pages via useState (not React Router)
- Error/empty/loading states for every async or conditional section
- Mobile-responsive using flexbox wrap and min-width
- Working forms with validation and feedback
- NO placeholders, NO TODOs, NO stub functions — implement everything completely

SECURITY — CRITICAL:
- NEVER display passwords, admin credentials, secret codes, access instructions, or how to reach hidden/admin features in ANY visible UI text, labels, tooltips, or comments rendered on screen.
- Secret/admin access MUST use only invisible triggers: e.g., clicking the logo 5 times, a keyboard shortcut like Ctrl+Shift+A, or a hidden element. Never render text like "Admin password:", "To access admin:", "Secret code:", etc.
- If asked to build an admin panel, implement it with a hidden trigger and a password check in state — but NEVER show the password or instructions in the rendered output.

DESIGN SYSTEM (injected per request — follow exactly):
{{DESIGN_INJECTION}}`;

// ─── Model routing ────────────────────────────────────────────────────────────

type Complexity = "simple" | "medium" | "complex";

interface ModelOption {
  provider: "anthropic" | "openai" | "google";
  model: string;
  displayName: string;
  maxTokens: number;
}

// Ordered cheapest-first within each tier
const ROUTING: Record<Complexity, ModelOption[]> = {
  simple: [
    { provider: "google",    model: "gemini-2.0-flash",        displayName: "Gemini Flash",  maxTokens: 8192 },
    { provider: "openai",    model: "gpt-4o-mini",             displayName: "GPT-4o mini",   maxTokens: 16384 },
    { provider: "anthropic", model: "claude-haiku-4-5-20251001", displayName: "Claude Haiku",  maxTokens: 16000 },
  ],
  medium: [
    { provider: "openai",    model: "gpt-4o-mini",             displayName: "GPT-4o mini",   maxTokens: 16384 },
    { provider: "google",    model: "gemini-2.0-flash",        displayName: "Gemini Flash",  maxTokens: 8192 },
    { provider: "anthropic", model: "claude-haiku-4-5-20251001", displayName: "Claude Haiku",  maxTokens: 16000 },
  ],
  complex: [
    { provider: "anthropic", model: "claude-sonnet-4-6",       displayName: "Claude Sonnet", maxTokens: 32000 },
    { provider: "openai",    model: "gpt-4o",                  displayName: "GPT-4o",        maxTokens: 16384 },
    { provider: "google",    model: "gemini-2.5-pro-preview-06-05", displayName: "Gemini Pro", maxTokens: 16384 },
  ],
};

function scoreComplexity(prompt: string, existingFiles: ProjectFiles | null): Complexity {
  const t = prompt.toLowerCase();
  const complexWords = [
    "admin", "upload", "image", "photo", "file", "auth", "login", "signup",
    "payment", "chart", "graph", "dashboard", "crud", "real-time", "drag", "drop",
    "animation", "3d", "canvas", "video", "audio", "websocket", "api key",
    "multi", "multi-step", "wizard", "workflow", "notification", "email",
  ];
  const mediumWords = [
    "search", "filter", "sort", "pagination", "modal", "carousel", "table",
    "form", "calendar", "map", "todo", "kanban", "analytics", "report",
  ];
  const complexCount = complexWords.filter(w => t.includes(w)).length;
  const mediumCount  = mediumWords.filter(w => t.includes(w)).length;

  // Large existing codebase → complex
  if (existingFiles && JSON.stringify(existingFiles).length > 8000) return "complex";
  if (complexCount >= 2 || prompt.length > 250) return "complex";
  if (complexCount >= 1 || mediumCount >= 2 || prompt.length > 100) return "medium";
  return "simple";
}

function pickModel(complexity: Complexity): ModelOption {
  for (const opt of ROUTING[complexity]) {
    if (opt.provider === "anthropic" && process.env.ANTHROPIC_API_KEY) return opt;
    if (opt.provider === "openai"    && process.env.OPENAI_API_KEY)    return opt;
    if (opt.provider === "google"    && process.env.GOOGLE_AI_API_KEY) return opt;
  }
  // Fallback: Claude Sonnet (always available if the app is running)
  return { provider: "anthropic", model: "claude-sonnet-4-6", displayName: "Claude Sonnet", maxTokens: 32000 };
}

// ─── Provider adapters ────────────────────────────────────────────────────────

async function generateWithAnthropic(
  model: string,
  maxTokens: number,
  userContent: string,
  systemPrompt: string,
  onToken: (t: string) => void
): Promise<{ text: string; stopped: boolean; inputTokens: number; outputTokens: number }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  let text = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      text += event.delta.text;
      onToken(event.delta.text);
    }
  }
  const final = await stream.finalMessage();
  return {
    text,
    stopped: final.stop_reason === "max_tokens",
    inputTokens: final.usage.input_tokens,
    outputTokens: final.usage.output_tokens,
  };
}

async function generateWithOpenAI(
  model: string,
  maxTokens: number,
  userContent: string,
  systemPrompt: string,
  onToken: (t: string) => void
): Promise<{ text: string; stopped: boolean; inputTokens: number; outputTokens: number }> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const stream = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userContent },
    ],
  });

  let text = "";
  let stopped = false;
  let inputTokens = 0, outputTokens = 0;
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) { text += delta; onToken(delta); }
    if (chunk.choices[0]?.finish_reason === "length") stopped = true;
    if (chunk.usage) { inputTokens = chunk.usage.prompt_tokens; outputTokens = chunk.usage.completion_tokens; }
  }
  return { text, stopped, inputTokens, outputTokens };
}

async function generateWithGoogle(
  model: string,
  maxTokens: number,
  userContent: string,
  systemPrompt: string,
  onToken: (t: string) => void
): Promise<{ text: string; stopped: boolean; inputTokens: number; outputTokens: number }> {
  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

  const response = await client.models.generateContentStream({
    model,
    config: {
      maxOutputTokens: maxTokens,
      systemInstruction: systemPrompt,
    },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
  });

  let text = "";
  let stopped = false;
  let inputTokens = 0, outputTokens = 0;
  for await (const chunk of response) {
    const delta = chunk.text ?? "";
    if (delta) { text += delta; onToken(delta); }
    if (chunk.candidates?.[0]?.finishReason === "MAX_TOKENS") stopped = true;
    if (chunk.usageMetadata) {
      inputTokens = chunk.usageMetadata.promptTokenCount ?? 0;
      outputTokens = chunk.usageMetadata.candidatesTokenCount ?? 0;
    }
  }
  return { text, stopped, inputTokens, outputTokens };
}

// ─── Delimiter format parser ──────────────────────────────────────────────────

function parseDelimitedOutput(text: string): { summary: string; files: ProjectFiles } | null {
  const files: ProjectFiles = {};

  // Extract summary (text between SUMMARY: and first ===FILE:)
  const summaryStart = text.indexOf("SUMMARY:");
  const firstFile = text.indexOf("===FILE:");
  const summaryRaw = summaryStart !== -1
    ? text.slice(summaryStart + 8, firstFile !== -1 ? firstFile : undefined).trim()
    : "";
  const summary = summaryRaw || "Done! Check the preview.";

  // Extract each file block ([\s\S] matches any char including newlines, works without 's' flag)
  const fileRegex = /===FILE:\s*([^\n=]+?)===\n([\s\S]*?)(?====FILE:|===END===|$)/g;
  let match;
  while ((match = fileRegex.exec(text)) !== null) {
    const path = match[1].trim();
    const content = match[2].trimEnd();
    if (path && content) files[path] = content;
  }

  if (Object.keys(files).length === 0) return null;
  return { summary, files };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface GenerateResult {
  files: ProjectFiles;
  summary: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
}

export async function generateProject(
  prompt: string,
  existingFiles: ProjectFiles | null,
  envVars: Record<string, string> | null,
  onToken?: (text: string) => void,
  onStatus?: (text: string) => void
): Promise<GenerateResult> {
  const complexity = scoreComplexity(prompt, existingFiles);
  const modelOpt   = pickModel(complexity);
  const design     = pickDesign(prompt);

  const SYSTEM_PROMPT = BASE_SYSTEM_PROMPT.replace(
    "{{DESIGN_INJECTION}}",
    `${design.description}
COLORS (use exactly):
- body background: ${design.bg}
- card/surface: ${design.card}
- border: ${design.border}
- primary accent: ${design.accent}
- secondary accent: ${design.accent2}
- text: ${design.text}
- muted text: ${design.muted}
- border-radius: ${design.radius}
Make the entire layout and structure match this design system. It should look DRAMATICALLY different from a generic dark-mode app.`
  );

  onStatus?.("Starting generation…");

  const envSection = envVars && Object.keys(envVars).length > 0
    ? `\n\nEnvironment variables available (inject as const at top of App.tsx):\n${JSON.stringify(envVars)}`
    : "";

  // Serialize existing files as delimited blocks so the model can read them without JSON confusion
  let existingSection = "";
  if (existingFiles && Object.keys(existingFiles).length > 0) {
    const serialized = Object.entries(existingFiles)
      .map(([path, content]) => `===FILE: ${path}===\n${content}`)
      .join("\n");
    if (serialized.length < 60000) existingSection = serialized;
  }
  const isEdit = !!existingSection;

  const userContent = isEdit
    ? `CURRENT CODE:\n${existingSection}${envSection}\n\nEDIT REQUEST: ${prompt}\n\nCRITICAL EDIT RULES:
- Make ONLY the minimal changes needed to address the edit request
- PRESERVE the app's overall purpose, type, and theme completely — if it's a Salesforce CRM, keep it a Salesforce CRM
- PRESERVE all existing components, features, data, and design style not mentioned in the edit
- If asked to fix mobile layout: add responsive CSS only, do NOT restructure or redesign
- If asked to fix a bug: fix only that bug, touch nothing else
- NEVER change the application from one type to another (e.g., CRM → e-commerce is forbidden)
- Return the complete updated files in the delimiter format.`
    : `BUILD REQUEST: ${prompt}${envSection}\n\nReturn all 3 files in the delimiter format.`;

  let text = "";
  let stopped = false;
  let inputTokens = 0, outputTokens = 0;

  const statusMap: [number, string][] = [
    [100,   "Analyzing your request…"],
    [500,   "Planning app structure…"],
    [1200,  "Writing HTML shell…"],
    [2500,  "Building React components…"],
    [5000,  "Adding state & interactions…"],
    [9000,  "Wiring up data & logic…"],
    [15000, "Styling & polishing UI…"],
    [22000, "Finalizing & cleaning up…"],
  ];
  let lastStatusIdx = -1;
  const tokenCallback = (token: string) => {
    text += token;
    onToken?.(token);
    for (let i = statusMap.length - 1; i >= 0; i--) {
      if (text.length >= statusMap[i][0] && i > lastStatusIdx) {
        lastStatusIdx = i;
        onStatus?.(statusMap[i][1]);
        break;
      }
    }
  };

  try {
    if (modelOpt.provider === "anthropic") {
      ({ stopped, inputTokens, outputTokens } = await generateWithAnthropic(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback));
    } else if (modelOpt.provider === "openai") {
      ({ stopped, inputTokens, outputTokens } = await generateWithOpenAI(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback));
    } else {
      ({ stopped, inputTokens, outputTokens } = await generateWithGoogle(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback));
    }
  } catch {
    // Provider failed — silently fall back to Claude Sonnet
    const fallback = { provider: "anthropic" as const, model: "claude-sonnet-4-6", displayName: "Claude Sonnet", maxTokens: 32000 };
    if (modelOpt.provider !== "anthropic") {
      text = "";
      lastStatusIdx = -1;
      ({ stopped, inputTokens, outputTokens } = await generateWithAnthropic(fallback.model, fallback.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback));
      modelOpt.displayName = fallback.displayName;
    } else {
      throw new Error("Generation failed. Please try again.");
    }
  }

  if (stopped) {
    throw new Error(
      `Response was cut off (${modelOpt.displayName} hit its output limit). ` +
      "Try breaking your request into steps — build the basics first, then add features one at a time."
    );
  }

  const parsed = parseDelimitedOutput(text);

  if (!parsed) {
    throw new Error("Model did not return files in the expected format. Please try again.");
  }

  if (!parsed.files["src/App.tsx"]) {
    throw new Error("Model response was incomplete — missing App.tsx. Please try again.");
  }
  if (parsed.files["src/App.tsx"].length < 200) {
    throw new Error("Model returned a near-empty app. Please try again or rephrase your request.");
  }

  return {
    files: parsed.files,
    summary: parsed.summary,
    modelUsed: modelOpt.displayName,
    inputTokens,
    outputTokens,
  };
}

export function defaultProjectFiles(): ProjectFiles {
  return {
    "index.html": `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>App</title><style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0f;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}</style></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
    "src/main.tsx": `import React from "react";import ReactDOM from "react-dom/client";import App from "./App";ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);`,
    "src/App.tsx": `export default function App(){return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0a0f"}}><div style={{textAlign:"center"}}><h1 style={{fontSize:32,fontWeight:700,color:"#fff",marginBottom:12}}>Start building</h1><p style={{color:"#71717a",fontSize:16}}>Describe what you want to build in the chat.</p></div></div>);}`,
  };
}
