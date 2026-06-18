import Anthropic from "@anthropic-ai/sdk";

export type ProjectFiles = Record<string, string>;

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert React developer. Build exactly what the user asks — full, complete, production-quality apps with real data and working interactions.

CRITICAL OUTPUT FORMAT — return ONLY this JSON object, nothing else, no markdown fences, no commentary:
{"summary":"2-3 sentences describing what you built","files":{"index.html":"...","src/main.tsx":"...","src/App.tsx":"..."}}

JSON ESCAPING (strictly required):
- Escape ALL special chars in string values: " → \\", \\ → \\\\, newline → \\n, tab → \\t
- Never put raw newlines inside a JSON string value

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
- NO placeholders, NO TODOs, NO stub functions — implement everything completely`;

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
  onToken: (t: string) => void
): Promise<{ text: string; stopped: boolean }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT,
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
  return { text, stopped: final.stop_reason === "max_tokens" };
}

async function generateWithOpenAI(
  model: string,
  maxTokens: number,
  userContent: string,
  onToken: (t: string) => void
): Promise<{ text: string; stopped: boolean }> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const stream = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    stream: true,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: userContent },
    ],
  });

  let text = "";
  let stopped = false;
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) { text += delta; onToken(delta); }
    if (chunk.choices[0]?.finish_reason === "length") stopped = true;
  }
  return { text, stopped };
}

async function generateWithGoogle(
  model: string,
  maxTokens: number,
  userContent: string,
  onToken: (t: string) => void
): Promise<{ text: string; stopped: boolean }> {
  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

  const response = await client.models.generateContentStream({
    model,
    config: {
      maxOutputTokens: maxTokens,
      systemInstruction: SYSTEM_PROMPT,
    },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
  });

  let text = "";
  let stopped = false;
  for await (const chunk of response) {
    const delta = chunk.text ?? "";
    if (delta) { text += delta; onToken(delta); }
    if (chunk.candidates?.[0]?.finishReason === "MAX_TOKENS") stopped = true;
  }
  return { text, stopped };
}

// ─── JSON extraction ──────────────────────────────────────────────────────────

function extractOutermostJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (esc)          { esc = false; continue; }
    if (ch === "\\" && inStr) { esc = true;  continue; }
    if (ch === '"')   { inStr = !inStr; continue; }
    if (inStr)        continue;
    if (ch === "{")   depth++;
    if (ch === "}")   { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface GenerateResult {
  files: ProjectFiles;
  summary: string;
  modelUsed: string;
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

  onStatus?.(`Using ${modelOpt.displayName}…`);

  const envSection = envVars && Object.keys(envVars).length > 0
    ? `\n\nEnvironment variables available (inject as const at top of App.tsx):\n${JSON.stringify(envVars)}`
    : "";

  const existingStr = existingFiles ? JSON.stringify(existingFiles) : null;
  const isEdit = !!existingStr && existingStr.length < 60000;

  const userContent = isEdit
    ? `CURRENT CODE:\n${existingStr}${envSection}\n\nEDIT REQUEST: ${prompt}\n\nReturn the complete updated JSON with all changes applied.`
    : `BUILD REQUEST: ${prompt}${envSection}\n\nReturn the complete JSON with all 3 files.`;

  let text = "";
  let stopped = false;

  const statusMap: [number, string][] = [
    [200,   "Reading your request…"],
    [800,   "Planning the layout…"],
    [2000,  "Writing components…"],
    [5000,  "Building interactions…"],
    [10000, "Styling the UI…"],
    [18000, "Almost done…"],
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
      ({ stopped } = await generateWithAnthropic(modelOpt.model, modelOpt.maxTokens, userContent, tokenCallback));
    } else if (modelOpt.provider === "openai") {
      ({ stopped } = await generateWithOpenAI(modelOpt.model, modelOpt.maxTokens, userContent, tokenCallback));
    } else {
      ({ stopped } = await generateWithGoogle(modelOpt.model, modelOpt.maxTokens, userContent, tokenCallback));
    }
  } catch (err) {
    // Provider failed — fall back to Claude Sonnet
    const fallback = { provider: "anthropic" as const, model: "claude-sonnet-4-6", displayName: "Claude Sonnet", maxTokens: 32000 };
    if (modelOpt.provider !== "anthropic") {
      onStatus?.(`${modelOpt.displayName} failed, retrying with ${fallback.displayName}…`);
      text = "";
      ({ stopped } = await generateWithAnthropic(fallback.model, fallback.maxTokens, userContent, tokenCallback));
      modelOpt.displayName = fallback.displayName;
    } else {
      throw err;
    }
  }

  if (stopped) {
    throw new Error(
      `Response was cut off (${modelOpt.displayName} hit its output limit). ` +
      "Try breaking your request into steps — build the basics first, then add features one at a time."
    );
  }

  const stripped = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```\s*$/m, "").trim();
  const jsonStr  = extractOutermostJson(stripped) ?? extractOutermostJson(text);

  if (!jsonStr) {
    throw new Error("Model did not return valid JSON. Try rephrasing your request.");
  }

  let parsed: { summary?: string; files?: ProjectFiles };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(
      "The response contained code that couldn't be serialized. " +
      "Try breaking the request into smaller steps — build the basic UI first, then add complex features."
    );
  }

  if (!parsed.files?.["src/App.tsx"]) {
    throw new Error("Model response was incomplete — missing App.tsx. Please try again.");
  }
  if (parsed.files["src/App.tsx"].length < 200) {
    throw new Error("Model returned a near-empty app. Please try again or rephrase your request.");
  }

  return {
    files: parsed.files,
    summary: parsed.summary ?? "Done! Check the preview.",
    modelUsed: modelOpt.displayName,
  };
}

export function defaultProjectFiles(): ProjectFiles {
  return {
    "index.html": `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>App</title><style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0f;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}</style></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
    "src/main.tsx": `import React from "react";import ReactDOM from "react-dom/client";import App from "./App";ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);`,
    "src/App.tsx": `export default function App(){return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0a0f"}}><div style={{textAlign:"center"}}><h1 style={{fontSize:32,fontWeight:700,color:"#fff",marginBottom:12}}>Start building</h1><p style={{color:"#71717a",fontSize:16}}>Describe what you want to build in the chat.</p></div></div>);}`,
  };
}
