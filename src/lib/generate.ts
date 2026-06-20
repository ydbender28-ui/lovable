import Anthropic from "@anthropic-ai/sdk";

export type ProjectFiles = Record<string, string>;

// ─── Design seeds ─────────────────────────────────────────────────────────────

const DESIGN_THEMES = [
  {
    name: "shopify-clean",
    bg: "#f6f6f7", card: "#ffffff", border: "#e4e4e7",
    accent: "#1a1a1a", accent2: "#404040", text: "#1a1a1a", muted: "#6b7280", radius: "8px",
    layout: "ecommerce",
    description: `Clean e-commerce — Shopify/ASOS inspired, light, professional retail.
LAYOUT: sticky top nav with logo + search + cart icon. Product grid 3-4 cols. Filter sidebar or horizontal filter pills.
TYPOGRAPHY: 14px base, system sans-serif. Product names 15px/600. Prices bold black. Labels uppercase 11px.
CARDS: white bg, 1px #e4e4e7 border, 4px radius, NO gradient buttons. Add to cart = solid black button, white text, no shadow. Hover: bg #333.
IMAGES: large product image area (aspect-ratio:1), object-fit:cover, light gray placeholder #f0f0f0.
PRICES: font-size:18px, fontWeight:700, color:#1a1a1a. Sale price red #dc2626, original struck through.
NO: gradients on buttons, emoji product icons, purple/pink colors, glow shadows, glassmorphism.`,
  },
  {
    name: "saas-light",
    bg: "#ffffff", card: "#ffffff", border: "#e5e7eb",
    accent: "#2563eb", accent2: "#1d4ed8", text: "#111827", muted: "#6b7280", radius: "8px",
    layout: "saas",
    description: `Professional SaaS — Linear/Notion/Stripe inspired. Light, minimal, business.
LAYOUT: left sidebar 220px (white, 1px right border #e5e7eb) + main area. Top bar with breadcrumb + user avatar. Content max-width 900px centered.
TYPOGRAPHY: -apple-system sans-serif. 14px base, 600 for section headings, 700 for page titles. Very tight spacing.
BUTTONS: Primary = solid #2563eb, white text, 6px radius, 10px 18px padding, NO gradient, NO shadow. Hover: #1d4ed8. Secondary = white bg + 1px border.
CARDS: white bg, 1px #e5e7eb border, 8px radius, 20px padding. Shadow: 0 1px 3px rgba(0,0,0,0.08).
TABLES: clean dividers, alternating #f9fafb rows, left-aligned text, no card wrapper.
NO: dark backgrounds, gradients, purple/violet colors, glow effects, emoji icons in nav.`,
  },
  {
    name: "dark-dashboard",
    bg: "#0f1117", card: "#1a1d27", border: "#2a2d3a",
    accent: "#3b82f6", accent2: "#2563eb", text: "#f1f5f9", muted: "#64748b", radius: "10px",
    layout: "dashboard",
    description: `Dark analytics dashboard — Vercel/Planetscale inspired. Dense, data-focused.
LAYOUT: fixed left sidebar 240px (#13151f, no border just shadow) + content area. Top stats row 3-4 KPI cards. Charts + tables below.
TYPOGRAPHY: 13px base, monospace for numbers (font-variant-numeric:tabular-nums). Muted labels 11px uppercase.
BUTTONS: solid #3b82f6, 7px radius, NO gradient. Icon buttons: 32px square, #1e2130 bg, hover #252836.
CARDS: #1a1d27 bg, 1px #2a2d3a border, subtle shadow. Stat cards: large number 28px/700, trend badge (green/red).
CHARTS: use div-based bar charts with percentage heights, blue bars, muted grid lines.
NO: purple gradients, glow shadows, glassmorphism, emoji in data tables.`,
  },
  {
    name: "agency-bold",
    bg: "#0a0a0a", card: "#111111", border: "#222222",
    accent: "#ffffff", accent2: "#e5e5e5", text: "#ffffff", muted: "#888888", radius: "0px",
    layout: "bold",
    description: `Bold agency/portfolio — Apple/Awwwards inspired. High contrast, editorial, striking.
LAYOUT: full-width sections, no sidebar. Hero = huge headline (72-96px, fontWeight:900) + subtext + single CTA. Sections alternate black/white.
TYPOGRAPHY: system-ui,-apple-system. 96px hero, 48px section titles, 16px body. ALL caps section labels with letterSpacing:6.
BUTTONS: white bg + black text (on dark sections) OR black bg + white text (on light). Sharp corners (borderRadius:0 or 4px). Padding:14px 32px. NO gradients.
CARDS: stark minimal. Just content, maybe a thin 1px border. No shadows. Let content breathe with big padding (48px+).
IMAGES: large, full-bleed where possible. Black and white tones. Strong contrast.
NO: gradients, purple/pink, card shadows, rounded corners, glow, emoji icons.`,
  },
  {
    name: "restaurant-warm",
    bg: "#faf8f5", card: "#ffffff", border: "#e8e0d5",
    accent: "#b45309", accent2: "#92400e", text: "#1c1109", muted: "#78716c", radius: "4px",
    layout: "editorial",
    description: `Warm restaurant/food — earthy, artisan, upscale hospitality feel.
LAYOUT: centered max-width 1100px. Top nav: logo center, links either side. Hero: full-width image area with overlay text. Menu grid 2-3 cols.
TYPOGRAPHY: serif headings (Georgia,serif, fontStyle:italic for dish names). Sans body. 15px base. Warm brown text #1c1109.
BUTTONS: background:#b45309, white text, borderRadius:2px, padding:12px 28px, letterSpacing:1, textTransform:'uppercase', NO gradient, NO shadow.
CARDS: white bg, 1px #e8e0d5 border, 4px radius. Food items: image top, name/description/price below. Clean, no decoration.
PRICES: amber color #b45309, fontWeight:600.
NO: dark mode cards, gradients, purple colors, emoji icons, glow effects.`,
  },
  {
    name: "fintech-professional",
    bg: "#f8fafc", card: "#ffffff", border: "#e2e8f0",
    accent: "#0f766e", accent2: "#0d9488", text: "#0f172a", muted: "#64748b", radius: "6px",
    layout: "fintech",
    description: `Professional fintech/banking — Stripe/Wise/Mercury inspired. Trustworthy, clean.
LAYOUT: top nav (white, 1px bottom border) + page content max-width 1100px. Dashboard: summary bar + 2-col layout (main + sidebar).
TYPOGRAPHY: Inter-like, 14px base. Numbers: font-variant-numeric:tabular-nums, monospace feel. Green for positive, red for negative amounts.
BUTTONS: teal #0f766e solid, white text, 6px radius, NO gradient. Hover: #0d9488. Destructive: #dc2626.
CARDS: white, 1px #e2e8f0 border, 8px radius, 24px padding. Transaction rows: hover #f8fafc bg, left icon + right amount.
AMOUNTS: large (24px+) with currency symbol smaller. Color-code: green income, red expense.
NO: dark themes, gradients, purple, shadows with glow, emoji in financial data.`,
  },
  {
    name: "startup-modern",
    bg: "#ffffff", card: "#f9fafb", border: "#f3f4f6",
    accent: "#7c3aed", accent2: "#6d28d9", text: "#111827", muted: "#9ca3af", radius: "12px",
    layout: "landing",
    description: `Modern startup landing page — Loom/Linear/Vercel marketing page style.
LAYOUT: centered, max-width 1100px. Full-screen hero with headline + subhead + 2 CTAs. Features grid 3-col. Testimonials. Pricing section.
TYPOGRAPHY: 64px hero headline (fontWeight:800, letterSpacing:-2px), 18px subhead, 15px body. Clean and modern.
BUTTONS: Primary = #7c3aed solid, white text, 10px radius, 14px 28px padding. Secondary = white + 1px border #e5e7eb. NO glow shadows.
CARDS: #f9fafb bg or white, very subtle border, 16px radius. Feature icons: colored square bg (not emoji), 40px.
HERO: gradient text for ONE key word only (background-clip:text). Everything else solid color.
NO: full-page gradients, multiple gradient buttons, purple everywhere, glassmorphism, floating blobs.`,
  },
  {
    name: "dark-minimal-pro",
    bg: "#111111", card: "#1a1a1a", border: "#2a2a2a",
    accent: "#22c55e", accent2: "#16a34a", text: "#f5f5f5", muted: "#737373", radius: "8px",
    layout: "minimal",
    description: `Dark minimal pro — GitHub/Raycast inspired. Focused, no-nonsense, developer tool feel.
LAYOUT: top nav (48px, #111, bottom border #2a2a2a) + content. Sidebar optional 200px. Content max-width 800px, lots of breathing room.
TYPOGRAPHY: 14px base, monospace for code/data, 600 for headings. Minimal color use — almost everything is white/gray.
BUTTONS: #1a1a1a bg + 1px #3a3a3a border, #f5f5f5 text. Primary action only: #22c55e bg, black text. Hover: brighten 10%. NO gradients.
CARDS: #1a1a1a bg, 1px #2a2a2a border, 8px radius. No shadows. Content-first.
LISTS: simple divider lines, no card wrapping. Hover: #222 row bg.
NO: gradient buttons, purple/pink, glow effects, heavy shadows, decorative elements.`,
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

BUILD EXACTLY WHAT IS REQUESTED — CRITICAL:
Read every word of the request and build THOSE specific features. Never substitute with a generic alternative.
- "salesforce app" → CRM with Accounts, Contacts, Leads, Opportunities, pipeline stages
- "salesforce with products and salesman" → CRM with product catalog + salesperson assignments + deal tracking
- "e-commerce store" → storefront with product grid, cart, checkout flow
- "inventory system" → stock levels, product SKUs, reorder alerts
- "booking app" → calendar, time slots, appointments
- "restaurant menu" → food categories, items with prices, ordering
If the user names specific entities (products, salesmen, customers, orders) → those MUST be the core data models with full CRUD.
NEVER replace a specific request with a generic "projects" or "tasks" dashboard.

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
- Transitions: transition:'all 0.2s' on EVERY interactive element

DESIGN RULES — LOOK LIKE A REAL PRODUCT, NOT AN AI DEMO:
The #1 goal: someone should look at this and think a professional designer built it, not AI.

BUTTONS: Match the design theme exactly. NO gradient buttons unless the theme specifies it. NO glow box-shadows. Solid color buttons look more professional. padding:'10px 20px', fontWeight:600, cursor:'pointer', border:'none'. Hover: darken bg by 10%, no scale transform.
INPUTS: background matches card bg. border:'1px solid [border color]'. borderRadius matches theme. padding:'10px 14px'. outline:'none'. Focus: border-color = accent. Always styled, never browser default.
CARDS: Follow the theme. Light themes = white bg + subtle border. Dark themes = slightly lighter than page bg + border. NO heavy glow shadows. Shadow max: '0 1px 4px rgba(0,0,0,0.1)' for light, '0 2px 8px rgba(0,0,0,0.3)' for dark.
ICONS: Use text/Unicode symbols (→ ✓ × ↑ ↓ ‹ ›) or simple SVG. NO emoji as product/feature icons (🛒🚀⚡) — they look cheap. Exception: status indicators (✓ for success is fine).
IMAGES/PRODUCTS: Use colored div placeholders with the product initials or category, NOT emoji. e.g. a gray #e5e7eb div with centered 2-letter abbreviation in muted color.
TYPOGRAPHY: Clear hierarchy but natural — not every label needs to be UPPERCASE with letterSpacing. Reserve uppercase for nav items and table headers only.
EMPTY STATES: Simple text message + one action button. No emoji circus.
SPACING: Generous whitespace. Padding 16-24px on cards. 32-48px between sections. Don't cram everything together.
REAL DATA: Product names, prices, descriptions must sound real (not "Product 1", "Item A"). Use industry-appropriate realistic names.

ABSOLUTELY NEVER:
- Gradient buttons with glow shadows (screams AI-generated)
- Emoji as product images or feature icons (🛒📦⚡🚀)
- Purple/pink color scheme unless theme specifically calls for it
- Multiple different accent colors fighting each other
- Lorem ipsum or placeholder text — use real realistic content
- Every element having a rainbow of colors — pick 1-2 colors and stick to them
- Glassmorphism blur cards on solid backgrounds (looks dated/AI)
- Animated floating blobs or gradient orbs in backgrounds

INTEGRATIONS — EXACT PATTERNS TO USE:

When env vars are provided (window.ENV object injected at top of App.tsx), use these exact patterns:

Stripe payments (STRIPE_PUBLISHABLE_KEY available):
  // In index.html <head>: <script src="https://js.stripe.com/v3/"></script>
  // In App.tsx:
  const stripe = (window as any).Stripe(window.ENV.STRIPE_PUBLISHABLE_KEY);
  const elements = stripe.elements();
  const card = elements.create('card', { style: { base: { color: '#fff', fontSize: '16px' } } });
  card.mount('#card-element');
  // On submit: const {paymentMethod, error} = await stripe.createPaymentMethod({type:'card',card});
  // NEVER use server-side Stripe SDK — only Stripe.js frontend methods with publishable key

Supabase (SUPABASE_URL + SUPABASE_ANON_KEY available):
  // In index.html <head>: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  // In App.tsx:
  const supabase = (window as any).supabase.createClient(window.ENV.SUPABASE_URL, window.ENV.SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from('table_name').select('*');
  // For auth: await supabase.auth.signInWithPassword({email, password})
  // NEVER import from npm — always use the CDN UMD build via window.supabase

Firebase (FIREBASE_API_KEY + FIREBASE_PROJECT_ID available):
  // In index.html <head>: add firebase-app-compat and firebase-firestore-compat scripts from gstatic.com
  // In App.tsx:
  const app = (window as any).firebase.initializeApp({ apiKey: window.ENV.FIREBASE_API_KEY, projectId: window.ENV.FIREBASE_PROJECT_ID, authDomain: window.ENV.FIREBASE_PROJECT_ID+'.firebaseapp.com' });
  const db = (window as any).firebase.firestore();
  const snap = await db.collection('items').get();

OpenAI (OPENAI_API_KEY available):
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+window.ENV.OPENAI_API_KEY},
    body: JSON.stringify({model:'gpt-4o-mini', messages:[{role:'user',content:prompt}]})
  });

Image uploads (built-in, no API key needed):
  // POST to /api/upload — works for all users, stores to CDN, returns a permanent URL
  async function uploadImage(file: File): Promise<string> {
    const form = new FormData(); form.append('file', file);
    const res = await fetch('/api/upload', {method:'POST', body:form});
    const {url} = await res.json();
    return url; // permanent CDN URL or base64 fallback
  }

Google Maps (GOOGLE_MAPS_API_KEY available):
  // In index.html <head>: <script src="https://maps.googleapis.com/maps/api/js?key=REPLACE_KEY&callback=__initMap" async defer></script>
  // CRITICAL: window.google.maps is NOT available synchronously — always defer initialization.
  // In index.html before </body>: <script>window.__initMap = function(){/* maps ready */};</script>
  // In App.tsx, use a useEffect with polling to wait for the API:
  useEffect(()=>{
    const interval = setInterval(()=>{
      if((window as any).google?.maps){
        clearInterval(interval);
        const map = new (window as any).google.maps.Map(document.getElementById('map'),{center:{lat:40.7,lng:-74},zoom:12});
        // add markers etc here
      }
    },100);
    return ()=>clearInterval(interval);
  },[]);

ENV INJECTION RULE: When envVars are provided, inject them at the top of App.tsx:
  const ENV = window.ENV || {};  // always declare this — window.ENV is set by index.html
In index.html, before </body>: <script>window.ENV = {KEY1:"val1",KEY2:"val2"};</script>
NEVER hardcode secret keys in App.tsx source. Always read from window.ENV.

HANDLING COMPLEX FEATURES:

Image uploads (ALWAYS use /api/upload — built-in, no API keys needed):
  const [imgUrl, setImgUrl] = useState('');
  async function handleImageUpload(file: File) {
    const form = new FormData(); form.append('file', file);
    const res = await fetch('/api/upload', {method:'POST', body:form});
    const {url} = await res.json();
    setImgUrl(url);
  }
  <input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(f)handleImageUpload(f)}}/>
  {imgUrl && <img src={imgUrl} style={{maxWidth:'100%'}}/>}
  // Store imgUrl in localStorage or state as needed. URL is permanent and publicly accessible.

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
- MOBILE RESPONSIVE — mandatory. Use flexWrap:'wrap', minWidth, and media-query-like breakpoints via window.innerWidth or just fluid % widths. Sidebar must collapse on small screens. Cards must stack vertically on mobile. Nothing should overflow or get cut off at 390px wide.
- Working forms with validation and feedback
- NO placeholders, NO TODOs, NO stub functions — implement everything completely

ADMIN / PASSWORD PANELS:
- If asked to build an admin panel with a password, show a login form. If the user specified a password use that, otherwise use "admin" as the default. NEVER show a password hint, default password text, or any visible hint on screen — the user knows their own password. The login form should just have a password field and submit button, nothing else.
- Admin panels should have a logout button that returns to the public view.
- CRITICAL — DATA SYNC: Every admin panel that lets users add/edit/delete data (products, posts, users, etc.) MUST include a "💾 Save to Site" button. When clicked it calls:
    window.parent?.postMessage({ type: 'TC_SAVE_STATE', state: JSON.stringify({ products: products, /* all editable state */ }) }, '*');
  This syncs admin changes to the live published site. Show a "✓ Saved to site!" confirmation after clicking. Place this button prominently in the admin header.
- On load, initialize state from window.TC_INITIAL_DATA if it exists, otherwise use the hardcoded defaults:
    const [products, setProducts] = useState(() => (window as any).TC_INITIAL_DATA?.products ?? DEFAULT_PRODUCTS);

DO NOT LOOK LIKE AN AI TOOL — CRITICAL:
The app must look like it was built by a professional design team, NOT like an AI demo. Avoid ALL of these patterns:
- NO purple/indigo gradient hero banners with "AI-powered" or "next-generation" copy
- NO generic "dashboard" with empty chart placeholders and "Coming soon" sections
- NO robot or sparkle emojis (🤖✨🚀💡) in the UI unless the app is literally about robots
- NO "Welcome to [AppName]" hero with a subtitle that says "Manage everything in one place"
- NO generic icon-grid feature sections with 3 columns of icons + text
- NO blue "Get Started" CTA buttons on a purple gradient hero
- NO chat bubble or assistant UI unless explicitly asked for
- NO "powered by AI" badges or mentions

INSTEAD, build the SPECIFIC app requested with purpose-built UI:
- A restaurant menu should look like a real restaurant site (food photography placeholders, warm colors, menu categories)
- A CRM should look like Salesforce/HubSpot (dense data tables, pipeline board, contact cards)
- An inventory system should look like a warehouse tool (stock levels, SKUs, alert badges)
- Match the visual language of real professional software in that industry

DESIGN SYSTEM (injected per request — follow exactly):
{{DESIGN_INJECTION}}`;

// ─── Model routing ────────────────────────────────────────────────────────────

export type Complexity = "simple" | "medium" | "complex";

export interface ModelOption {
  provider: "anthropic" | "openai" | "google";
  model: string;
  displayName: string;
  maxTokens: number;
  costPer1kInput: number;   // USD
  costPer1kOutput: number;  // USD
}

// All known models with pricing
export const MODELS: Record<string, ModelOption> = {
  "claude-haiku-4-5-20251001": {
    provider: "anthropic", model: "claude-haiku-4-5-20251001",
    displayName: "Claude Haiku", maxTokens: 32000,
    costPer1kInput: 0.0008, costPer1kOutput: 0.004,
  },
  "claude-sonnet-4-6": {
    provider: "anthropic", model: "claude-sonnet-4-6",
    displayName: "Claude Sonnet", maxTokens: 32000,
    costPer1kInput: 0.003, costPer1kOutput: 0.015,
  },
  "gpt-4o-mini": {
    provider: "openai", model: "gpt-4o-mini",
    displayName: "GPT-4o mini", maxTokens: 16384,
    costPer1kInput: 0.00015, costPer1kOutput: 0.0006,
  },
  "gpt-4o": {
    provider: "openai", model: "gpt-4o",
    displayName: "GPT-4o", maxTokens: 16384,
    costPer1kInput: 0.005, costPer1kOutput: 0.015,
  },
  "gemini-2.5-flash": {
    provider: "google", model: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash", maxTokens: 32000,
    costPer1kInput: 0.00015, costPer1kOutput: 0.00060,
  },
};

// What each complexity level scores
export type ComplexityScore = {
  complexity: Complexity;
  score: number;
  reasons: string[];
};

export function scoreComplexity(prompt: string, existingFiles: ProjectFiles | null): ComplexityScore {
  const t = prompt.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  // Editing existing app — only a small signal (the prompt keywords matter more than codebase size)
  const existingSize = existingFiles ? JSON.stringify(existingFiles).length : 0;
  if (existingSize > 0) { score += 1; reasons.push("editing existing app"); }

  // Prompt length signal
  if (prompt.length > 300) { score += 2; reasons.push("long detailed prompt"); }
  else if (prompt.length > 150) { score += 1; reasons.push("medium prompt length"); }

  // Complex feature keywords
  const complexKeywords: [string, number][] = [
    ["dashboard", 2], ["admin", 2], ["authentication", 3], ["login", 2], ["signup", 2],
    ["payment", 3], ["stripe", 3], ["checkout", 2], ["subscription", 2],
    ["chart", 2], ["graph", 2], ["analytics", 2], ["real-time", 3], ["websocket", 3],
    ["drag", 2], ["drop", 2], ["kanban", 2], ["calendar", 2],
    ["upload", 2], ["image", 1], ["file", 1], ["video", 2], ["audio", 2],
    ["crud", 2], ["database", 2], ["api", 1], ["multi-step", 2], ["wizard", 2],
    ["animation", 1], ["3d", 3], ["canvas", 2], ["map", 2],
    ["notification", 1], ["email", 1], ["workflow", 2],
  ];
  for (const [kw, pts] of complexKeywords) {
    if (t.includes(kw)) { score += pts; reasons.push(kw); }
  }

  // Medium feature keywords (if no complex ones already detected)
  const mediumKeywords = ["search", "filter", "sort", "table", "form", "modal", "carousel", "pagination", "todo", "report"];
  for (const kw of mediumKeywords) {
    if (t.includes(kw)) { score += 1; reasons.push(kw); }
  }

  let complexity: Complexity;
  if (score >= 6) complexity = "complex";
  else if (score >= 2) complexity = "medium";
  else complexity = "simple";

  return { complexity, score, reasons };
}

// Priority order per complexity — cheapest capable model first
const ROUTING: Record<Complexity, string[]> = {
  simple:  ["claude-haiku-4-5-20251001", "gpt-4o-mini",    "gemini-2.5-flash"],
  medium:  ["claude-haiku-4-5-20251001", "gpt-4o-mini",    "gemini-2.5-flash"],
  complex: ["claude-sonnet-4-6",         "claude-haiku-4-5-20251001", "gpt-4o-mini"],
};

function hasKey(provider: ModelOption["provider"]) {
  if (provider === "anthropic") return !!process.env.ANTHROPIC_API_KEY;
  if (provider === "openai")    return !!process.env.OPENAI_API_KEY;
  if (provider === "google")    return !!process.env.GOOGLE_AI_API_KEY;
  return false;
}

function pickModel(complexity: Complexity): ModelOption {
  for (const modelId of ROUTING[complexity]) {
    const opt = MODELS[modelId];
    if (!opt) continue;
    if (!hasKey(opt.provider)) continue;
    return opt;
  }
  // Hard fallback — Claude Sonnet always works if Anthropic key is set
  return MODELS["claude-sonnet-4-6"];
}

export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const m = MODELS[modelId];
  if (!m) return 0;
  return (inputTokens / 1000) * m.costPer1kInput + (outputTokens / 1000) * m.costPer1kOutput;
}

// ─── Provider adapters ────────────────────────────────────────────────────────

async function generateWithAnthropic(
  model: string,
  maxTokens: number,
  userContent: string,
  systemPrompt: string,
  onToken: (t: string) => void,
  imageBase64?: string | null,
  imageMimeType?: string
): Promise<{ text: string; stopped: boolean; inputTokens: number; outputTokens: number }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  type ContentBlock = Anthropic.ImageBlockParam | Anthropic.TextBlockParam;
  const msgContent: string | ContentBlock[] = imageBase64
    ? [
        { type: "image", source: { type: "base64", media_type: (imageMimeType ?? "image/png") as "image/png" | "image/jpeg" | "image/gif" | "image/webp", data: imageBase64 } },
        { type: "text", text: userContent },
      ]
    : userContent;

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: msgContent }],
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
  complexity: Complexity;
  complexityReasons: string[];
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export async function generateProject(
  prompt: string,
  existingFiles: ProjectFiles | null,
  envVars: Record<string, string> | null,
  onToken?: (text: string) => void,
  onStatus?: (text: string) => void,
  imageBase64?: string | null,
  imageMimeType?: string,
  forceModel?: string
): Promise<GenerateResult> {
  const { complexity, reasons: complexityReasons } = scoreComplexity(prompt, existingFiles);
  let modelOpt = forceModel && MODELS[forceModel] ? MODELS[forceModel] : pickModel(complexity);
  const isEdit = !!(existingFiles && Object.keys(existingFiles).length > 0);

  // Only inject a design system for new builds — edits must preserve existing design
  const designInjection = isEdit
    ? `EDITING AN EXISTING APP — DO NOT apply any new design system. Read the existing code and match its exact colors, fonts, spacing, and visual style. Your only job is to add/change what was requested.`
    : (() => {
        const design = pickDesign(prompt);
        return `${design.description}
COLORS (use exactly):
- body background: ${design.bg}
- card/surface: ${design.card}
- border: ${design.border}
- primary accent: ${design.accent}
- secondary accent: ${design.accent2}
- text: ${design.text}
- muted text: ${design.muted}
- border-radius: ${design.radius}
Make the entire layout and structure match this design system. It should look DRAMATICALLY different from a generic dark-mode app.`;
      })();

  const SYSTEM_PROMPT = BASE_SYSTEM_PROMPT.replace("{{DESIGN_INJECTION}}", designInjection);

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
  const userContent = isEdit
    ? `CURRENT CODE:\n${existingSection}${envSection}\n\nEDIT REQUEST: ${prompt}\n\nCRITICAL EDIT RULES:
- Make ONLY the minimal changes needed to address the edit request — add the feature, fix the bug, nothing more
- PRESERVE 100% of the existing visual design: colors, fonts, spacing, layout, theme, background — DO NOT change any of these
- PRESERVE all existing components, features, interactions, and data that are not part of the edit request
- If it's a modern e-commerce site and you're asked to add admin: keep the EXACT same store UI, just add the admin section
- If it's a dark terminal theme and asked to add search: add search, keep the terminal theme
- NEVER change, restyle, or redesign any part of the app that was not explicitly mentioned in the edit request
- NEVER change the application from one type to another (e.g., modern store → terminal hacker is forbidden)
- NEVER change color scheme, typography, or visual style unless explicitly asked
- ADMIN PANELS: when adding admin, add a password-protected route/view that reuses the existing design language — same colors, same card style, same button style
- DATA PERSISTENCE WITH ADMIN: When adding admin CRUD for products/items, generate a "💾 Save to Site" button in the admin panel. That button must call: window.parent?.postMessage({type:'TC_SAVE_STATE',state:JSON.stringify({products: allProducts, /* other state */})}, '*'). This syncs admin edits back to the source code so the published site stays up to date.
- You MUST return the complete updated files in the delimiter format — NEVER respond with plain text or explanations only.`
    : `BUILD REQUEST: ${prompt}${envSection}\n\nYou MUST return all 3 files in the delimiter format — NEVER respond with plain text or explanations only.`;

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
      ({ stopped, inputTokens, outputTokens } = await generateWithAnthropic(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback, imageBase64, imageMimeType));
    } else if (modelOpt.provider === "openai") {
      ({ stopped, inputTokens, outputTokens } = await generateWithOpenAI(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback));
    } else {
      ({ stopped, inputTokens, outputTokens } = await generateWithGoogle(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback));
    }
  } catch {
    // Provider failed — silently fall back to Claude Sonnet
    const fallback = MODELS["claude-sonnet-4-6"];
    if (modelOpt.provider !== "anthropic") {
      text = "";
      lastStatusIdx = -1;
      ({ stopped, inputTokens, outputTokens } = await generateWithAnthropic(
        fallback.model, fallback.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback, imageBase64, imageMimeType
      ));
      modelOpt = { ...fallback };
    } else {
      throw new Error("Generation failed. Please try again.");
    }
  }

  // If output was cut off and we're not already on Sonnet, retry with Sonnet
  if (stopped && modelOpt.model !== "claude-sonnet-4-6") {
    const sonnet = MODELS["claude-sonnet-4-6"];
    text = "";
    lastStatusIdx = -1;
    ({ stopped, inputTokens, outputTokens } = await generateWithAnthropic(
      sonnet.model, sonnet.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback, imageBase64, imageMimeType
    ));
    modelOpt = { ...sonnet };
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
    complexity,
    complexityReasons,
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateCost(modelOpt.model, inputTokens, outputTokens),
  };
}

export function defaultProjectFiles(): ProjectFiles {
  return {
    "index.html": `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>App</title><style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0f;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}</style></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
    "src/main.tsx": `import React from "react";import ReactDOM from "react-dom/client";import App from "./App";ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);`,
    "src/App.tsx": `export default function App(){return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0a0f"}}><div style={{textAlign:"center"}}><h1 style={{fontSize:32,fontWeight:700,color:"#fff",marginBottom:12}}>Start building</h1><p style={{color:"#71717a",fontSize:16}}>Describe what you want to build in the chat.</p></div></div>);}`,
  };
}
