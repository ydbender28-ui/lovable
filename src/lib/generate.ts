import Anthropic from "@anthropic-ai/sdk";
import { UI_COMPONENT_LIST } from "./ui-components";
import { SECTION_COMPONENT_LIST } from "./section-components";
import { EXTRA_COMPONENT_LIST } from "./extra-components";
import { matchDesign, buildDesignContext } from "./designs";

export type ProjectFiles = Record<string, string>;

// ─── Conversation state (tracks edits across requests to prevent regressions) ─

interface ConversationEdit {
  timestamp: number;
  userRequest: string;
  editType: string;
  filesChanged: string[];
}

interface ConversationState {
  messages: { role: "user" | "assistant"; content: string; filesChanged?: string[] }[];
  edits: ConversationEdit[];
  recentlyCreatedFiles: string[];
}

// Global state — persists across requests within the same server process
const conversationState: ConversationState = {
  messages: [],
  edits: [],
  recentlyCreatedFiles: [],
};

function trimConversationState() {
  if (conversationState.messages.length > 15) {
    conversationState.messages = conversationState.messages.slice(-15);
  }
  if (conversationState.edits.length > 8) {
    conversationState.edits = conversationState.edits.slice(-8);
  }
  if (conversationState.recentlyCreatedFiles.length > 20) {
    conversationState.recentlyCreatedFiles = conversationState.recentlyCreatedFiles.slice(-20);
  }
}

function buildConversationContext(): string {
  if (conversationState.messages.length < 2 && conversationState.edits.length === 0) return "";

  const parts: string[] = ["\n\n## Conversation History"];

  // Warn about recently created files to prevent duplicates
  if (conversationState.recentlyCreatedFiles.length > 0) {
    const unique = [...new Set(conversationState.recentlyCreatedFiles)];
    parts.push("\n### RECENTLY CREATED/EDITED FILES (DO NOT RECREATE — UPDATE THEM INSTEAD):");
    for (const f of unique) parts.push(`- ${f}`);
  }

  // Last few user messages for context continuity
  const recentUserMsgs = conversationState.messages
    .filter(m => m.role === "user")
    .slice(-3);
  if (recentUserMsgs.length > 0) {
    parts.push("\n### Recent requests:");
    for (const m of recentUserMsgs) {
      const truncated = m.content.length > 120 ? m.content.slice(0, 120) + "…" : m.content;
      parts.push(`- "${truncated}"`);
    }
  }

  // Recent edits so the AI knows what was changed
  const recentEdits = conversationState.edits.slice(-3);
  if (recentEdits.length > 0) {
    parts.push("\n### Recent edits applied:");
    for (const e of recentEdits) {
      parts.push(`- [${e.editType}] ${e.userRequest.slice(0, 80)} → changed: ${e.filesChanged.join(", ")}`);
    }
  }

  const ctx = parts.join("\n");
  return ctx.length > 2000 ? ctx.slice(0, 2000) + "\n[context truncated]" : ctx;
}

export function resetConversationState() {
  conversationState.messages = [];
  conversationState.edits = [];
  conversationState.recentlyCreatedFiles = [];
}

// ─── Design seeds ─────────────────────────────────────────────────────────────

const DESIGN_THEMES = [
  { name: "shopify-clean", bg: "#f6f6f7", card: "#ffffff", border: "#e4e4e7", accent: "#1a1a1a", accent2: "#404040", text: "#1a1a1a", muted: "#6b7280", radius: "8px", layout: "ecommerce", description: "Clean e-commerce — light, professional, Shopify-inspired" },
  { name: "saas-light", bg: "#ffffff", card: "#ffffff", border: "#e5e7eb", accent: "#2563eb", accent2: "#1d4ed8", text: "#111827", muted: "#6b7280", radius: "8px", layout: "saas", description: "Professional SaaS — Linear/Stripe inspired, minimal" },
  { name: "dark-dashboard", bg: "#0f1117", card: "#1a1d27", border: "#2a2d3a", accent: "#3b82f6", accent2: "#2563eb", text: "#f1f5f9", muted: "#64748b", radius: "10px", layout: "dashboard", description: "Dark analytics dashboard — Vercel-inspired, data-focused" },
  { name: "agency-bold", bg: "#0a0a0a", card: "#111111", border: "#222222", accent: "#ffffff", accent2: "#e5e5e5", text: "#ffffff", muted: "#888888", radius: "0px", layout: "bold", description: "Bold agency — Apple/Awwwards-inspired, high contrast editorial" },
  { name: "restaurant-warm", bg: "#faf8f5", card: "#ffffff", border: "#e8e0d5", accent: "#b45309", accent2: "#92400e", text: "#1c1109", muted: "#78716c", radius: "4px", layout: "editorial", description: "Warm restaurant — earthy, artisan, upscale hospitality" },
  { name: "fintech-professional", bg: "#f8fafc", card: "#ffffff", border: "#e2e8f0", accent: "#0f766e", accent2: "#0d9488", text: "#0f172a", muted: "#64748b", radius: "6px", layout: "fintech", description: "Fintech — Stripe/Wise-inspired, trustworthy and clean" },
  { name: "startup-modern", bg: "#ffffff", card: "#f9fafb", border: "#f3f4f6", accent: "#7c3aed", accent2: "#6d28d9", text: "#111827", muted: "#9ca3af", radius: "12px", layout: "landing", description: "Modern startup landing page — Loom/Linear marketing style" },
  { name: "dark-minimal-pro", bg: "#111111", card: "#1a1a1a", border: "#2a2a2a", accent: "#22c55e", accent2: "#16a34a", text: "#f5f5f5", muted: "#737373", radius: "8px", layout: "minimal", description: "Dark minimal — GitHub/Raycast-inspired developer tool" },
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

// ─── System prompts (ported from codezip builder) ────────────────────────────

const SYSTEM_BUILD = `You are an expert React developer. Build exactly what the user asks — a complete, fully functional, production-quality web app.

## Technical rules:
- Styling: use Tailwind CSS classes via className="..." (preferred) OR inline style={{}}. Both work.
- Tailwind CDN is pre-loaded — all Tailwind classes work out of the box.
- Use {{unsplash:query|WxH}} for ALL images. They auto-resolve to real photos. Example: {{unsplash:coffee shop interior|1600x900}}
- Hardcode all data directly in components. No fetch(), no Supabase, no API calls (EXCEPTION: Stripe checkout uses fetch — see below).
- Return /App.tsx (all code) and /index.css (Google Fonts + CSS vars only).
- App component MUST be the default export: "export default function App()"
- Put ALL components in /App.tsx. Define helper components ABOVE the App function in the SAME file.
- ONLY import from: react, lucide-react, react-hot-toast. NOTHING ELSE.
- DO NOT import from /components/sections/ — write all sections inline in App.tsx instead.
- DO NOT import from any local file. Everything goes in ONE file: /App.tsx.
- If you need a Navbar, Hero, Footer — write them as functions in /App.tsx, not imports.

## STYLING — DESIGN SYSTEM + TAILWIND:

Define ALL colors as CSS variables in /index.css using HSL values, then reference them via Tailwind:

In /index.css you MUST use RAW HSL VALUES (no hsl() wrapper, no hex):
:root {
  --background: 40 20% 98%;
  --foreground: 30 10% 10%;
  --card: 0 0% 100%;
  --primary: 25 90% 48%;
  --primary-foreground: 0 0% 100%;
  --secondary: 40 15% 94%;
  --muted: 30 5% 55%;
  --border: 30 15% 88%;
  --accent: 25 85% 40%;
  --radius: 0.75rem;
}
CRITICAL: Values MUST be "H S% L%" format like "25 90% 48%". NOT hex (#6b3a2a). NOT hsl(25, 90%, 48%). Just the raw numbers.

In JSX, use these semantic color classes — NEVER use direct colors like bg-white, text-gray-900:
CORRECT: className="bg-background text-foreground"
CORRECT: className="bg-primary text-primary-foreground"
CORRECT: className="bg-card border-border"
CORRECT: className="text-muted"
WRONG:   className="bg-white text-gray-900" ← NEVER do this
WRONG:   className="bg-[hsl(var(--background))]" ← too verbose, use bg-background

Available color classes: bg-background, bg-foreground, bg-card, bg-primary, bg-secondary, bg-muted, bg-accent, text-foreground, text-muted, text-primary, text-primary-foreground, border-border
Layout classes use regular Tailwind: rounded-xl, p-6, shadow-sm, flex, grid, hover:, etc.

Changing the theme = changing /index.css HSL values. Every element updates instantly.

Other rules:
- App component MUST be "export default function App()"
- Only import from: react, lucide-react, react-hot-toast, or /components/sections/
- Every { must have matching }. Every ( must have matching ).

## STYLING — USE INLINE STYLES for colors + Tailwind for layout:

For ALL colors, use inline style with hsl(var(--name)):
style={{background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))'}}
style={{background: 'hsl(var(--background))', color: 'hsl(var(--foreground))'}}
style={{background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))'}}
style={{color: 'hsl(var(--muted))'}}

For layout, spacing, sizing — use Tailwind className:
"fixed top-0 w-full z-50 backdrop-blur-lg"
"min-h-screen flex items-center pt-16 grid lg:grid-cols-2 gap-12"
"text-5xl md:text-6xl font-extrabold tracking-tight"
"px-8 py-3.5 rounded-full font-semibold text-sm hover:opacity-90 transition-all"
"rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
"py-20 md:py-28 max-w-7xl mx-auto px-6"

COMBINE both on every element:
<nav className="fixed top-0 w-full z-50 backdrop-blur-lg" style={{background: 'hsla(var(--card), 0.8)', borderBottom: '1px solid hsl(var(--border))'}}>
<button className="px-8 py-3.5 rounded-full font-semibold" style={{background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))'}}>
<section className="py-20" style={{background: 'hsl(var(--secondary))'}}>

IMAGES: Card: className="w-full h-48 object-cover". Hero: className="w-full h-[500px] object-cover". EVERY img needs a height class.
- Images: use {{unsplash:VERY SPECIFIC descriptive query|WxH}} for EVERY image. Be ultra-specific:
  Hero: {{unsplash:artisan coffee shop interior warm moody lighting|1600x900}}
  Card: {{unsplash:espresso shot crema close up|400x300}}
  Portrait: {{unsplash:smiling woman professional headshot|200x200}}
  NEVER use bare {{unsplash:query}} without |WxH — it will break.
- Menu/product cards MUST have images: each card gets an <img> with {{unsplash:specific item close up|400x300}}. Example: a coffee menu card should have {{unsplash:espresso shot crema close up|400x300}} above the item name and price. NEVER make menu cards text-only.
- Data: 8-12+ items for lists/menus. Real-sounding names, prices, descriptions.
- Interactions: hover effects on all clickable elements. Smooth transitions (0.2-0.3s).
- Cart (if needed): cart icon with count in the NAVBAR, slide-out drawer from right, +/- quantity, total, checkout button.

## EVERY BUTTON MUST WORK — NO DEAD BUTTONS:
- Mobile hamburger menu: use useState to toggle open/close. Clicking it MUST show/hide the menu.
- "Add to Cart" buttons: use useState for cart array. Clicking MUST add the item and update the cart count.
- Nav links: use smooth scroll with document.getElementById(id)?.scrollIntoView({behavior:'smooth'}).
- Form submit buttons: use onSubmit with e.preventDefault(), show success message with useState.
- Modal/drawer open/close: use useState boolean. Clicking MUST toggle visibility.
- Tab buttons: use useState for activeTab. Clicking MUST switch displayed content.
- Accordion/FAQ: use useState for openIndex. Clicking MUST expand/collapse.
- Quantity +/- buttons: MUST update the count with useState.
- NEVER create a button without an onClick handler. NEVER leave onClick as an empty function.
- Test every interaction mentally before outputting — if a user clicks it, something MUST happen.
- NEVER use apostrophes inside single-quoted strings. Use double quotes for strings with apostrophes: "We'll be in touch" not 'We'll be in touch'. Or use backticks: \`We'll be in touch\`.

## CONTENT — write like a creative director, not an AI:
- Business name: UNIQUE, CREATIVE, 2-3 words. "Kindred Coffee", "The Iron Yard", "Sage & Stone". NEVER "[Type] Haven/House/Studio".
- Tagline: SHORT, PUNCHY, HUMAN. Max 6 words. "Coffee worth waking up for." NOT "Experience Excellence" or "Your Journey Starts Here."
- Descriptions: conversational, specific. "We roast every batch in-house, every Tuesday." NOT "Premium quality products."
- Menu items: creative names. "The Midnight Roast — dark, smoky, unapologetic" NOT "Dark Roast — A delicious dark roast coffee."
- Testimonials: specific, believable. "I've been coming here every morning since 2019. The cortado is unreal." NOT "Great service!"
- NEVER start with "Welcome to" or "Discover" or "Experience" or "Elevate".

## DO NOT use pre-built components. Write ALL sections inline in /App.tsx.
## This ensures everything works and nothing breaks from missing imports.

## Stripe checkout (when user asks for payments):
Add a checkout button that calls ThatCode's Stripe proxy:
  const checkout = async (cartItems) => {
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'PROJECT_ID', items: cartItems.map(i => ({ name: i.name, price: i.price, quantity: i.quantity || 1 })) })
    });
    const { url, error } = await res.json();
    if (url) window.location.href = url;
    else alert(error || 'Checkout failed');
  };
The STRIPE_SECRET_KEY is stored securely on the server — never in client code.

## Output format (use EXACTLY this — no JSON):
SUMMARY: one sentence describing what you built

SUGGESTIONS: Add dark mode | Improve mobile layout | Add contact form | Add animations
(4-5 short suggestions for what to build next, separated by |)

/App.tsx
\`\`\`tsx
your code here
\`\`\`

/index.css
\`\`\`css
your css here
\`\`\`

## COMPLETE EXAMPLE (use semantic design tokens — NEVER direct colors):

SUMMARY: A warm bakery landing page with hero, menu grid, and contact section.

SUGGESTIONS: Add online ordering | Add customer reviews | Add dark mode | Add gallery | Add newsletter

/App.tsx
\`\`\`tsx
import React, { useState } from 'react';
import { MapPin, Clock } from 'lucide-react';

const MENU = [
  { id: 1, name: "Sourdough Loaf", price: 8.50, desc: "72-hour fermented, crispy crust", cat: "Bread" },
  { id: 2, name: "Almond Croissant", price: 5.25, desc: "Twice-baked with frangipane", cat: "Pastry" },
  { id: 3, name: "Espresso", price: 3.50, desc: "Bold, rich single shot", cat: "Coffee" },
];

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          <span className="text-xl font-extrabold tracking-tight">Rise & Crust</span>
          <div className="flex gap-8 items-center">
            <a href="#menu" className="text-sm text-muted hover:text-foreground transition-colors">Menu</a>
            <a href="#contact" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">Visit Us</a>
          </div>
        </div>
      </nav>
      <section className="relative min-h-[85vh] flex items-center">
        <img src="{{unsplash:artisan bakery warm morning light|1600x900}}" alt="Bakery" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-10 py-20 text-white">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight max-w-2xl">Baked fresh. Every morning.</h1>
          <p className="text-lg mt-6 max-w-lg opacity-85">Small-batch sourdough and single-origin coffee.</p>
        </div>
      </section>
      <section id="menu" className="py-24 px-10 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold tracking-tight mb-10">Our Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MENU.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-sm text-muted mt-1">{item.desc}</p>
              <p className="text-lg font-bold mt-3">\${item.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-border py-12 px-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="font-bold">Rise & Crust</span>
          <span className="text-sm text-muted">&copy; 2026 All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
\`\`\`

/index.css
\`\`\`css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
:root {
  --background: 40 20% 98%;
  --foreground: 30 10% 10%;
  --card: 0 0% 100%;
  --primary: 25 90% 48%;
  --primary-foreground: 0 0% 100%;
  --secondary: 40 15% 94%;
  --muted: 30 5% 55%;
  --border: 30 15% 88%;
  --accent: 25 85% 40%;
}
body { font-family: 'DM Sans', sans-serif; margin: 0; background: hsl(var(--background)); color: hsl(var(--foreground)); }
* { box-sizing: border-box; }
\`\`\`

^^^ ALL colors use CSS variables. To change theme = change :root values. NEVER use bg-white, text-gray-900, etc.

{{DESIGN_INJECTION}}

{{INTEGRATIONS_INJECTION}}`;

// Edge functions instructions — only injected when Supabase is enabled
const EDGE_FUNCTIONS_HINT = `For server-side logic, generate /functions/<name>.js (Supabase Edge Functions, Deno runtime).`;

// Separate edit prompt — search/replace format for surgical edits
const SYSTEM_EDIT = `You are editing an existing React + TypeScript app. Tailwind CSS is available.

## RULES:
- Do STRICTLY what the user asks — NOTHING MORE, NOTHING LESS.
- Match the existing code style (Tailwind or inline styles).
- NEVER change unrelated code, images, or layout.
- Build COMPLETE features — no stubs, no TODOs.
- The code MUST be fully functional.
- ONLY import from: react, lucide-react, react-hot-toast. Nothing else. Write all components inline.
- EVERY button MUST have a working onClick handler. No dead buttons.
- When adding interactive features (cart, modal, tabs, accordion, form), include ALL useState hooks, handlers, and conditional rendering.
- If adding "Add to Cart": include useState for cart items, handler to add/remove, cart count in nav, and a cart drawer/modal.
- If adding a form: include onSubmit with e.preventDefault(), form validation, and success feedback.
- If adding tabs: include useState for activeTab, onClick to switch, and conditional content rendering.

## COLOR/THEME CHANGES:
First, check the existing code to determine which color system it uses:

CASE A — Code uses CSS variables like bg-[hsl(var(--background))], text-[hsl(var(--foreground))]:
Change /index.css ONLY. Swap the HSL values in :root. Do NOT touch /App.tsx.
Example: "make it dark green" → --background: 150 30% 8%; --foreground: 150 10% 95%; --primary: 150 60% 40%;

CASE B — Code uses hardcoded Tailwind classes like bg-white, bg-stone-50, text-gray-900:
You MUST return the FULL /App.tsx file with all color classes swapped to the new theme.
Also update /index.css if it has color variables.
Example: "make it dark green" → bg-white becomes bg-green-950, text-gray-900 becomes text-green-50, etc.
Keep ALL layout, structure, content, images, and functionality identical — only swap color/bg/text/border classes.

## CHOOSING SEARCH/REPLACE vs FULL FILE:

Use SEARCH/REPLACE when: fixing a bug, changing text/content, updating a few styles, tweaking props, adding/removing a single element, small refactors. This is the DEFAULT — use it whenever possible.

Return the FULL FILE when: adding dark mode / theme overhaul (too many scattered className changes), adding a major new section (50+ new lines), the user says "rebuild" or "redo", or more than 60% of the file would change.

## SEARCH/REPLACE FORMAT:

SUMMARY: one sentence describing what you changed

SUGGESTIONS: suggestion 1 | suggestion 2 | suggestion 3 | suggestion 4

<<<SEARCH>>> /App.tsx
exactly copied lines from existing code
<<<REPLACE>>>
the new replacement lines
<<<END>>>

## CRITICAL RULES FOR SEARCH/REPLACE — READ CAREFULLY:

### 1. Copy the SEARCH text EXACTLY — character for character
The SEARCH block is matched against the existing file using exact string comparison. If even one character differs (wrong spacing, missing comma, different quote style), the edit SILENTLY FAILS and the user's change is lost.

WRONG — retyped from memory, subtle differences:
<<<SEARCH>>> /App.tsx
<h1 className="text-4xl font-bold">Welcome</h1>
<<<REPLACE>>>
<h1 className="text-4xl font-bold">Hello World</h1>
<<<END>>>

RIGHT — copied verbatim from the existing code provided:
<<<SEARCH>>> /App.tsx
          <h1 className="text-5xl font-extrabold tracking-tight">Welcome</h1>
<<<REPLACE>>>
          <h1 className="text-5xl font-extrabold tracking-tight">Hello World</h1>
<<<END>>>

### 2. Preserve exact indentation in BOTH search and replace
The existing code uses specific indentation (spaces). Your SEARCH must include that exact indentation. Your REPLACE must also use correct indentation so the resulting code stays properly formatted.

### 3. Include 2-4 surrounding context lines to make the match unique
If a line like \`<div className="p-4">\` appears 5 times, include the lines above/below it to create a unique match.

WRONG — ambiguous, matches multiple locations:
<<<SEARCH>>> /App.tsx
        <div className="p-4">
<<<REPLACE>>>
        <div className="p-6">
<<<END>>>

RIGHT — enough context to uniquely identify the location:
<<<SEARCH>>> /App.tsx
      <section id="pricing" className="py-24">
        <h2 className="text-3xl font-bold mb-8">Pricing</h2>
        <div className="p-4">
<<<REPLACE>>>
      <section id="pricing" className="py-24">
        <h2 className="text-3xl font-bold mb-8">Pricing</h2>
        <div className="p-6">
<<<END>>>

### 4. Adding new code: search for the insertion point and include it in the replacement
To add an import, search for existing imports and replace with old + new:

<<<SEARCH>>> /App.tsx
import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
<<<REPLACE>>>
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
<<<END>>>

To add a new section, search for the code above or below where it should go and include it unchanged plus the new code:

<<<SEARCH>>> /App.tsx
      </section>

      <footer className="border-t py-12">
<<<REPLACE>>>
      </section>

      <section id="testimonials" className="py-24 px-10 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-10">What Our Customers Say</h2>
        {/* new testimonials content */}
      </section>

      <footer className="border-t py-12">
<<<END>>>

### 5. Multiple changes = multiple blocks, in order they appear in the file
Apply changes from TOP of file to BOTTOM. Each block is independent.

### 6. Deleting code: use an empty REPLACE block
<<<SEARCH>>> /App.tsx
      <div className="banner bg-yellow-100 p-4">
        <p>Limited time offer!</p>
      </div>
<<<REPLACE>>>
<<<END>>>

### 7. Modifying state or logic: include the full function/hook being changed
Don't search for just one line inside a function — include the whole useState/useEffect/handler so the replacement is clean:

<<<SEARCH>>> /App.tsx
  const [count, setCount] = useState(0);
  const increment = () => setCount(count + 1);
<<<REPLACE>>>
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const increment = () => {
    setCount(count + 1);
    setTotal(total + count + 1);
  };
<<<END>>>

## FULL FILE FORMAT (only when needed per rules above):

SUMMARY: one sentence

SUGGESTIONS: suggestion 1 | suggestion 2 | suggestion 3 | suggestion 4

/App.tsx
\`\`\`tsx
full file content here
\`\`\`

## FINAL CHECKLIST before responding:
- Did you copy every SEARCH block character-for-character from the existing code shown to you? If unsure, use more context lines.
- Did you preserve indentation in both SEARCH and REPLACE?
- Is each SEARCH unique enough to match only one location?
- Did you include ALL necessary changes (don't forget new imports, new state, new handlers)?
- Did you avoid changing anything the user didn't ask for?

Only include files you actually changed. Omit unchanged files.`;

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

// All known models with pricing (updated June 2026)
export const MODELS: Record<string, ModelOption> = {
  "claude-haiku-4-5-20251001": {
    provider: "anthropic", model: "claude-haiku-4-5-20251001",
    displayName: "Claude Haiku", maxTokens: 12000,
    costPer1kInput: 0.001, costPer1kOutput: 0.005,
  },
  "claude-sonnet-4-6": {
    provider: "anthropic", model: "claude-sonnet-4-6",
    displayName: "Claude Sonnet", maxTokens: 32000,
    costPer1kInput: 0.003, costPer1kOutput: 0.015,
  },
  "gpt-5.4-mini": {
    provider: "openai", model: "gpt-5.4-mini",
    displayName: "GPT-5.4 mini", maxTokens: 16384,
    costPer1kInput: 0.00075, costPer1kOutput: 0.0045,
  },
  "gpt-5.4": {
    provider: "openai", model: "gpt-5.4",
    displayName: "GPT-5.4", maxTokens: 16384,
    costPer1kInput: 0.0025, costPer1kOutput: 0.015,
  },
  "gpt-5.4-nano": {
    provider: "openai", model: "gpt-5.4-nano",
    displayName: "GPT-5.4 nano", maxTokens: 16384,
    costPer1kInput: 0.0002, costPer1kOutput: 0.00125,
  },
  "gemini-2.5-flash": {
    provider: "google", model: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash", maxTokens: 16000,
    costPer1kInput: 0.00015, costPer1kOutput: 0.0035,
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

  // Editing existing app — small bump; let keywords drive the real score
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

// Priority order per complexity — Gemini Flash as primary for speed
function buildRouting(): Record<Complexity, string[]> {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGoogle = !!process.env.GOOGLE_AI_API_KEY;

  return {
    simple: [
      ...(hasGoogle ? ["gemini-2.5-flash"] : []),
      ...(hasOpenAI ? ["gpt-5.4-nano"] : []),
      "claude-haiku-4-5-20251001",
    ],
    medium: [
      ...(hasGoogle ? ["gemini-2.5-flash"] : []),
      ...(hasOpenAI ? ["gpt-5.4-mini"] : []),
      "claude-haiku-4-5-20251001",
    ],
    complex: [
      ...(hasGoogle ? ["gemini-2.5-flash"] : []),
      "claude-sonnet-4-6",
      ...(hasOpenAI ? ["gpt-5.4"] : []),
      "claude-haiku-4-5-20251001",
    ],
  };
}
// Built once at startup (env vars don't change at runtime)
const ROUTING = buildRouting();

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

// ─── Smart routing ────────────────────────────────────────────────────────────
// Uses Haiku to semantically understand the prompt, pick the cheapest capable
// model, and return a human-readable description of what it understood.

export type RouteDecision = {
  intent: string;        // "Adding a dark mode toggle with localStorage persistence"
  taskType: "style" | "content" | "bugfix" | "feature" | "new-build" | "complex";
  model: ModelOption;
  modelReason: string;   // "Simple style change — Gemini Flash is fastest"
};

const TASK_TO_COMPLEXITY: Record<RouteDecision["taskType"], Complexity> = {
  style:     "simple",
  content:   "simple",
  bugfix:    "simple",
  feature:   "medium",
  "new-build": "complex",
  complex:   "complex",
};

export async function smartRoute(
  prompt: string,
  hasExistingCode: boolean,
  forceModel?: string,
): Promise<RouteDecision> {
  // If caller already decided a model, just use it
  if (forceModel && MODELS[forceModel]) {
    return {
      intent: prompt.slice(0, 100),
      taskType: "feature",
      model: MODELS[forceModel],
      modelReason: `Forced to ${MODELS[forceModel].displayName}`,
    };
  }

  try {
    // Use Gemini Flash Lite for classification — 10x cheaper than Haiku
    const classifierPrompt = `${hasExistingCode ? "[Editing existing app] " : "[New app] "}${prompt.slice(0, 500)}`;
    const classifierSystem = `Classify a user's app-building request in one JSON object. Be concise.

taskType options:
- "style"     — color, font, spacing, layout tweak, background, border, size change
- "content"   — text change, label rename, adding/removing copy, image swap
- "bugfix"    — fixing an error, broken feature, crash, wrong behavior
- "feature"   — adding a new section, component, or functionality to existing app
- "new-build" — building a complete new app from scratch (no existing code, or total rebuild)
- "complex"   — auth systems, payments, multi-page apps, real-time, 3rd-party APIs, data models

Return ONLY JSON, no markdown:
{"intent":"<10-15 word plain English description of exactly what will be built/changed>","taskType":"<one of the 6 types above>"}`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: [{ type: "text", text: classifierSystem, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: classifierPrompt }],
    });
    const text = (res.content[0] as { type: string; text: string }).text.trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no json");
    const parsed = JSON.parse(match[0]) as { intent: string; taskType: RouteDecision["taskType"] };
    const taskType = parsed.taskType ?? (hasExistingCode ? "feature" : "new-build");
    const complexity = TASK_TO_COMPLEXITY[taskType] ?? "medium";
    const model = pickModel(complexity);

    const reasonMap: Record<RouteDecision["taskType"], string> = {
      style:       `Style change — ${model.displayName} is fast and cheap`,
      content:     `Content update — ${model.displayName} handles this efficiently`,
      bugfix:      `Bug fix — ${model.displayName} is quick for targeted fixes`,
      feature:     `New feature — ${model.displayName} has good code quality`,
      "new-build": `Full build — ${model.displayName} for best output quality`,
      complex:     `Complex task — ${model.displayName} for reliability`,
    };

    return {
      intent: parsed.intent ?? prompt.slice(0, 80),
      taskType,
      model,
      modelReason: reasonMap[taskType],
    };
  } catch {
    // Fallback: use keyword scoring
    const { complexity } = scoreComplexity(prompt, hasExistingCode ? {} : null);
    const model = pickModel(complexity);
    return {
      intent: prompt.slice(0, 80),
      taskType: hasExistingCode ? "feature" : "new-build",
      model,
      modelReason: `${model.displayName} selected by keyword analysis`,
    };
  }
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
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
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

// ─── Tool-use generation (structured edits via Claude) ─────────────────────
// Instead of parsing <<<SEARCH>>>/<<<REPLACE>>> text, Claude calls edit_file/create_file
// tools directly. This eliminates fuzzy matching failures entirely.

const EDIT_TOOLS: Anthropic.Tool[] = [
  {
    name: "edit_file",
    description: "Overwrite an existing file with new content. Provide the COMPLETE new file content — not a diff.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: 'File path starting with / (e.g. "/App.tsx", "/index.css")' },
        content: { type: "string", description: "The complete new file content" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "create_file",
    description: "Create a new file in the project.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: 'File path starting with / (e.g. "/components/Cart.tsx")' },
        content: { type: "string", description: "The file content" },
      },
      required: ["path", "content"],
    },
  },
];

const SYSTEM_EDIT_TOOLS = `You are editing an existing React + TypeScript app. Tailwind CSS is available.

## RULES:
- Do STRICTLY what the user asks — NOTHING MORE, NOTHING LESS.
- Match the existing code style (Tailwind or inline styles).
- NEVER change unrelated code, images, or layout.
- Build COMPLETE features — no stubs, no TODOs.
- The code MUST be fully functional.
- ONLY import from: react, lucide-react, react-hot-toast. Nothing else. Write all components inline.

## HOW TO MAKE EDITS:
Use the edit_file tool to modify existing files, or create_file for new files.
Always provide the COMPLETE file content — not a diff or partial update.
Only edit files that need to change. Leave unchanged files alone.

## COLOR/THEME CHANGES:
First, check the existing code to determine which color system it uses:
- If CSS variables (bg-background, text-foreground): Change /index.css ONLY.
- If hardcoded Tailwind classes (bg-white, text-gray-900): Edit /App.tsx with all colors swapped.

## IMPORTANT:
- Start with a brief explanation of what you'll do.
- Then call the tools to make the edits.
- After editing, confirm what was changed.`;

async function generateWithTools(
  model: string,
  maxTokens: number,
  userContent: string,
  existingFiles: ProjectFiles,
  onToken: (t: string) => void,
  onStatus?: (text: string) => void,
): Promise<{ files: ProjectFiles; text: string; inputTokens: number; outputTokens: number }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const editedFiles: ProjectFiles = {};
  let fullText = "";
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [{ role: "user", content: userContent }];

  for (let iteration = 0; iteration < 5; iteration++) {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: [{ type: "text", text: SYSTEM_EDIT_TOOLS, cache_control: { type: "ephemeral" } }],
      tools: EDIT_TOOLS,
      messages,
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    // Extract text and tool use blocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolBlocks: any[] = [];
    for (const block of response.content) {
      if (block.type === "text") {
        fullText += block.text;
        onToken(block.text);
      } else if (block.type === "tool_use") {
        toolBlocks.push(block);
      }
    }

    if (toolBlocks.length === 0 || response.stop_reason !== "tool_use") {
      break;
    }

    // Process tool calls
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolResults: any[] = [];
    for (const block of toolBlocks) {
      const input = block.input as { path: string; content: string };
      const filePath = input.path.startsWith("/") ? input.path : "/" + input.path;
      editedFiles[filePath] = input.content;
      onStatus?.(`Edited ${filePath}`);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: `Successfully ${block.name === "create_file" ? "created" : "edited"} ${filePath}`,
      });
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }

  if (Object.keys(editedFiles).length === 0) {
    throw new Error("Tool-use edit produced no file changes");
  }

  return { files: editedFiles, text: fullText, inputTokens: totalInputTokens, outputTokens: totalOutputTokens };
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
    max_completion_tokens: maxTokens,
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

  const stream = await client.models.generateContentStream({
    model,
    config: { maxOutputTokens: maxTokens, systemInstruction: systemPrompt },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
  });

  let text = "";
  let inputTokens = 0, outputTokens = 0;
  for await (const chunk of stream) {
    const delta = chunk.text ?? "";
    if (delta) { text += delta; onToken(delta); }
    if (chunk.usageMetadata) {
      inputTokens = chunk.usageMetadata.promptTokenCount ?? 0;
      outputTokens = chunk.usageMetadata.candidatesTokenCount ?? 0;
    }
  }
  const stopped = outputTokens >= maxTokens - 100;
  return { text, stopped, inputTokens, outputTokens };
}


// ─── Image resolution ────────────────────────────────────────────────────────
// Resolves {{unsplash:<query>|<w>x<h>}} tokens in generated code with real photos.
// Four-tier fallback: Pexels API → Unsplash API → LoremFlickr → picsum.photos.

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const UNSPLASH_TOKEN = /\{\{unsplash:([^}|]+?)(?:\|(\d+)x(\d+))?\}\}/g;

async function fetchPexelsPhoto(query: string): Promise<string | null> {
  if (!PEXELS_KEY) return null;
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
    const r = await fetch(url, { headers: { Authorization: PEXELS_KEY }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const data = await r.json();
    const photos = data.photos ?? [];
    if (photos.length === 0) return null;
    const pick = photos[Math.floor(Math.random() * Math.min(3, photos.length))];
    return pick.src?.large2x || pick.src?.large || null;
  } catch {
    return null;
  }
}

async function fetchUnsplashPool(query: string): Promise<string[]> {
  if (!UNSPLASH_KEY) return [];
  try {
    const url =
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}` +
      `&per_page=8&content_filter=high`;
    const r = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.results ?? [])
      .map((p: { urls?: { raw?: string } }) => p.urls?.raw)
      .filter((u: string | undefined): u is string => Boolean(u));
  } catch {
    return [];
  }
}

function flickrTags(query: string): string {
  return query.trim().split(/\s+/).slice(0, 2)
    .map(t => t.replace(/[^a-z0-9]/gi, "")).filter(Boolean).join(",") || "abstract";
}

function flickrUrl(query: string, w: number, h: number, index: number): string {
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(flickrTags(query))}?lock=${index + 1}`;
}

function picsumUrl(query: string, w: number, h: number): string {
  const seed = encodeURIComponent(query.trim()).replace(/%20/g, "-");
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

async function returnsImage(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(3000) });
    return r.ok && (r.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

async function resolveImages(files: ProjectFiles): Promise<ProjectFiles> {
  const queries = new Set<string>();
  for (const content of Object.values(files)) {
    for (const m of content.matchAll(UNSPLASH_TOKEN)) queries.add(m[1].trim());
  }
  if (queries.size === 0) return files;

  // Try Pexels first (200 req/hr), then Unsplash (50 req/hr), then fallbacks
  const pexelsPhotos = new Map<string, string | null>();
  const pools = new Map<string, string[]>();
  const flickrOk = new Map<string, boolean>();
  await Promise.all(
    [...queries].map(async (q) => {
      const pexelsUrl = await fetchPexelsPhoto(q);
      pexelsPhotos.set(q, pexelsUrl);
      if (!pexelsUrl) {
        const pool = await fetchUnsplashPool(q);
        pools.set(q, pool);
        if (pool.length === 0) flickrOk.set(q, await returnsImage(flickrUrl(q, 600, 400, 0)));
      }
    }),
  );

  const counters = new Map<string, number>();
  const resolved: ProjectFiles = {};
  for (const [path, content] of Object.entries(files)) {
    resolved[path] = content.replace(UNSPLASH_TOKEN, (_full, qRaw: string, ws?: string, hs?: string) => {
      const q = qRaw.trim();
      const w = ws ? parseInt(ws, 10) : 1200;
      const h = hs ? parseInt(hs, 10) : 800;

      // Try Pexels first
      const pexels = pexelsPhotos.get(q);
      if (pexels) return pexels;

      const pool = pools.get(q) ?? [];
      const i = counters.get(q) ?? 0;
      counters.set(q, i + 1);
      if (pool.length === 0) {
        return flickrOk.get(q) ? flickrUrl(q, w, h, i) : picsumUrl(q, w, h);
      }
      const base = pool[i % pool.length];
      const sep = base.includes("?") ? "&" : "?";
      return `${base}${sep}w=${w}&h=${h}&fit=crop&crop=entropy&q=80&auto=format`;
    });
  }
  return resolved;
}

// ─── Quick edit (tiny/style/content changes) ─────────────────────────────────
// Bypasses the full system prompt — sends only the existing code and a short
// instruction. Uses the cheapest available model. ~5-10x faster than full gen.

export async function generateQuickEdit(
  prompt: string,
  existingFiles: ProjectFiles,
  onToken?: (text: string) => void,
  onStatus?: (text: string) => void,
): Promise<GenerateResult> {
  onStatus?.("Applying quick edit…");

  const userContent = `Current files:\n${JSON.stringify(existingFiles, null, 2)}\n\nRequest: ${prompt}`;

  // Use a fast but capable model — needs enough power to output the full app
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const modelId = hasOpenAI ? "gpt-5.4-mini" : "claude-haiku-4-5-20251001";
  const modelOpt = MODELS[modelId] ?? MODELS["claude-haiku-4-5-20251001"];

  let text = "";
  let inputTokens = 0, outputTokens = 0;

  const tokenCallback = (token: string) => { text += token; onToken?.(token); };

  if (modelOpt.provider === "openai") {
    ({ inputTokens, outputTokens } = await generateWithOpenAI(modelOpt.model, 16000, userContent, SYSTEM_EDIT, tokenCallback));
  } else if (modelOpt.provider === "google") {
    ({ inputTokens, outputTokens } = await generateWithGoogle(modelOpt.model, 16000, userContent, SYSTEM_EDIT, tokenCallback));
  } else {
    ({ inputTokens, outputTokens } = await generateWithAnthropic(modelOpt.model, 16000, userContent, SYSTEM_EDIT, tokenCallback));
  }

  const parsed = parseOutput(text, existingFiles);
  if (!parsed || (Object.keys(parsed.files).length === 0 && !parsed.replacements?.length)) {
    throw new Error("Quick edit failed — try again or use a more detailed prompt.");
  }

  // Merge: AI only returns changed files
  const mergedFiles = { ...existingFiles, ...parsed.files };

  return {
    files: mergedFiles,
    summary: parsed.summary,
    suggestions: parsed.suggestions || [],
    modelUsed: modelOpt.displayName,
    complexity: "simple",
    complexityReasons: ["quick-edit"],
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateCost(modelOpt.model, inputTokens, outputTokens),
  };
}

// ─── JSON output parser ──────────────────────────────────────────────────────

type ParsedOutput = {
  summary: string;
  files: ProjectFiles;
  suggestions?: string[];
  replacements?: { file: string; search: string; replace: string }[];
  failedReplacements?: { file: string; search: string; replace: string }[];
};

// Longest Common Subsequence based fuzzy match — finds the best matching
// region in source for a search string, tolerating minor whitespace differences
// while preserving indentation in the output.
// ─── Truncation detection ────────────────────────────────────────────────────

function detectTruncatedFiles(files: ProjectFiles): string[] {
  const truncated: string[] = [];
  for (const [path, content] of Object.entries(files)) {
    if (!path.match(/\.(tsx?|jsx?)$/)) continue;

    const opens = (content.match(/\{/g) || []).length;
    const closes = (content.match(/\}/g) || []).length;
    const severeBraceMismatch = Math.abs(opens - closes) > 3;

    const endsAbruptly = /[,(\{<]\s*$/.test(content.trim());

    const hasEllipsis = content.includes("...") &&
      !content.includes("...rest") && !content.includes("...props") &&
      content.trim().endsWith("...");

    const tooShort = content.length < 50 && !content.includes("export");

    if (severeBraceMismatch || endsAbruptly || hasEllipsis || tooShort) {
      truncated.push(path);
    }
  }
  return truncated;
}

// ─── Fuzzy matching ──────────────────────────────────────────────────────────

function fuzzyFindRegion(source: string, search: string): { start: number; end: number } | null {
  const sourceLines = source.split("\n");
  const searchLines = search.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (searchLines.length === 0) return null;

  let bestScore = 0;
  let bestStart = -1;
  let bestEnd = -1;

  // Sliding window: try every possible position
  const windowSize = searchLines.length;
  for (let i = 0; i <= sourceLines.length - windowSize; i++) {
    // Check candidate window [i, i + windowSize + slack)
    // Allow up to 4 extra lines (blank lines the AI may have omitted)
    for (let slack = 0; slack <= 4; slack++) {
      const candidateEnd = Math.min(i + windowSize + slack, sourceLines.length);
      const candidateLines = sourceLines.slice(i, candidateEnd).map(l => l.trim()).filter(l => l.length > 0);

      if (candidateLines.length < searchLines.length) continue;
      if (candidateLines.length > searchLines.length + 2) continue;

      // Score: how many lines match exactly (trimmed)?
      let matches = 0;
      let si = 0;
      for (let ci = 0; ci < candidateLines.length && si < searchLines.length; ci++) {
        if (candidateLines[ci] === searchLines[si]) {
          matches++;
          si++;
        }
      }

      // Require at least 60% of search lines to match (lowered from 80% to catch more edits)
      const score = matches / searchLines.length;
      if (score >= 0.6 && score > bestScore) {
        bestScore = score;
        bestStart = i;
        bestEnd = candidateEnd;
      }
    }
  }

  if (bestStart === -1) return null;
  return { start: bestStart, end: bestEnd };
}

function parseOutput(text: string, existingFiles?: ProjectFiles | null): ParsedOutput | null {
  const files: ProjectFiles = {};

  // Strip outer markdown fence wrapper if AI wrapped entire output
  let cleaned = text.replace(/^```\w*\n([\s\S]*)\n```\s*$/g, "$1");
  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, "\n");

  // Extract summary and suggestions FIRST (before file parsing consumes text)
  const summaryMatch = cleaned.match(/^SUMMARY:\s*(.+)/im);
  const summary = summaryMatch ? summaryMatch[1].trim() : "Done! Check the preview.";
  const sugMatch = cleaned.match(/^SUGGESTIONS:\s*(.+)/im);
  const suggestions = sugMatch ? sugMatch[1].split("|").map(s => s.trim()).filter(Boolean) : [];

  // Strategy 0: Search/Replace blocks — <<<SEARCH>>> /file\n...\n<<<REPLACE>>>\n...\n<<<END>>>
  const srPattern = /<<<SEARCH>>>\s*(\S+)\n([\s\S]*?)<<<REPLACE>>>\n([\s\S]*?)<<<END>>>/g;
  const replacements: { file: string; search: string; replace: string }[] = [];
  let srMatch;
  while ((srMatch = srPattern.exec(cleaned)) !== null) {
    replacements.push({ file: srMatch[1].startsWith("/") ? srMatch[1] : "/" + srMatch[1], search: srMatch[2].trimEnd(), replace: srMatch[3].trimEnd() });
  }
  if (replacements.length > 0 && existingFiles) {
    const failedReplacements: { file: string; search: string; replace: string }[] = [];
    for (const r of replacements) {
      const source = files[r.file] ?? existingFiles[r.file] ?? "";
      if (!source && !existingFiles[r.file]) {
        failedReplacements.push(r);
        continue;
      }
      if (source.includes(r.search)) {
        // Exact match — best case
        files[r.file] = source.replace(r.search, r.replace);
      } else {
        // Fuzzy match using LCS-based region finder
        const region = fuzzyFindRegion(source, r.search);
        if (region) {
          const lines = source.split("\n");
          const before = lines.slice(0, region.start);
          const after = lines.slice(region.end);
          // Detect the indentation of the matched region to align the replacement
          const firstMatchedLine = lines[region.start];
          const existingIndent = firstMatchedLine.match(/^(\s*)/)?.[1] ?? "";
          const replaceLines = r.replace.split("\n");
          const replaceIndent = replaceLines[0]?.match(/^(\s*)/)?.[1] ?? "";
          let alignedReplace: string;
          if (replaceIndent !== existingIndent && replaceLines.length > 0) {
            // Re-indent replacement to match the source indentation
            alignedReplace = replaceLines.map(l => {
              if (l.startsWith(replaceIndent)) {
                return existingIndent + l.slice(replaceIndent.length);
              }
              return l;
            }).join("\n");
          } else {
            alignedReplace = r.replace;
          }
          files[r.file] = [...before, alignedReplace, ...after].join("\n");
        } else {
          failedReplacements.push(r);
        }
      }
    }
    if (Object.keys(files).length > 0) {
      return { summary, files, suggestions, replacements, failedReplacements: failedReplacements.length > 0 ? failedReplacements : undefined };
    }
  }

  // Strategy 1: GPT Engineer markdown format — /filename\n```lang\ncode\n```
  const filePattern = /^\/(\S+)\s*\n```[\w]*\n([\s\S]*?)```/gm;
  let match;
  while ((match = filePattern.exec(cleaned)) !== null) {
    const path = "/" + match[1];
    const content = match[2].trimEnd();
    if (content.length > 20) files[path] = content;
  }

  if (Object.keys(files).length > 0) {
    return { summary, files, suggestions };
  }

  // Strategy 2: try JSON format as fallback
  let jsonStr: string | null = null;

  // Try extracting from JSON code fence
  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]*)```\s*$/);
  if (fenceMatch) {
    try { JSON.parse(fenceMatch[1].trim()); jsonStr = fenceMatch[1].trim(); } catch { /* */ }
  }
  if (!jsonStr) {
    const trimmed = text.trim().replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    try { JSON.parse(trimmed); jsonStr = trimmed; } catch { /* */ }
  }
  if (!jsonStr) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const sub = text.slice(firstBrace, lastBrace + 1);
      try { JSON.parse(sub); jsonStr = sub; } catch { /* */ }
    }
  }

  if (!jsonStr) return null;

  try {
    const parsed = JSON.parse(jsonStr) as {
      files?: { path: string; content: string }[];
      replacements?: { file: string; search: string; replace: string }[];
      summary?: string;
    };

    // Handle replacements format (line-replace — fast edits)
    if (parsed.replacements && Array.isArray(parsed.replacements) && parsed.replacements.length > 0) {
      const files: ProjectFiles = {};
      const failedReplacements: { file: string; search: string; replace: string }[] = [];
      if (existingFiles) {
        for (const r of parsed.replacements) {
          const filePath = r.file;
          const source = files[filePath] ?? existingFiles[filePath] ?? "";
          if (source.includes(r.search)) {
            files[filePath] = source.replace(r.search, r.replace);
          } else {
            const region = fuzzyFindRegion(source, r.search);
            if (region) {
              const lines = source.split("\n");
              const before = lines.slice(0, region.start);
              const after = lines.slice(region.end);
              files[filePath] = [...before, r.replace, ...after].join("\n");
            } else {
              failedReplacements.push(r);
            }
          }
        }
      }
      return { summary: parsed.summary || "Done! Check the preview.", files, replacements: parsed.replacements, failedReplacements: failedReplacements.length > 0 ? failedReplacements : undefined };
    }

    // Handle files format (full rewrite)
    if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
      const files: ProjectFiles = {};
      for (const f of parsed.files) {
        if (f.path && f.content) files[f.path] = f.content;
      }
      return { summary: parsed.summary || "Done! Check the preview.", files };
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface GenerateResult {
  files: ProjectFiles;
  summary: string;
  suggestions: string[];
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
  forceModel?: string,
  customKnowledge?: string | null,
  projectHistory?: string | null
): Promise<GenerateResult> {
  const { complexity, reasons: complexityReasons } = scoreComplexity(prompt, existingFiles);
  let modelOpt = forceModel && MODELS[forceModel] ? MODELS[forceModel] : pickModel(complexity);
  const isEdit = !!(existingFiles && Object.keys(existingFiles).length > 0);

  // Design system — 83 categories × 25 moods × 40 palettes = 80,000+ unique combinations
  const designMatch = isEdit ? null : matchDesign(prompt);
  const advancedDesignContext = designMatch ? buildDesignContext(designMatch) : "";

  // Fallback to original 8-theme system if no category matched
  const pickedDesign = (!designMatch && !isEdit) ? pickDesign(prompt) : null;
  const designInjection = isEdit
    ? `EDITING AN EXISTING APP — DO NOT apply any new design system. Read the existing code and match its exact colors, fonts, spacing, and visual style. Your only job is to add/change what was requested.`
    : designMatch
    ? advancedDesignContext
    : `${pickedDesign!.description}

In /index.css, define EXACTLY these CSS variables:
:root {
  --background: ${pickedDesign!.bg};
  --card: ${pickedDesign!.card};
  --border: ${pickedDesign!.border};
  --accent: ${pickedDesign!.accent};
  --accent2: ${pickedDesign!.accent2};
  --text: ${pickedDesign!.text};
  --muted: ${pickedDesign!.muted};
}

Use these in inline styles: style={{ background: "var(--accent)", color: "var(--text)" }}
body background: var(--background). Cards: var(--card). Borders: var(--border).
border-radius: ${pickedDesign!.radius} everywhere.`;

  const hasEnvVars = envVars && Object.keys(envVars).length > 0;
  const integrationsBlock = hasEnvVars
    ? `When env vars are provided via window.ENV, read keys from there. Use /api/upload for image uploads. Use window.tcSave/tcLoad for data persistence.`
    : "Use window.tcSave(key, value) and window.tcLoad(key, fallback) for data persistence. Use /api/upload for image uploads.";

  // ── Edit Intent Analyzer (7 categories like open-lovable) ──
  type EditIntent = "update_component" | "add_feature" | "fix_issue" | "update_style" | "refactor" | "full_rebuild" | "update_content";
  let editIntent: EditIntent = "update_component";
  if (isEdit) {
    const p = prompt.toLowerCase();
    if (/\b(fix|bug|error|broken|crash|not working|debug)\b/.test(p)) editIntent = "fix_issue";
    else if (/\b(add|create|build|implement|new|need)\b.*\b(cart|checkout|search|admin|login|auth|payment|form|modal|page|section|feature)\b/.test(p)) editIntent = "add_feature";
    else if (/\b(color|theme|dark|light|style|font|background|gradient|palette|scheme)\b/.test(p)) editIntent = "update_style";
    else if (/\b(change|update|rename|replace|swap)\b.*\b(text|name|title|copy|content|phone|email|address|number|price|description)\b/.test(p)) editIntent = "update_content";
    else if (/\b(refactor|clean|reorganize|optimize|simplify)\b/.test(p)) editIntent = "refactor";
    else if (/\b(rebuild|redo|start over|from scratch)\b/.test(p)) editIntent = "full_rebuild";
  }

  // All edits use EDIT prompt. Only new builds use BUILD prompt.
  const SYSTEM_PROMPT = isEdit
    ? SYSTEM_EDIT
    : SYSTEM_BUILD
        .replace("{{DESIGN_INJECTION}}", designInjection)
        .replace("{{INTEGRATIONS_INJECTION}}", integrationsBlock);

  onStatus?.("Starting generation…");

  const envSection = envVars && Object.keys(envVars).length > 0
    ? `\n\nEnv vars: ${JSON.stringify(envVars)}`
    : "";

  // ── Smart Context Selection ──
  // For edits: split files into PRIMARY (to edit, full content) and CONTEXT (reference, truncated)
  // For new builds: no existing files needed
  let existingSection = "";
  if (existingFiles && Object.keys(existingFiles).length > 0) {
    const allPaths = Object.keys(existingFiles);

    // Key files always included in full
    const keyFiles = allPaths.filter(p =>
      p.endsWith("/App.tsx") || p.endsWith("/index.css") || p.endsWith("tailwind.config.js") || p.endsWith("package.json")
    );

    // Find primary files: files the user is likely referring to
    const promptLower = prompt.toLowerCase();
    const primaryFiles = allPaths.filter(p => {
      if (keyFiles.includes(p)) return true;
      const name = p.split("/").pop()?.replace(/\.\w+$/, "").toLowerCase() ?? "";
      // If user mentions the component/file name
      if (name && promptLower.includes(name)) return true;
      // If user mentions text that exists in this file
      const content = existingFiles[p];
      const quotedStrings = prompt.match(/["']([^"']+)["']/g);
      if (quotedStrings) {
        for (const qs of quotedStrings) {
          const clean = qs.replace(/["']/g, "");
          if (clean.length > 2 && content.includes(clean)) return true;
        }
      }
      return false;
    });

    // If no specific files matched, or it's a style/rebuild — include all
    const usePrimary = primaryFiles.length > 0 && primaryFiles.length < allPaths.length &&
      editIntent !== "full_rebuild" && editIntent !== "update_style";

    const parts: string[] = [];
    if (usePrimary) {
      // Primary files: full content, marked for editing
      parts.push("## Files to Edit:\n");
      for (const path of primaryFiles) {
        const content = existingFiles[path];
        const truncated = content.length > 12000 ? content.slice(0, 12000) + "\n// ... (truncated)" : content;
        parts.push(`${path}\n\`\`\`\n${truncated}\n\`\`\``);
      }
      // Context files: truncated for reference
      const contextPaths = allPaths.filter(p => !primaryFiles.includes(p));
      if (contextPaths.length > 0) {
        parts.push("\n## Context Files (reference only — do not edit unless necessary):\n");
        for (const path of contextPaths) {
          const content = existingFiles[path];
          const truncated = content.length > 2000 ? content.slice(0, 2000) + "\n// ... [truncated]" : content;
          parts.push(`${path}\n\`\`\`\n${truncated}\n\`\`\``);
        }
      }
    } else {
      // Fallback: send all files in full (small projects or broad edits)
      for (const [path, content] of Object.entries(existingFiles)) {
        const truncated = content.length > 12000 ? content.slice(0, 12000) + "\n// ... (truncated)" : content;
        parts.push(`${path}\n\`\`\`\n${truncated}\n\`\`\``);
      }
    }
    const joined = parts.join("\n\n");
    if (joined.length < 80000) existingSection = joined;
  }
  const knowledgeSection = customKnowledge ? `\n\nPROJECT KNOWLEDGE (always follow these conventions and requirements):\n${customKnowledge}` : "";
  const historySection = projectHistory ? `\n\nPROJECT HISTORY (what has been built so far — maintain all existing features, fix known issues, avoid regressions):\n${projectHistory}` : "";

  const year = new Date().getFullYear();
  // Build user content based on edit intent
  const intentHints: Record<EditIntent, string> = {
    add_feature: "Build the COMPLETE feature with working state, UI, and interactions. Keep ALL existing content intact. You will likely need multiple SEARCH/REPLACE blocks: one for new imports, one for new state/handlers, and one or more for new JSX. If the feature is large (50+ new lines), return the full file instead.",
    fix_issue: "Fix ONLY the bug. Do NOT remove or simplify any features. Use SEARCH/REPLACE — bug fixes are always small, targeted changes. Include the broken code in SEARCH and the fixed version in REPLACE.",
    update_style: "First check if the existing code uses CSS variables (bg-[hsl(var(--...))]) or hardcoded Tailwind colors (bg-white, text-gray-900). If CSS variables: only change /index.css. If hardcoded colors: return the FULL /App.tsx with color classes swapped. For targeted style changes (one button, one section), use SEARCH/REPLACE. Keep all content and functionality identical.",
    update_content: "Update only the specific text/content mentioned. Use SEARCH/REPLACE — content changes are always small. Copy the exact existing text in SEARCH, put the new text in REPLACE. Change nothing else.",
    update_component: "Modify the component as requested. Use SEARCH/REPLACE. Preserve everything the user didn't mention.",
    refactor: "Clean up the code without changing any visible behavior. Use SEARCH/REPLACE for targeted refactors. Return full file only if restructuring the entire component.",
    full_rebuild: "Rebuild the app from scratch. Return the FULL file using markdown fence format.",
  };

  // Track this request in conversation state
  conversationState.messages.push({ role: "user", content: prompt });
  trimConversationState();

  const conversationCtx = isEdit ? buildConversationContext() : "";

  // Tool-use path gets a clean prompt without search/replace hints
  const toolUserContent = isEdit
    ? `Current files:\n${existingSection}${envSection}${knowledgeSection}${historySection}${conversationCtx}\n\n[${editIntent.toUpperCase()}] ${prompt}`
    : "";

  // Text-based path keeps the intent hints (tells AI to use SEARCH/REPLACE format)
  const userContent = isEdit
    ? `Current files:\n${existingSection}${envSection}${knowledgeSection}${historySection}${conversationCtx}\n\n[${editIntent.toUpperCase()}] ${prompt}\n\n${intentHints[editIntent]}`
    : `Build this app: ${prompt}${envSection}${knowledgeSection}\n\nToday's date: ${new Date().toISOString().slice(0, 10)}. Use the current year (${year}) for any copyright notices.`;

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

  // ── MULTI-AGENT PIPELINE ──
  // New builds: Code + Style + Images run in PARALLEL
  // Edits: Code agent outputs COMPLETE file (no search/replace parsing needed)

  // ── TOOL-USE PIPELINE — like Lovable, like DevForge ──
  // AI calls edit_file(path, content) with structured data. No text parsing needed.

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const toolUseFiles: ProjectFiles = {};
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let summary = "";

  const toolMessages: Anthropic.MessageParam[] = [{
    role: "user",
    content: isEdit
      ? `Current files:\n${existingSection}${envSection}${knowledgeSection}${historySection}${conversationCtx}\n\n${prompt}`
      : userContent,
  }];

  const toolSystemPrompt = isEdit
    ? `You are editing a React + TypeScript app. Do EXACTLY what the user asks.
RULES:
- Use the edit_file tool to output COMPLETE file contents.
- Keep ALL existing functionality intact unless told to change it.
- EVERY button must have a working onClick handler with useState.
- ONLY import from: react, lucide-react, react-hot-toast. Nothing else.
- NEVER say "already implemented". ALWAYS call edit_file with updated code.
- Start with a brief one-sentence description of what you'll change.`
    : SYSTEM_PROMPT;

  const model = isEdit ? "claude-haiku-4-5-20251001" : "claude-haiku-4-5-20251001";

  onStatus?.(isEdit ? "Making changes…" : "Building your site…");

  for (let iteration = 0; iteration < 5; iteration++) {
    const response = await client.messages.create({
      model,
      max_tokens: 16000,
      system: [{ type: "text", text: toolSystemPrompt, cache_control: { type: "ephemeral" } }],
      tools: EDIT_TOOLS,
      tool_choice: iteration === 0 ? { type: "any" } : { type: "auto" },
      messages: toolMessages,
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    // Extract text and tool calls
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === "text") {
        text += block.text;
        onToken?.(block.text);
        if (!summary) summary = block.text.slice(0, 200);
      }
      if (block.type === "tool_use") {
        const input = block.input as { path: string; content: string };
        const filePath = input.path.startsWith("/") ? input.path : "/" + input.path;
        toolUseFiles[filePath] = input.content;
        onStatus?.(`Writing ${filePath}…`);
        onToken?.(`\nEdited ${filePath}`);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Done: ${filePath}`,
        });
      }
    }

    if (toolResults.length === 0 || response.stop_reason !== "tool_use") break;

    toolMessages.push({ role: "assistant", content: response.content });
    toolMessages.push({ role: "user", content: toolResults });
  }

  inputTokens = totalInputTokens;
  outputTokens = totalOutputTokens;

  // If tool use produced files, skip text parsing entirely
  if (Object.keys(toolUseFiles).length > 0) {
    const summaryMatch = text.match(/^(.{5,200}?)(?:\.|$)/m);
    const parsedSummary = summaryMatch ? summaryMatch[1].trim() : summary || "Done.";

    // Post-process tool-use files — fix common AI code issues
    for (const [path, code] of Object.entries(toolUseFiles)) {
      if (!path.match(/\.(tsx?|jsx?)$/)) continue;
      let fixed = code;
      // Fix apostrophes
      fixed = fixed.replace(/(\w)'(ll|re|ve|t|s|d|m)\b/g, "$1’$2");
      // Strip section component imports
      fixed = fixed.replace(/import\s+.*from\s+['"]\.?\/components\/sections\/[^'"]+['"];?\n?/g, "");
      // Fix double semicolons
      fixed = fixed.replace(/;;\s*/g, ";\n");
      // Convert Tailwind custom color classes to inline styles
      // bg-primary → style with hsl(var(--primary))
      const colorMap: Record<string, string> = {
        'bg-background': 'background:hsl(var(--background))',
        'bg-foreground': 'background:hsl(var(--foreground))',
        'bg-card': 'background:hsl(var(--card))',
        'bg-primary': 'background:hsl(var(--primary))',
        'bg-secondary': 'background:hsl(var(--secondary))',
        'bg-muted': 'background:hsl(var(--muted))',
        'bg-accent': 'background:hsl(var(--accent))',
        'text-foreground': 'color:hsl(var(--foreground))',
        'text-muted': 'color:hsl(var(--muted))',
        'text-primary': 'color:hsl(var(--primary))',
        'text-primary-foreground': 'color:hsl(var(--primary-foreground))',
        'text-card-foreground': 'color:hsl(var(--foreground))',
        'border-border': 'borderColor:hsl(var(--border))',
      };
      for (const [cls, styleProp] of Object.entries(colorMap)) {
        const regex = new RegExp(`className="([^"]*?)\\b${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b([^"]*?)"`, 'g');
        fixed = fixed.replace(regex, (match, before, after) => {
          const remainingClasses = (before + after).trim();
          const [prop, val] = styleProp.split(':');
          // Check if element already has a style prop
          return `className="${remainingClasses}" style={{${prop}: '${val}'}}`;
        });
      }
      // Merge multiple style props on same element
      fixed = fixed.replace(/style=\{\{([^}]+)\}\}\s*style=\{\{([^}]+)\}\}/g, 'style={{$1, $2}}');
      toolUseFiles[path] = fixed;
    }

    // Append CSS utility classes to index.css so Tailwind custom classes render
    if (toolUseFiles["/index.css"]) {
      toolUseFiles["/index.css"] += `
/* Force background and text colors on everything */
body, #root, #app, [data-reactroot], main, .App {
  background-color: hsl(var(--background)) !important;
  color: hsl(var(--foreground)) !important;
  min-height: 100vh;
}
nav, header { background-color: hsla(var(--card), 0.9) !important; backdrop-filter: blur(12px); }
button, [role="button"], a[href] { cursor: pointer; }
img { max-width: 100%; height: auto; }
img:not([class*="h-"]) { max-height: 500px; object-fit: cover; width: 100%; }
/* Utility classes for Sandpack Tailwind compatibility */
.bg-background { background-color: hsl(var(--background)) !important; }
.bg-foreground { background-color: hsl(var(--foreground)) !important; }
.bg-card { background-color: hsl(var(--card)) !important; }
.bg-primary { background-color: hsl(var(--primary)) !important; }
.bg-secondary { background-color: hsl(var(--secondary)) !important; }
.bg-muted { background-color: hsl(var(--muted)) !important; }
.bg-accent { background-color: hsl(var(--accent)) !important; }
.text-foreground { color: hsl(var(--foreground)) !important; }
.text-muted { color: hsl(var(--muted)) !important; }
.text-primary { color: hsl(var(--primary)) !important; }
.text-primary-foreground { color: hsl(var(--primary-foreground)) !important; }
.text-card-foreground { color: hsl(var(--foreground)) !important; }
.border-border { border-color: hsl(var(--border)) !important; }
`;
    }

    // Merge with existing files for edits
    const mergedFiles = isEdit && existingFiles
      ? { ...existingFiles, ...toolUseFiles }
      : toolUseFiles;

    // Resolve images
    const resolvedFiles = await resolveImages(mergedFiles);

    // Track conversation
    const changedFiles = Object.keys(toolUseFiles);
    conversationState.messages.push({ role: "assistant", content: parsedSummary, filesChanged: changedFiles });
    conversationState.recentlyCreatedFiles.push(...changedFiles);
    if (isEdit) {
      conversationState.edits.push({ timestamp: Date.now(), userRequest: prompt, editType: editIntent, filesChanged: changedFiles });
    }
    trimConversationState();

    return {
      files: resolvedFiles,
      summary: parsedSummary,
      suggestions: [],
      modelUsed: model,
      complexity,
      complexityReasons,
      inputTokens,
      outputTokens,
      estimatedCostUsd: estimateCost(model, inputTokens, outputTokens),
    };
  }

  // Fallback: if tool use produced no files, try text parsing
  stopped = false;

  // ── Parse results ──
  let parsed: ParsedOutput | null;

  {
    parsed = parseOutput(text, existingFiles);

    if (!parsed) {
      // Last resort: if the response contains what looks like JSX/TSX code, treat it as a full App.tsx rewrite
      if (text.includes("export default function") || text.includes("export default function App")) {
        const codeMatch = text.match(/(?:```(?:tsx?|jsx?)?\n)?([\s\S]*export default function[\s\S]*)$/);
        if (codeMatch) {
          const code = codeMatch[1].replace(/```\s*$/, "").trim();
          parsed = { summary: "Applied changes.", files: { "/App.tsx": code }, suggestions: [] };
        }
      }
      if (!parsed) {
        const preview = text.slice(0, 500).replace(/\n/g, " ");
        throw new Error(`Could not parse response. Raw output starts with: ${preview}`);
      }
    }

    // Merge CSS from Style Agent (parallel generation)
    const generatedCss = (globalThis as any).__generatedCss;
    if (generatedCss && !parsed.files["/index.css"]) {
      parsed.files["/index.css"] = generatedCss;
    }
    (globalThis as any).__generatedCss = undefined;

    // ── Retry failed replacements (one attempt) ──
    if (isEdit && parsed.failedReplacements && parsed.failedReplacements.length > 0 && existingFiles) {
      const failedFiles = [...new Set(parsed.failedReplacements.map(r => r.file))];
      onStatus?.("Some edits didn't match — retrying…");

      const retryPrompt = `Your previous search/replace blocks failed to match. The SEARCH text didn't exist in the file.

Failed edits that need to be applied:
${parsed.failedReplacements.map(r => `File: ${r.file}\nIntended change: replace\n${r.search}\nwith\n${r.replace}`).join("\n\n")}

Current file contents:
${failedFiles.map(f => `${f}\n\`\`\`\n${existingFiles[f] ?? ""}\n\`\`\``).join("\n\n")}

Return the FULL updated file(s) in markdown fence format with the changes applied. Do NOT use search/replace this time.

${failedFiles.map(f => `${f}\n\`\`\`tsx\nfull corrected content\n\`\`\``).join("\n\n")}`;

      let retryText = "";
      try {
        if (modelOpt.provider === "anthropic") {
          await generateWithAnthropic(modelOpt.model, modelOpt.maxTokens, retryPrompt, "You are applying code edits. Return the complete updated file(s).", (t) => { retryText += t; });
        } else if (modelOpt.provider === "openai") {
          await generateWithOpenAI(modelOpt.model, modelOpt.maxTokens, retryPrompt, "You are applying code edits. Return the complete updated file(s).", (t) => { retryText += t; });
        } else if (modelOpt.provider === "google") {
          await generateWithGoogle(modelOpt.model, modelOpt.maxTokens, retryPrompt, "You are applying code edits. Return the complete updated file(s).", (t) => { retryText += t; });
        }
        const retryParsed = parseOutput(retryText, existingFiles);
        if (retryParsed && Object.keys(retryParsed.files).length > 0) {
          for (const [path, content] of Object.entries(retryParsed.files)) {
            parsed.files[path] = content;
          }
          parsed.failedReplacements = undefined;
        }
      } catch {
        // Retry failed — continue with whatever edits did succeed
      }
    }
  }

  // ── Build Validator (like open-lovable) ──
  // Check for common issues before showing preview
  const appCode = parsed.files["/App.tsx"] ?? "";
  if (!isEdit && !appCode) {
    throw new Error("Model response was incomplete — missing App.tsx. Please try again.");
  }
  if (!isEdit && appCode.length < 200) {
    throw new Error("Model returned a near-empty app. Please try again or rephrase your request.");
  }
  if (appCode) {
    // Check for unbalanced braces (common AI error)
    const opens = (appCode.match(/\{/g) || []).length;
    const closes = (appCode.match(/\}/g) || []).length;
    if (Math.abs(opens - closes) > 2) {
      // Try to fix by adding missing closing braces
      let fixed = appCode;
      for (let i = 0; i < opens - closes; i++) fixed += "\n}";
      parsed.files["/App.tsx"] = fixed;
    }
    // STRIP all imports from /components/sections/ — they cause "Element type is invalid" errors
    // The AI keeps importing these despite prompt rules, so we remove them post-generation
    let fixedApp = parsed.files["/App.tsx"] ?? appCode;
    const sectionImports = fixedApp.match(/import\s+.*from\s+['"]\.?\/components\/sections\/[^'"]+['"];?\n?/g);
    if (sectionImports) {
      for (const imp of sectionImports) {
        fixedApp = fixedApp.replace(imp, "");
      }
      // Also remove any JSX that references the imported components (they'll be undefined)
      // Extract component names from the imports
      for (const imp of sectionImports) {
        const nameMatch = imp.match(/import\s+(\w+)/);
        if (nameMatch) {
          const compName = nameMatch[1];
          // Replace <ComponentName .../> and <ComponentName>...</ComponentName> with a placeholder div
          fixedApp = fixedApp.replace(new RegExp(`<${compName}\\s[^>]*/>`, 'g'), `<div className="py-20 px-6 text-center text-gray-400">Section placeholder</div>`);
          fixedApp = fixedApp.replace(new RegExp(`<${compName}\\s[^>]*>[\\s\\S]*?</${compName}>`, 'g'), `<div className="py-20 px-6 text-center text-gray-400">Section placeholder</div>`);
        }
      }
      parsed.files["/App.tsx"] = fixedApp;
    }

    // Fix apostrophes breaking single-quoted strings
    for (const [path, code] of Object.entries(parsed.files)) {
      if (!path.match(/\.(tsx?|jsx?)$/)) continue;
      let fixed = code;
      // Simple approach: find any single-quoted string and if it has an odd number of single quotes
      // between opening/closing, it's broken. Replace ALL single-quoted toast/alert messages with double quotes.
      fixed = fixed.replace(/toast\.\w+\('([^;]*)'\)/g, (match) => match.replace(/'/g, (q, idx) => idx === match.indexOf("'") || idx === match.lastIndexOf("'") ? '"' : "\\'"));
      // Broader fix: any string content with contractions
      fixed = fixed.replace(/'([^']{0,500})'/g, (match, inner) => {
        if (inner.match(/\w'(ll|re|ve|t|s|d|m)\b/)) return `"${inner}"`;
        return match;
      });
      if (fixed !== code) parsed.files[path] = fixed;
    }

    // Fix duplicate component/function declarations (common in search/replace edits)
    for (const [path, code] of Object.entries(parsed.files)) {
      if (!path.match(/\.(tsx?|jsx?)$/)) continue;
      const declarations = new Map<string, number>();
      const lines = code.split("\n");
      const duplicateLines: number[] = [];
      lines.forEach((line, i) => {
        const match = line.match(/^(?:export\s+)?(?:const|function|class)\s+(\w+)/);
        if (match) {
          const name = match[1];
          if (declarations.has(name)) {
            // Find the end of this duplicate declaration and mark for removal
            let braceCount = 0;
            let started = false;
            for (let j = i; j < lines.length; j++) {
              braceCount += (lines[j].match(/\{/g) || []).length;
              braceCount -= (lines[j].match(/\}/g) || []).length;
              duplicateLines.push(j);
              if (braceCount > 0) started = true;
              if (started && braceCount <= 0) break;
            }
          } else {
            declarations.set(name, i);
          }
        }
      });
      if (duplicateLines.length > 0) {
        parsed.files[path] = lines.filter((_, i) => !duplicateLines.includes(i)).join("\n");
      }
    }

    // Fix common JSX syntax errors in ALL files
    for (const [path, code] of Object.entries(parsed.files)) {
      let fixed = code;
      // Fix: semicolons before }} ONLY in JSX event handler attributes (on\w+=)
      fixed = fixed.replace(/(on\w+=\{[^}]*?);\s*\}\}/g, "$1}}");
      // Fix: double semicolons
      fixed = fixed.replace(/;;\s*/g, ";\n");
      if (fixed !== code) parsed.files[path] = fixed;
    }

    // Check for missing default export
    const finalApp = parsed.files["/App.tsx"] ?? appCode;
    if (!finalApp.includes("export default")) {
      parsed.files["/App.tsx"] = finalApp + "\nexport default function App() { return <div>Error: missing export</div>; }";
    }
  }

  // ── Truncation Recovery ──
  // Detect files that look cut off and ask the AI to complete them
  const truncatedFiles = detectTruncatedFiles(parsed.files);
  if (truncatedFiles.length > 0) {
    onStatus?.("Fixing truncated files…");
    for (const filePath of truncatedFiles) {
      const partialContent = parsed.files[filePath];
      const completionPrompt = `This file was truncated during generation. Complete it.

File: ${filePath}
Original request: ${prompt}

Partial content:
\`\`\`tsx
${partialContent}
\`\`\`

Return the COMPLETE file. Include all imports, complete all functions, close all tags. Use markdown fence format:

${filePath}
\`\`\`tsx
complete file here
\`\`\``;

      let completionText = "";
      try {
        if (modelOpt.provider === "anthropic") {
          await generateWithAnthropic(modelOpt.model, modelOpt.maxTokens, completionPrompt, "Complete the truncated file. Return the full working code.", (t) => { completionText += t; });
        } else if (modelOpt.provider === "openai") {
          await generateWithOpenAI(modelOpt.model, modelOpt.maxTokens, completionPrompt, "Complete the truncated file. Return the full working code.", (t) => { completionText += t; });
        } else if (modelOpt.provider === "google") {
          await generateWithGoogle(modelOpt.model, modelOpt.maxTokens, completionPrompt, "Complete the truncated file. Return the full working code.", (t) => { completionText += t; });
        }
        // Extract code from markdown fence
        const codeMatch = completionText.match(/```[\w]*\n([\s\S]*?)```/);
        if (codeMatch && codeMatch[1].length > partialContent.length) {
          parsed.files[filePath] = codeMatch[1].trimEnd();
        }
      } catch {
        // Completion failed — keep partial content, better than nothing
      }
    }
  }

  // Resolve {{unsplash:...}} tokens → real photo URLs
  // Skip for edits (no new images) to save 2-8s
  let resolvedFiles: ProjectFiles;
  const hasTokens = Object.values(parsed.files).some(c => UNSPLASH_TOKEN.test(c));
  UNSPLASH_TOKEN.lastIndex = 0;
  if (hasTokens) {
    try {
      resolvedFiles = await Promise.race([
        resolveImages(parsed.files),
        new Promise<ProjectFiles>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
      ]);
    } catch {
      resolvedFiles = {} as ProjectFiles;
      for (const [path, content] of Object.entries(parsed.files)) {
        resolvedFiles[path] = content.replace(UNSPLASH_TOKEN, (_full, qRaw: string, ws?: string, hs?: string) => {
          const w = ws ? parseInt(ws, 10) : 1200;
          const h = hs ? parseInt(hs, 10) : 800;
          return picsumUrl(qRaw.trim(), w, h);
        });
      }
    }
  } else {
    resolvedFiles = parsed.files;
  }

  // For edits: merge returned files with existing (AI only returns changed files)
  const finalFiles = isEdit && existingFiles
    ? { ...existingFiles, ...resolvedFiles }
    : resolvedFiles;

  // ── Update conversation state ──
  const changedFiles = Object.keys(parsed.files);
  conversationState.messages.push({ role: "assistant", content: parsed.summary, filesChanged: changedFiles });
  conversationState.recentlyCreatedFiles.push(...changedFiles);
  if (isEdit) {
    conversationState.edits.push({
      timestamp: Date.now(),
      userRequest: prompt.slice(0, 120),
      editType: editIntent,
      filesChanged: changedFiles,
    });
  }
  trimConversationState();

  return {
    files: finalFiles,
    summary: parsed.summary,
    suggestions: parsed.suggestions || [],
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
    "/App.tsx": `import './index.css';\n\nexport default function App() {\n  return (\n    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>\n      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Your app will appear here</h1>\n      <p style={{ color: "hsl(var(--muted-foreground))" }}>Describe what you want to build in the chat.</p>\n    </div>\n  );\n}`,
    "/index.css": `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');\n\n:root {\n  --background: 0 0% 100%;\n  --foreground: 222 47% 11%;\n  --primary: 262 83% 58%;\n  --primary-foreground: 0 0% 100%;\n  --secondary: 210 40% 96%;\n  --secondary-foreground: 222 47% 11%;\n  --muted: 210 40% 96%;\n  --muted-foreground: 215 16% 47%;\n  --accent: 210 40% 96%;\n  --accent-foreground: 222 47% 11%;\n  --destructive: 0 84% 60%;\n  --destructive-foreground: 0 0% 100%;\n  --border: 214 32% 91%;\n  --input: 214 32% 91%;\n  --ring: 262 83% 58%;\n  --card: 0 0% 100%;\n  --card-foreground: 222 47% 11%;\n  --radius: 0.5rem;\n}\n\n* { box-sizing: border-box; margin: 0; padding: 0; }\nbody { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }`,
  };
}
