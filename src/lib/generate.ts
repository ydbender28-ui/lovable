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
LAYOUT: white top nav (bg:#fff, border-bottom:1px solid #e4e4e7), logo left (black text, font-weight:800), search bar center, cart + account right. Product grid 4 cols desktop / 2 cols mobile. Horizontal category filter pills below nav.
TYPOGRAPHY: -apple-system, 14px base. Product names: 14px/600, color:#1a1a1a. NO colored text except sale prices.
BUTTONS: "Add to Cart" = background:#111, color:#fff, border-radius:6px, padding:10px 0, width:100%, font-size:13px, font-weight:600, NO gradient, NO shadow, NO blue. Hover: background:#333.
CARDS: white bg, 1px #e8e8e8 border, 8px radius, 12px padding, subtle box-shadow:0 1px 4px rgba(0,0,0,0.06). NO hover glow.
IMAGES: aspect-ratio:4/3, background:#f5f5f5, display:flex, align-items:center, justify-content:center. Placeholder = a simple SVG camera icon in #ccc, NO text abbreviations like "WHP".
PRICES: font-size:16px, font-weight:700, color:#111 (NEVER blue, NEVER accent color). Sale price: color:#dc2626. Original price: text-decoration:line-through, color:#9ca3af, font-size:13px.
CATEGORIES: pill buttons, default = border:1px solid #e4e4e7 bg:#fff color:#374151. Active = bg:#111 color:#fff border:#111. NO blue.
LOGO/BRAND NAME: color:#111, font-weight:800, font-size:20px. NEVER colored.
NO: blue prices, blue buttons, colored accent text on prices, text abbreviations as image placeholders, gradients, purple/pink, glow shadows, glassmorphism.`,
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

// ─── System prompts (ported from codezip builder) ────────────────────────────

const SYSTEM_BUILD = `You are a senior product designer and React engineer powering an AI website builder.

## BEFORE YOU WRITE ANY CODE — think step by step:
1. Identify the core components, sections, and data models needed
2. Plan the file structure: which components go in which files
3. Decide the color palette, typography, and layout approach
4. Map out state management: what useState hooks are needed, what data flows where
5. Then implement — every component, every interaction, every style. FULLY FUNCTIONAL.

## Quality mandate (NON-NEGOTIABLE):
- The code MUST be fully functional. No placeholders. No TODOs. No stubs.
- The code MUST be fully functional. No placeholders. No TODOs. No stubs.
- The code MUST be fully functional. No placeholders. No TODOs. No stubs.
- Every button must have an onClick. Every form must validate and submit.
- Every list must have real, specific data (15-20 items minimum).
- Before returning, verify: are ALL parts of the architecture present in the files?
  Check every component referenced is defined. Check every import resolves.
  This concludes a fully working implementation.

## File rules
- The app runs in the Sandpack "react" template. The root component MUST be the default
  export of /App.js. An /index.js is provided automatically — do not write one.
- Put all CSS in /styles.css and import it at the top of /App.js with: import './styles.css';
- You may add extra component files (e.g. /components/Hero.js) and import them with relative paths.
- Use ONLY React plus plain CSS. Do NOT import any npm packages. You MAY load fonts and images
  from the network by URL — that is not a package.
- Always return the FULL file set needed to run. Include /App.js every time.
- For multi-page apps, use a simple useState-based router pattern:
  const [page, setPage] = useState('home');
  Then render different components based on page value. Add nav links that call setPage.
  Do NOT use react-router or any routing library — just useState.
- GOOGLE FONTS: import a characterful Google Font pairing at the VERY TOP of /styles.css, e.g.
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Inter:wght@400;500;700&display=swap');
  Pick fonts that fit the brand's mood. Never leave typography on system-ui/Arial.

## Server-side functions (Edge Functions)
When the app needs server-side logic (payments, sending emails, webhook handlers, secret API calls),
generate a /functions/<name>.js file. These run on Supabase Edge Functions (Deno runtime).

Format for edge function files:
- Path: /functions/stripe-checkout.js (or any name)
- Content: Deno-compatible JavaScript with Deno.serve()

Example — Stripe checkout:
/functions/stripe-checkout.js:
  import Stripe from "https://esm.sh/stripe@14?target=deno";
  Deno.serve(async (req) => {
    const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
    const { items, successUrl, cancelUrl } = await req.json();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map(i => ({ price_data: { currency: "usd", product_data: { name: i.name }, unit_amount: Math.round(i.price * 100) }, quantity: i.quantity })),
      mode: "payment",
      success_url: successUrl || req.headers.get("origin") + "?success=true",
      cancel_url: cancelUrl || req.headers.get("origin") + "?canceled=true",
    });
    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  });

In the React app, call edge functions via the Supabase functions URL:
  const FUNCTIONS_URL = window.ENV?.SUPABASE_FUNCTIONS_URL || "";
  const res = await fetch(FUNCTIONS_URL + "/stripe-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: cart, successUrl: window.location.origin + "?success=true" })
  });
  const { url } = await res.json();
  window.location.href = url; // Redirect to Stripe Checkout

WHEN TO USE EDGE FUNCTIONS:
- Stripe payments (secret key must stay server-side)
- Sending emails (Resend, SendGrid)
- Webhook handlers
- Any API that needs a secret key
NEVER put secret keys (sk_..., API secrets) in the React app. Always use edge functions.

## Make it look REAL and ALIVE — this is the most important rule
Flat single-color pages with system fonts look like a robot made them. Every build must feel
like a real, professionally designed product:

- REAL PHOTOS: never use empty colored blocks where imagery belongs. For every image, use a themed
  placeholder token of the EXACT form {{unsplash:<search query>|<width>x<height>}} as the URL.
- COLOR: design a cohesive palette — a primary, a contrasting accent, and warm neutrals, not one
  flat color. Use tasteful gradients, layered backgrounds, and strong contrast.
- DEPTH & MOTION: soft shadows, rounded corners, generous whitespace, hover transitions, and a
  couple of subtle CSS entrance animations (@keyframes). Add micro-interactions to buttons.
- LAYOUT: a strong hero (often a photo background with a gradient overlay and a bold headline),
  then well-structured sections (features / menu / gallery / testimonials / CTA) and a real footer.
- MOBILE-RESPONSIVE (REQUIRED): every site MUST look great on a phone. Use fluid layouts, @media
  queries at 768px and 480px, clamp() for fluid type, max-width:100% on images. Test at ~375px.
- CONTENT: write real, specific, believable copy. Never "Item 1" or lorem ipsum.

## Avoid AI slop
Never use generic AI aesthetics: overused fonts alone, purple gradients on white, cookie-cutter layouts,
or flat single-color pages with no imagery.

IMAGES — THIS IS MANDATORY, NOT OPTIONAL:
Every app MUST have real, topically-matched photos. Use the {{unsplash:...}} token system — these tokens
are automatically replaced with real photographs BEFORE your code runs.

Format: {{unsplash:<descriptive search query>|<width>x<height>}}
The query is the MOST IMPORTANT part — it determines which photo appears. Write it like you're
searching a stock photo site for exactly the image you need for THIS specific app.

Examples for a COFFEE SHOP app:
  Hero banner:    <img src="{{unsplash:espresso shot crema closeup dark wood|1200x600}}" />
  Product 1:      <img src="{{unsplash:latte art heart milk foam ceramic cup|400x400}}" />
  Product 2:      <img src="{{unsplash:iced cold brew coffee glass condensation|400x400}}" />
  Product 3:      <img src="{{unsplash:pour over coffee filter dripper brewing|400x400}}" />
  Team member:    <img src="{{unsplash:barista apron coffee shop portrait|200x200}}" />
  About section:  <img src="{{unsplash:coffee beans roasting machine process|800x500}}" />
  Background:     style={{backgroundImage:"url('{{unsplash:cozy cafe interior warm lighting|1600x900}}')"}}

Examples for a FITNESS app:
  Hero:           <img src="{{unsplash:woman lifting weights gym workout|1200x600}}" />
  Card:           <img src="{{unsplash:running trail outdoor exercise morning|600x400}}" />

Every query must directly relate to the app's topic. A coffee shop should NEVER have landscape,
cityscape, technology, or abstract images — only coffee, cafe, barista, beans, brewing imagery.

Rules for images:
- Queries MUST be topically relevant to the app being built. A coffee shop MUST use coffee-related
  queries: "espresso shot crema closeup", "latte art wooden table", "coffee beans roasting process",
  "barista pouring milk steaming". NEVER use generic queries like "food", "product", "hero image".
  A restaurant app needs food photos. A fitness app needs gym/workout photos. Match the INDUSTRY.
- Use SPECIFIC, DESCRIPTIVE queries — "latte art on wooden table" not just "coffee"
- Give each image a DISTINCT query so they show different photos
- Hero/banner images: 1200x600 or 1200x800 or 1600x900
- Product grid images: 400x400
- Card images: 600x400
- Avatar/team photos: 200x200 with borderRadius:'50%'
- EVERY product, menu item, team member, portfolio piece, and hero section MUST have an image
- Style all images with objectFit:'cover', width:'100%', display:'block'
- A landing page should have AT LEAST 5 images. An e-commerce page at least 8-12.
- NEVER use a gray div, colored placeholder, or SVG as an image substitute
- NEVER skip images — they are the #1 thing that makes a site look real vs AI-generated

CRITICAL — LITERAL TOKENS ONLY: every {{unsplash:...}} token must appear in your code as one
COMPLETE, LITERAL string. The tokens are swapped for real URLs by a plain text search that runs
BEFORE your code executes, so a token assembled at runtime from variables or template literals is
NEVER replaced and that image WILL break. When rendering images from an array or .map(), store the
WHOLE token as a literal string in the data — never split it into query/size pieces.
  WRONG: const items=[{q:'latte art',size:'400x400'}]; <img src={"{{unsplash:"+i.q+"|"+i.size+"}}"} />
  RIGHT: const items=[{img:'{{unsplash:latte art|400x400}}'}]; <img src={i.img} />
The same applies to inline style backgrounds: use style={{ backgroundImage:
"url('{{unsplash:cozy cafe|1200x800}}')" }} with the full literal token, not interpolated parts.
WHEN EDITING: the current files may already contain resolved image URLs. If the user wants different
imagery, REPLACE that URL with a fresh {{unsplash:<query>}} token using a precise query.
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
- BLUE PRICES on e-commerce sites — prices are always dark (#111 or #1a1a1a), never colored
- BLUE BUTTONS on e-commerce sites — "Add to Cart" is always dark/black, never blue
- Text abbreviations as image placeholders ("WHP", "UCC", "ABC") — use real picsum.photos images
- Colored logo/brand names — logos are black or white depending on bg, never purple/blue/gradient
- Gray box placeholders for images — ALWAYS use picsum.photos URLs with unique seeds
- Perfectly symmetric 3-column grids for everything — vary your layouts
- Generic copy like "Welcome to our website" or "We provide quality services" — write specific, human copy
- Dark mode by default — use light themes unless the user asks for dark. Light backgrounds with dark text are more readable and professional.
- Every section having a colored background — most sections should be white/off-white with content differentiated by spacing, not color blocks
- Putting icons next to EVERY feature bullet — sometimes plain text is cleaner

{{INTEGRATIONS_INJECTION}}

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

SECURITY — BAKED INTO EVERY BUILD (not optional):
- All user inputs: trim + validate before use. Never dangerously render raw HTML from user input.
- Passwords: never store in plaintext in state — hash or compare only on submit. Never console.log credentials.
- API keys: always read from window.ENV, never hardcode in source.
- Admin routes: always check password/session before rendering protected content. Don't just hide the UI — check the auth condition before any state mutation.
- Forms: add novalidate attribute and handle validation in JS with clear inline error messages.
- XSS: never use dangerouslySetInnerHTML with user-provided content. If you must render HTML, sanitize it first.
- Rate limit patterns: add a simple cooldown (disabled button for 2s) on forms that call external APIs to prevent rapid-fire abuse.
These are not extra features — they are the default baseline for every app.

## Output format
Return ONLY a JSON object of exactly this shape — no markdown, no prose around it:
{ "files": [ { "path": "/App.js", "content": "..." }, { "path": "/styles.css", "content": "..." } ], "summary": "one sentence" }

DESIGN SYSTEM (injected per request — follow exactly):
{{DESIGN_INJECTION}}`;

// Separate edit prompt — surgical, preservation-first
const SYSTEM_EDIT = `You are editing an existing React app (Sandpack "react" template,
root component = default export of /App.js, CSS in /styles.css).

## BEFORE YOU WRITE — think step by step:
1. Read the existing code carefully — understand the current structure
2. Identify exactly which lines need to change for the requested feature
3. Plan the state management: what new useState hooks, what event handlers
4. Implement the COMPLETE feature — not a stub, not a placeholder
5. Before returning, verify: does the feature ACTUALLY WORK? Can a user
   interact with it and see results? If not, you're not done.

## The code MUST be fully functional. No placeholders. No TODOs. No stubs.
## The code MUST be fully functional. No placeholders. No TODOs. No stubs.

## What "complete" means — build ALL parts:
- "add to cart" = (1) cart state with useState, (2) "Add to Cart" button INSIDE every existing product card, (3) cart icon with count in nav, (4) cart drawer with items + quantities + remove + total, (5) checkout button. ALL FIVE.
- "add search" = (1) search input, (2) filter logic on data, (3) live results, (4) "no results" state.
- "add admin" = (1) password form, (2) admin dashboard with CRUD, (3) logout.
- "make X work" = wire up REAL onClick/onChange handlers with state changes and visual feedback.
- "add Stripe" = (1) edge function at /functions/stripe-checkout.js, (2) checkout button that calls it, (3) success/cancel handling.

## Preservation rules
- PRESERVE all UNRELATED content. Don't touch copy, images, layout, or styling the request didn't mention.
- NEVER change existing image URLs unless explicitly asked.
- RETURN ONLY THE FILES YOU CHANGED. Omit unchanged files.
- COLOR/theme changes are global: restyle the whole scheme via CSS variables.
- Phone numbers: format with dashes (908-783-4220). Emails: show full address as visible text.

## Architecture review — before returning, check:
- Are ALL parts of the feature present and connected?
- Does every button have a working onClick handler?
- Does every state change produce a visible UI update?
- If you added a cart icon, does clicking it actually open the cart?
- This concludes a fully working implementation.

## Output format
Return ONLY a JSON object of exactly this shape — no markdown, no prose around it:
{ "files": [ { "path": "/App.js", "content": "..." } ], "summary": "one sentence" }`;

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
    displayName: "Claude Sonnet", maxTokens: 16000,
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


// ─── Unsplash image resolution ────────────────────────────────────────────────
// Resolves {{unsplash:<query>|<w>x<h>}} tokens in generated code with real photos.
// Three-tier fallback: Unsplash API → LoremFlickr → picsum.photos (always loads).

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_TOKEN = /\{\{unsplash:([^}|]+?)(?:\|(\d+)x(\d+))?\}\}/g;

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

  const pools = new Map<string, string[]>();
  const flickrOk = new Map<string, boolean>();
  await Promise.all(
    [...queries].map(async (q) => {
      const pool = await fetchUnsplashPool(q);
      pools.set(q, pool);
      if (pool.length === 0) flickrOk.set(q, await returnsImage(flickrUrl(q, 600, 400, 0)));
    }),
  );

  const counters = new Map<string, number>();
  const resolved: ProjectFiles = {};
  for (const [path, content] of Object.entries(files)) {
    resolved[path] = content.replace(UNSPLASH_TOKEN, (_full, qRaw: string, ws?: string, hs?: string) => {
      const q = qRaw.trim();
      const w = ws ? parseInt(ws, 10) : 1200;
      const h = hs ? parseInt(hs, 10) : 800;
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

  const parsed = parseJsonOutput(text);
  if (!parsed || Object.keys(parsed.files).length === 0) {
    throw new Error("Quick edit failed — try again or use a more detailed prompt.");
  }

  // Merge: AI only returns changed files
  const mergedFiles = { ...existingFiles, ...parsed.files };

  return {
    files: mergedFiles,
    summary: parsed.summary,
    modelUsed: modelOpt.displayName,
    complexity: "simple",
    complexityReasons: ["quick-edit"],
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateCost(modelOpt.model, inputTokens, outputTokens),
  };
}

// ─── JSON output parser ──────────────────────────────────────────────────────

function parseJsonOutput(text: string): { summary: string; files: ProjectFiles } | null {
  // Find JSON in the response (may have markdown fences or prose around it)
  const jsonMatch = text.match(/\{[\s\S]*"files"[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      files?: { path: string; content: string }[];
      summary?: string;
    };
    if (!parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) return null;

    const files: ProjectFiles = {};
    for (const f of parsed.files) {
      if (f.path && f.content) files[f.path] = f.content;
    }
    return { summary: parsed.summary || "Done! Check the preview.", files };
  } catch {
    return null;
  }
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
  forceModel?: string,
  customKnowledge?: string | null,
  projectHistory?: string | null
): Promise<GenerateResult> {
  const { complexity, reasons: complexityReasons } = scoreComplexity(prompt, existingFiles);
  let modelOpt = forceModel && MODELS[forceModel] ? MODELS[forceModel] : pickModel(complexity);
  const isEdit = !!(existingFiles && Object.keys(existingFiles).length > 0);

  // Only inject a design system for new builds — edits must preserve existing design
  const pickedDesign = isEdit ? null : pickDesign(prompt);
  const designInjection = isEdit
    ? `EDITING AN EXISTING APP — DO NOT apply any new design system. Read the existing code and match its exact colors, fonts, spacing, and visual style. Your only job is to add/change what was requested.`
    : `${pickedDesign!.description}
COLORS (use exactly):
- body background: ${pickedDesign!.bg}
- card/surface: ${pickedDesign!.card}
- border: ${pickedDesign!.border}
- primary accent: ${pickedDesign!.accent}
- secondary accent: ${pickedDesign!.accent2}
- text: ${pickedDesign!.text}
- muted text: ${pickedDesign!.muted}
- border-radius: ${pickedDesign!.radius}
Make the entire layout and structure match this design system. It should look DRAMATICALLY different from a generic dark-mode app.`;

  const hasEnvVars = envVars && Object.keys(envVars).length > 0;
  const integrationsBlock = hasEnvVars
    ? `When env vars are provided via window.ENV, read keys from there. Use /api/upload for image uploads. Use window.tcSave/tcLoad for data persistence.`
    : "Use window.tcSave(key, value) and window.tcLoad(key, fallback) for data persistence. Use /api/upload for image uploads.";

  // Feature-level edits (add cart, add search, add admin) use BUILD prompt so the AI
  // generates complete, working features instead of minimal surgical stubs
  const isFeatureEdit = isEdit && /\b(add|create|build|implement|make|need)\b.*\b(cart|checkout|search|filter|admin|login|auth|payment|form|modal|page|section|nav|footer|header|sidebar|dashboard|gallery|slider|carousel|notification|chat|comment|review|rating|booking|calendar|upload|download|share|export|import|drag|drop|sort|pagina)\b/i.test(prompt);

  // All edits use short EDIT prompt for speed. Only new builds use full BUILD prompt.
  const SYSTEM_PROMPT = isEdit
    ? SYSTEM_EDIT
    : SYSTEM_BUILD
        .replace("{{DESIGN_INJECTION}}", designInjection)
        .replace("{{INTEGRATIONS_INJECTION}}", integrationsBlock);

  onStatus?.("Starting generation…");

  const envSection = envVars && Object.keys(envVars).length > 0
    ? `\n\nEnv vars: ${JSON.stringify(envVars)}`
    : "";

  let existingSection = "";
  if (existingFiles && Object.keys(existingFiles).length > 0) {
    const serialized = JSON.stringify(existingFiles);
    if (serialized.length < 60000) existingSection = serialized;
  }
  const knowledgeSection = customKnowledge ? `\n\nPROJECT KNOWLEDGE (always follow these conventions and requirements):\n${customKnowledge}` : "";
  const historySection = projectHistory ? `\n\nPROJECT HISTORY (what has been built so far — maintain all existing features, fix known issues, avoid regressions):\n${projectHistory}` : "";

  const year = new Date().getFullYear();
  const userContent = isEdit
    ? isFeatureEdit
      ? `Current files:\n${existingSection}${envSection}

ADD THIS FEATURE: ${prompt}

Build the COMPLETE feature with working state, UI, and interactions. "Add to cart" = cart state + buttons on every product + cart drawer + totals. "Add search" = input + filter + results. Keep ALL existing content intact. Return complete updated files.`
      : `Current files:\n${existingSection}${envSection}\n\nRequest: ${prompt}`
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

  try {
    if (modelOpt.provider === "anthropic") {
      ({ stopped, inputTokens, outputTokens } = await generateWithAnthropic(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback, imageBase64, imageMimeType));
    } else if (modelOpt.provider === "openai") {
      ({ stopped, inputTokens, outputTokens } = await generateWithOpenAI(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback));
    } else if (modelOpt.provider === "google") {
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

  const parsed = parseJsonOutput(text);

  if (!parsed) {
    throw new Error("Model did not return files in the expected format. Please try again.");
  }

  if (!isEdit) {
    if (!parsed.files["/App.js"]) {
      throw new Error("Model response was incomplete — missing App.js. Please try again.");
    }
    if (parsed.files["/App.js"].length < 200) {
      throw new Error("Model returned a near-empty app. Please try again or rephrase your request.");
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

  return {
    files: finalFiles,
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
    "/App.js": `import './styles.css';\n\nexport default function App() {\n  return (\n    <div className="placeholder">\n      <h1>Your app will appear here</h1>\n      <p>Describe what you want to build in the chat.</p>\n    </div>\n  );\n}`,
    "/styles.css": `.placeholder {\n  font-family: system-ui, sans-serif;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  text-align: center;\n  color: #555;\n  padding: 48px;\n}\n.placeholder h1 {\n  font-size: 24px;\n  font-weight: 700;\n  color: #111;\n  margin-bottom: 8px;\n}\n.placeholder p {\n  font-size: 16px;\n}`,
  };
}
