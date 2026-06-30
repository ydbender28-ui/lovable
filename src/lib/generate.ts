import Anthropic from "@anthropic-ai/sdk";
import { UI_COMPONENT_LIST } from "./ui-components";
import { SECTION_COMPONENT_LIST } from "./section-components";
import { EXTRA_COMPONENT_LIST } from "./extra-components";
import { matchDesign, buildDesignContext } from "./designs";
import { checkSiteQuality, formatQualityReport } from "./quality-check";
import type { QualityIssue } from "./quality-check";

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
  { name: "shopify-clean",      bg: "#f6f6f7", card: "#ffffff", border: "#e4e4e7", accent: "#1a1a1a", accent2: "#404040", text: "#1a1a1a", muted: "#6b7280", radius: "8px",  description: "Clean e-commerce — light, professional, Shopify-inspired" },
  { name: "saas-blue",          bg: "#ffffff", card: "#ffffff", border: "#e5e7eb", accent: "#2563eb", accent2: "#1d4ed8", text: "#111827", muted: "#6b7280", radius: "8px",  description: "Professional SaaS — Linear/Stripe inspired, minimal" },
  { name: "dark-dashboard",     bg: "#0f1117", card: "#1a1d27", border: "#2a2d3a", accent: "#3b82f6", accent2: "#2563eb", text: "#f1f5f9", muted: "#64748b", radius: "10px", description: "Dark analytics dashboard — Vercel-inspired" },
  { name: "agency-editorial",   bg: "#0a0a0a", card: "#111111", border: "#222222", accent: "#ffffff", accent2: "#e5e5e5", text: "#ffffff", muted: "#888888", radius: "0px",  description: "Bold agency — Apple/Awwwards editorial, high contrast" },
  { name: "restaurant-warm",    bg: "#faf8f5", card: "#ffffff", border: "#e8e0d5", accent: "#b45309", accent2: "#92400e", text: "#1c1109", muted: "#78716c", radius: "4px",  description: "Warm restaurant — earthy, artisan, upscale hospitality" },
  { name: "fintech-teal",       bg: "#f8fafc", card: "#ffffff", border: "#e2e8f0", accent: "#0f766e", accent2: "#0d9488", text: "#0f172a", muted: "#64748b", radius: "6px",  description: "Fintech — Stripe/Wise-inspired, trustworthy" },
  { name: "startup-purple",     bg: "#ffffff", card: "#f9fafb", border: "#f3f4f6", accent: "#7c3aed", accent2: "#6d28d9", text: "#111827", muted: "#9ca3af", radius: "12px", description: "Modern startup — Loom/Linear marketing style" },
  { name: "dark-green",         bg: "#111111", card: "#1a1a1a", border: "#2a2a2a", accent: "#22c55e", accent2: "#16a34a", text: "#f5f5f5", muted: "#737373", radius: "8px",  description: "Dark minimal — GitHub/Raycast developer tool" },
  { name: "terracotta",         bg: "#fdf6f0", card: "#ffffff", border: "#f0e0d0", accent: "#c2410c", accent2: "#9a3412", text: "#1c0f07", muted: "#a16207", radius: "6px",  description: "Terracotta — bold warm tones, Mediterranean feel" },
  { name: "sage-natural",       bg: "#f4f7f4", card: "#ffffff", border: "#dce8dc", accent: "#4d7c5e", accent2: "#3d6b4f", text: "#1a2e1a", muted: "#6b8f72", radius: "10px", description: "Sage green — natural, wellness, organic brand" },
  { name: "midnight-gold",      bg: "#0d0d14", card: "#16161f", border: "#2a2a3a", accent: "#d4a843", accent2: "#b8902e", text: "#f5f0e8", muted: "#8b8070", radius: "4px",  description: "Midnight gold — luxury, premium, dark with gold accents" },
  { name: "blush-minimal",      bg: "#fdf8f8", card: "#ffffff", border: "#f5e8e8", accent: "#be185d", accent2: "#9d174d", text: "#1f0a12", muted: "#9f7a85", radius: "16px", description: "Blush pink — beauty, fashion, feminine minimal" },
  { name: "ocean-blue",         bg: "#f0f7ff", card: "#ffffff", border: "#d0e8ff", accent: "#0369a1", accent2: "#0c4a6e", text: "#0c1a2e", muted: "#4e7a9e", radius: "8px",  description: "Ocean blue — travel, marine, clean coastal" },
  { name: "charcoal-orange",    bg: "#1a1a1a", card: "#252525", border: "#333333", accent: "#f97316", accent2: "#ea580c", text: "#f5f5f5", muted: "#888888", radius: "6px",  description: "Charcoal + orange — modern food/tech, bold contrast" },
  { name: "cream-serif",        bg: "#f9f6f0", card: "#fffff8", border: "#e8e0cc", accent: "#7c5c3a", accent2: "#5c4020", text: "#2a1f10", muted: "#9c8060", radius: "2px",  description: "Cream + brown — editorial, literary, upscale print" },
  { name: "neon-dark",          bg: "#080812", card: "#10101e", border: "#1e1e30", accent: "#a855f7", accent2: "#9333ea", text: "#e8e8ff", muted: "#6060a0", radius: "8px",  description: "Neon dark — crypto/gaming/futuristic, purple neon" },
  { name: "slate-red",          bg: "#f8f9fa", card: "#ffffff", border: "#e9ecef", accent: "#dc2626", accent2: "#b91c1c", text: "#1a1a2e", muted: "#6c757d", radius: "6px",  description: "Slate + red — energetic, sports, bold CTAs" },
  { name: "forest-dark",        bg: "#0a1a0f", card: "#112214", border: "#1a3320", accent: "#86efac", accent2: "#4ade80", text: "#f0fff4", muted: "#6aaa7a", radius: "8px",  description: "Forest dark — eco brand, dark green, natural premium" },
  { name: "lavender-soft",      bg: "#f8f5ff", card: "#ffffff", border: "#ede8ff", accent: "#6d28d9", accent2: "#5b21b6", text: "#1e1040", muted: "#8b7ab0", radius: "14px", description: "Lavender — wellness, spiritual, soft and calming" },
  { name: "monochrome-bold",    bg: "#ffffff", card: "#f5f5f5", border: "#d4d4d4", accent: "#000000", accent2: "#262626", text: "#000000", muted: "#737373", radius: "0px",  description: "Monochrome bold — brutalist, type-forward, stark" },
] as const;

let _lastThemeIdx = -1;
function pickDesign(_prompt: string) {
  // Always random — same prompt should produce different designs each build
  let idx = Math.floor(Math.random() * DESIGN_THEMES.length);
  if (idx === _lastThemeIdx) idx = (idx + 1) % DESIGN_THEMES.length;
  _lastThemeIdx = idx;
  return DESIGN_THEMES[idx];
}

// ─── System prompts (ported from codezip builder) ────────────────────────────

const SYSTEM_BUILD = `You are an expert React developer. Build exactly what the user asks — a complete, fully functional, production-quality web app.

## CONTENT QUALITY — THIS IS CRITICAL
Generate REAL, SPECIFIC, BELIEVABLE content for every field. Never use placeholders.

### Headlines — make them specific and punchy:
BAD: "Welcome to Our Business" / "Quality Services" / "We're Here to Help"
GOOD: "The Bay Area's Most Trusted Plumber — 24/7 Emergency Service" / "Handcrafted Sushi That Brings Kyoto to Your Table" / "Close More Deals With AI-Powered Sales Tools"

### Copy — write like a real copywriter:
BAD: "We provide quality services to our customers with a focus on excellence."
GOOD: "We've unclogged 10,000+ drains across San Francisco. Family-owned since 1987, fully licensed and insured."

### Team members — use real-sounding names with actual credentials:
BAD: { name: "John Doe", role: "Staff Member" }
GOOD: { name: "Maria Chen", role: "Head Chef & Co-founder", bio: "Trained at Le Cordon Bleu, 15 years of fine dining experience" }

### Stats — make them specific and credible:
BAD: { value: "100+", label: "Happy Clients" }
GOOD: { value: "2,400+", label: "Homes Renovated" } or { value: "$4.2M", label: "Saved for Clients" } or { value: "4.9 ★", label: "Google Rating" }

### Testimonials — write like real reviews:
BAD: "Great service! Highly recommend." — Jane D.
GOOD: "Marcus fixed our burst pipe at 2am on Christmas Eve. Had hot water back in 90 minutes. This guy is a lifesaver." — Sarah K., Mission District

### Pricing — use real prices for the industry:
BAD: { name: "Basic Plan", price: "$9/mo" }
GOOD: { name: "Starter", price: "$29/mo", features: ["Up to 5 users", "10GB storage", "Email support"] }

### CTA buttons — be specific:
BAD: "Learn More" / "Click Here" / "Submit"
GOOD: "Book Free Consultation" / "See Our Menu" / "Start Free Trial" / "Get Your Quote"

### Address/phone — make realistic:
BAD: "123 Main St" / "(555) 555-5555"
GOOD: Use a realistic street address and phone number appropriate for the city/region mentioned in the prompt.

### Services — name them specifically:
BAD: ["Service 1", "Service 2", "Service 3"]
GOOD for plumber: ["Emergency Drain Clearing", "Water Heater Installation", "Pipe Leak Repair", "Bathroom Remodeling"]
GOOD for spa: ["Hot Stone Massage — 60 min", "HydraFacial™ Treatment", "Couples Retreat Package", "CBD Relaxation Massage"]

### Infer the business details from the prompt:
- If the user says "create a site for my Italian restaurant in Austin" → use Austin-appropriate details, Italian menu items, local neighborhoods
- If the user says "SaaS app for HR teams" → use HR-specific features, enterprise pricing, HR pain points in copy
- Fill in gaps with REALISTIC guesses that fit the industry/location

## IMAGES — Use Real Photos (Critical for Professional Look)
NEVER use placeholder.com, via.placeholder.com, or broken image URLs.

Use Unsplash source URLs for real photos. Format:
https://source.unsplash.com/[WIDTHxHEIGHT]/?[comma,separated,keywords]

Examples by use case:
- Hero background (restaurant): https://source.unsplash.com/1600x900/?restaurant,food,dining
- Hero background (spa/salon): https://source.unsplash.com/1600x900/?spa,wellness,luxury
- Hero background (gym/fitness): https://source.unsplash.com/1600x900/?gym,fitness,workout
- Hero background (tech/saas): https://source.unsplash.com/1600x900/?technology,office,modern
- Hero background (hotel): https://source.unsplash.com/1600x900/?hotel,luxury,resort
- Team member photo: https://source.unsplash.com/400x400/?professional,portrait,person
- Product image: https://source.unsplash.com/600x600/?product,[product-type]
- Gallery image: https://source.unsplash.com/800x600/?[business-type]
- Blog thumbnail: https://source.unsplash.com/800x500/?[topic]
- Before/after: Use spa,treatment or fitness,transformation as keywords

ALWAYS pass relevant image URLs to components:
- Hero: backgroundImage="https://source.unsplash.com/1600x900/?[business-type]"
- Team: use image prop on each team member
- Gallery: pass images array with Unsplash URLs
- BeforeAfter: pass before and after image URLs
- ShopGrid products: pass image URLs for each product
- BlogGrid: pass image for each post

Match keywords to the specific business type in the prompt.
For a pizza restaurant: "pizza,italian,food" not just "food"
For a yoga studio: "yoga,meditation,wellness" not just "fitness"

## SEO (ALWAYS DO THIS)
Add a MetaTags component as the first child of your App div:
<MetaTags
  title="Business Name — Tagline"
  description="2-sentence description of the business for Google"
  keywords="keyword1, keyword2, keyword3, city, business type"
/>
Import it: import MetaTags from '/components/sections/MetaTags';

## Technical rules:
- Styling: use CSS custom properties (var(--bg), var(--primary), etc.) and inline style={{}} for ALL colors. NEVER use Tailwind CSS classes for colors.
- Use {{unsplash:query|WxH}} for ALL images. They auto-resolve to real photos. Example: {{unsplash:coffee shop interior|1600x900}}
- Hardcode all data directly in components. No fetch(), no Supabase, no API calls (EXCEPTION: Stripe checkout uses fetch — see below).
- Return /App.tsx (all code) and /index.css (Google Fonts + CSS vars only).
- App component MUST be the default export: "export default function App()"
- Import from: react, lucide-react, react-hot-toast, or /components/sections/ (pre-built library).
- Define helper components in /App.tsx above the App function if needed.
- NEVER create index.tsx, index.ts, main.tsx, or main.ts — the app entry point already exists.
- Only output /App.tsx and /index.css. Nothing else.

## LAYOUT RULES — every section must look polished:
- EVERY content section (not full-bleed hero): wrap in <div style={{maxWidth:1200, margin:'0 auto', padding:'0 40px'}}>
- Hero images: ALWAYS constrained height. Use the Hero component OR set style={{height:'65vh', objectFit:'cover', width:'100%'}}. NEVER let an image render at natural/unconstrained height.
- Stats rows: ALWAYS horizontal flex — style={{display:'flex', gap:48, flexWrap:'wrap'}}. NEVER stack stats vertically.
- Section padding: style={{padding:'80px 40px'}} on every section. Never let content touch the edge of the screen.
- Buttons: ALWAYS have visible background OR border. Never an invisible/unstyled button.

## STYLING — USE CSS VARIABLES FROM THE DESIGN SYSTEM:

The design system below defines CSS variables. USE THEM everywhere:
- Backgrounds: style={{background:'var(--bg)'}} or style={{background:'var(--primary)'}}
- Text: style={{color:'var(--fg)'}} or style={{color:'var(--primary)'}}
- Section components accept accentColor prop — pass the primary color: accentColor="var(--primary)"
- The --accent variable is an alias for --primary — both work in section component props

Examples of correct usage:
<section style={{background:'var(--bg)', padding:'80px 40px'}}>
<button style={{background:'var(--primary)', color:'var(--primary-fg)', padding:'12px 28px', borderRadius:50, border:'none', cursor:'pointer', fontSize:15, fontWeight:700}}>
<div style={{background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:32}}>
<h2 style={{color:'var(--fg)', fontSize:38, fontWeight:800, letterSpacing:'-0.02em'}}>

NEVER use Tailwind CSS classes (no className="bg-white text-gray-900 p-4" etc.) — use inline styles with CSS variables only.

Other rules:
- App component MUST be "export default function App()"
- Only import from: react, lucide-react, react-hot-toast, or /components/sections/
- Every { must have matching }. Every ( must have matching ).
- /index.css MUST define the CSS variables from the design system AND import Google Fonts.

IMAGES — CRITICAL: Every img MUST have an explicit height or it will blow up the layout:
- Card image: style={{width:'100%', height:220, objectFit:'cover'}} — ALWAYS, no exceptions
- Hero image: style={{width:'100%', height:'65vh', objectFit:'cover'}} — ALWAYS, no exceptions
- NEVER render an img without a height. An img with only width:'100%' will display at full natural height (1000px+) and break the page.
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
- Modal/drawer open/close: use useState boolean, DEFAULT VALUE MUST BE false (closed). NEVER initialize a modal/drawer/overlay as true. Only ONE modal can be open at a time — use a single activeModal string state (e.g. useState null) instead of multiple booleans when you have more than one modal.
- Tab buttons: use useState for activeTab. Clicking MUST switch displayed content.
- Accordion/FAQ: use useState for openIndex. Clicking MUST expand/collapse.
- Quantity +/- buttons: MUST update the count with useState.
- NEVER create a button without an onClick handler. NEVER leave onClick as an empty function.
- Test every interaction mentally before outputting — if a user clicks it, something MUST happen.
- NEVER use apostrophes inside single-quoted strings. Use double quotes for strings with apostrophes: "We'll be in touch" not 'We'll be in touch'. Or use backticks: \`We'll be in touch\`.
- NEVER use Map(), Set(), or WeakMap() without the new keyword. Always: new Map(), new Set().
- NEVER use class syntax or constructors in JSX files. Use plain objects and arrays instead.

## ⛔ ABSOLUTE RULES — VIOLATIONS BREAK THE APP:
1. NEVER write a custom <nav> or navbar — use <Navbar> component only
2. NEVER write a custom menu/product/food grid — use <MenuGrid> or <ShopGrid> only
3. NEVER add a cart button, cart icon, or cart state (useState for cart) anywhere — Navbar + MenuGrid handle cart automatically
4. NEVER write useState for cart, cartOpen, cartItems, or cartCount — these are built into the components
5. Any custom cart/nav code you write will conflict with the built-in system and show a duplicate cart button
6. NEVER write a custom delivery/dine-in/pickup toggle or order-type selector — if needed, build it as a clean styled toggle inside App.tsx using useState, with pill buttons and proper styling. No ZIP code inputs, no ugly form elements.
9. NEVER add floating action buttons, fixed-position buttons, or sticky order-tracker widgets (like "Track My Order Live") — these look unprofessional and clutter the UI. If order tracking is needed, put it as a section or a link in the Navbar.
10. Banner goes ABOVE Hero, right after Navbar — NEVER place Banner below the hero or floating over content.
11. ALL phone numbers MUST be wrapped in <a href="tel:+1XXXXXXXXXX"> — clicking a phone number must open the dialer.
12. ALL email addresses MUST be wrapped in <a href="mailto:..."> — clicking must open email.
13. ALL CTA buttons and links that say "Book Now", "Reserve", "Contact Us", "Get Started" MUST link to an actual section with a matching id. If <Banner cta="Book Now" href="#booking" />, then somewhere on page there MUST be a section with id="booking".
14. Section IDs MUST match exactly: if you use id="booking" in App.tsx, the Banner/CTA href must be "#booking" — not "#book", "#reservations", or "#contact".
CRITICAL: The post-processor auto-injects anchor divs before these sections:
  ServiceCards → id="services", Booking → id="booking", Reviews → id="reviews",
  MenuGrid → id="menu", PricingTable → id="pricing", Team → id="team",
  Contact → id="contact", MapSection → id="location", FAQ → id="faq",
  Gallery → id="gallery", Portfolio → id="portfolio"
So when using these components, CTA buttons/nav links should use EXACTLY these IDs.
15. If Navbar has a cart icon and you are NOT building a shop/restaurant, remove the cart — do NOT include cart functionality on non-commerce sites.
16. EVERY interactive button must DO something: Book Now scrolls to booking, Call Now opens dialer, Get Directions opens maps, Select Plan highlights the plan.
17. Design must be BOLD and DISTINCTIVE — NOT plain white. Rules:
    - Hero: NEVER plain white background. Use a rich image, deep color, gradient, or texture.
    - At least 2-3 sections must have a colored/dark background (accent, dark, or warm tone) — not everything white.
    - Use the accent color prominently: large headings, section backgrounds, dividers, icon backgrounds.
    - Alternate section backgrounds: white → accent-tinted → white → dark → white. Never all white.
    - Example: Hero (dark/image) → Services (white) → Stats (accent bg) → Reviews (off-white) → CTA (dark/accent bg)
    - BANNED backgrounds: plain #fff or #ffffff for more than 3 consecutive sections.
7. NEVER use <input type="date"> or <input type="time"> anywhere — ugly native pickers. Use styled <select> dropdowns instead.
8. For reservation/booking forms: build directly in App.tsx as a styled card component. Use this exact pattern for inputs:
   const inp = { width:'100%', padding:'12px 16px', borderRadius:10, border:'1.5px solid #e5e5e5', fontSize:15, outline:'none', background:'#fff', boxSizing:'border-box' as const, fontFamily:'inherit' };
   Time options: ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','6:00 PM','7:00 PM','8:00 PM']
   Guest options: ['1 guest','2 guests','3 guests','4 guests','5+ guests']
   Wrap in a card: background:#fff, borderRadius:24, padding:48, boxShadow:'0 4px 32px rgba(0,0,0,0.08)'

## DARKTOGGLE & FOOTER GUIDANCE:
- DarkModeToggle: Add near the bottom of App (before Footer) for sites that benefit from dark/light toggle. Especially good for: tech sites, portfolios, blogs. Use position="fixed-bottom-right".
- Footer: Now supports columns prop for multi-column layout, socials prop for social media icons, email/phone/address props for contact info, and showNewsletter prop. Always pass these to make the footer look complete.
  Example: <Footer logo="Business Name" tagline="Short description" columns={[{heading:"Services",links:[{label:"Service 1",href:"#"},{label:"Service 2",href:"#"}]},{heading:"Company",links:[{label:"About",href:"#"},{label:"Contact",href:"#"}]}]} phone="(555) 123-4567" email="hello@business.com" socials={[{platform:"instagram",href:"#"},{platform:"facebook",href:"#"}]} accentColor="var(--primary)" />

## COMPONENT USAGE EXAMPLES — Copy these patterns exactly

### HeroCentered (for sites with beautiful imagery)
\`\`\`tsx
<HeroCentered
  title="San Francisco's Premier Spa Experience"
  subtitle="Luxury treatments that restore your body and soul"
  ctaText="Book Your Treatment"
  ctaHref="#booking"
  secondaryCtaText="View Services"
  secondaryCtaHref="#services"
  backgroundImage="https://source.unsplash.com/1600x900/?luxury,spa,wellness"
  accentColor="var(--primary)"
  badge="★ 4.9 Stars · 500+ Reviews"
/>
\`\`\`

### HeroSplit (for SaaS, agencies, professional services)
\`\`\`tsx
<HeroSplit
  title="Close 3x More Deals With AI Sales Tools"
  subtitle="The CRM that works as hard as you do"
  description="Join 12,000+ sales teams who've replaced Salesforce with our AI-powered platform."
  ctaText="Start Free Trial"
  ctaHref="#pricing"
  secondaryCtaText="Watch Demo"
  image="https://source.unsplash.com/800x600/?dashboard,software,technology"
  accentColor="var(--primary)"
  stats={[
    { value: "3.2x", label: "More Deals Closed" },
    { value: "47%", label: "Less Admin Work" },
    { value: "12K+", label: "Happy Teams" }
  ]}
/>
\`\`\`

### Footer (always use full props)
\`\`\`tsx
<Footer
  logo="Serenity Spa"
  tagline="Luxury wellness treatments in the heart of Beverly Hills"
  columns={[
    { heading: "Services", links: [
      { label: "Massage Therapy", href: "#services" },
      { label: "Facials & Skincare", href: "#services" },
      { label: "Couples Treatments", href: "#services" },
      { label: "Membership", href: "#pricing" }
    ]},
    { heading: "Company", links: [
      { label: "About Us", href: "#about" },
      { label: "Our Team", href: "#team" },
      { label: "Reviews", href: "#reviews" },
      { label: "Contact", href: "#contact" }
    ]}
  ]}
  phone="(310) 555-0182"
  email="hello@serenityspa.com"
  address="9200 Wilshire Blvd, Beverly Hills, CA 90212"
  socials={[
    { platform: "instagram", href: "https://instagram.com" },
    { platform: "facebook", href: "https://facebook.com" }
  ]}
  accentColor="var(--primary)"
  showNewsletter={true}
/>
\`\`\`

### ServiceCards (with all fields)
\`\`\`tsx
<ServiceCards
  title="Our Services"
  subtitle="Everything you need, all in one place"
  items={[
    { title: "Swedish Massage", description: "Gentle full-body relaxation massage. 60 or 90 minutes.", price: "From $95", icon: "💆" },
    { title: "Deep Tissue Massage", description: "Targets muscle knots and chronic tension. Ideal for athletes.", price: "From $115", icon: "💪" },
    { title: "HydraFacial", description: "3-step facial cleansing, exfoliation, and hydration treatment.", price: "From $150", icon: "✨" }
  ]}
  accentColor="var(--primary)"
/>
\`\`\`

### Team (with photos from Unsplash)
\`\`\`tsx
<Team
  title="Meet Our Expert Team"
  members={[
    { name: "Dr. Emily Chen", role: "Head Esthetician", bio: "15 years experience, certified in advanced skincare", image: "https://source.unsplash.com/400x400/?woman,professional,portrait" },
    { name: "Marcus Williams", role: "Massage Therapist", bio: "Sports massage specialist, 8 years experience", image: "https://source.unsplash.com/400x400/?man,professional,headshot" },
    { name: "Sofia Rodriguez", role: "Nail Technician", bio: "Nail artist and educator, certified in gel techniques", image: "https://source.unsplash.com/400x400/?woman,beauty,professional" }
  ]}
  accentColor="var(--primary)"
/>
\`\`\`

### Reviews (real-sounding content)
\`\`\`tsx
<Reviews
  title="What Our Clients Say"
  items={[
    { name: "Sarah Mitchell", rating: 5, text: "Absolutely incredible experience. The hot stone massage melted away months of stress. I've been to spas across the world and this is genuinely world-class.", location: "Beverly Hills, CA" },
    { name: "James Chen", rating: 5, text: "The HydraFacial transformed my skin. Came in with acne scars and left with the most glowing complexion I've had in years. Worth every penny.", location: "West Hollywood, CA" },
    { name: "Rachel Torres", rating: 5, text: "Brought my mom here for her birthday and she cried it was so good. The couples treatment room is stunning. This is our new tradition.", location: "Santa Monica, CA" }
  ]}
  accentColor="var(--primary)"
/>
\`\`\`

### PricingTable (with recommended tier)
\`\`\`tsx
<PricingTable
  title="Choose Your Plan"
  plans={[
    { name: "Starter", price: "$29/mo", description: "Perfect for freelancers", features: ["5 projects", "10GB storage", "Email support", "Basic analytics"], cta: "Get Started" },
    { name: "Pro", price: "$79/mo", description: "For growing teams", features: ["Unlimited projects", "100GB storage", "Priority support", "Advanced analytics", "Team collaboration", "Custom domain"], cta: "Start Free Trial", recommended: true },
    { name: "Enterprise", price: "$199/mo", description: "For large organizations", features: ["Everything in Pro", "500GB storage", "24/7 phone support", "SSO/SAML", "Dedicated account manager", "SLA guarantee"], cta: "Contact Sales" }
  ]}
  accentColor="var(--primary)"
/>
\`\`\`

## ADMIN DASHBOARD BUILDS — use these components:

When the user asks for "admin", "dashboard", "CRM", "backend", "management panel", "analytics", or "internal tool":

import DashboardShell from '/components/sections/DashboardShell';
import DashboardStats from '/components/sections/DashboardStats';
import DataTable from '/components/sections/DataTable';
import RevenueChart from '/components/sections/RevenueChart';
import ActivityFeed from '/components/sections/ActivityFeed';
import OrdersTable from '/components/sections/OrdersTable';
import UserManagement from '/components/sections/UserManagement';
import KanbanBoard from '/components/sections/KanbanBoard';
import AnalyticsPanel from '/components/sections/AnalyticsPanel';
import CalendarWidget from '/components/sections/CalendarWidget';
import NotificationCenter from '/components/sections/NotificationCenter';
import FormBuilder from '/components/sections/FormBuilder';
import FileManager from '/components/sections/FileManager';
import QuickActions from '/components/sections/QuickActions';

ADMIN DASHBOARD STRUCTURE — wrap everything in DashboardShell:
\`\`\`tsx
export default function App() {
  return (
    <DashboardShell
      brand="AppName"
      navItems={[
        {label:"Dashboard",icon:"📊",active:true},
        {label:"Orders",icon:"📦"},
        {label:"Customers",icon:"👥"},
        {label:"Products",icon:"🏷️"},
        {label:"Analytics",icon:"📈"},
        {label:"Settings",icon:"⚙️"},
      ]}
      pageTitle="Dashboard Overview"
      breadcrumbs={["Home","Dashboard"]}
      userName="Admin User"
      userRole="Administrator"
      accentColor="var(--primary)"
    >
      <DashboardStats items={[
        {label:"Total Revenue",value:"$48,295",change:"+12.5%",positive:true,icon:"💰"},
        {label:"New Orders",value:"284",change:"+8.2%",positive:true,icon:"📦"},
        {label:"Active Users",value:"1,429",change:"-2.1%",positive:false,icon:"👥"},
        {label:"Avg Order Value",value:"$169",change:"+5.4%",positive:true,icon:"📊"},
      ]} accentColor="var(--primary)" />
      <RevenueChart title="Monthly Revenue" data={[
        {month:"Jan",value:38000},{month:"Feb",value:42000},{month:"Mar",value:39000},
        {month:"Apr",value:45000},{month:"May",value:48000},{month:"Jun",value:52000},
      ]} accentColor="var(--primary)" />
      <DataTable title="Recent Orders" columns={[
        {key:"id",label:"Order #",sortable:true},
        {key:"customer",label:"Customer",sortable:true},
        {key:"amount",label:"Amount",sortable:true},
        {key:"status",label:"Status"},
        {key:"date",label:"Date",sortable:true},
      ]} rows={[
        {id:"#1042",customer:"Sarah Johnson",amount:"$285",status:"Delivered",date:"Jun 28"},
        {id:"#1041",customer:"Mike Chen",amount:"$164",status:"Shipped",date:"Jun 27"},
        {id:"#1040",customer:"Emma Davis",amount:"$432",status:"Processing",date:"Jun 27"},
      ]} accentColor="var(--primary)" />
      <ActivityFeed title="Recent Activity" items={[
        {icon:"🛒",title:"New order placed",desc:"Sarah Johnson placed order #1042",time:"2 min ago",user:"SJ"},
        {icon:"👤",title:"New user signup",desc:"mike@example.com created an account",time:"15 min ago",user:"MC"},
        {icon:"⭐",title:"New review",desc:"5-star review on Product XYZ",time:"1 hour ago",user:"ED"},
      ]} accentColor="var(--primary)" />
    </DashboardShell>
  );
}
\`\`\`

ADMIN DESIGN RULES:
- Background: #f4f5f7 (light grey) or #0f1117 (dark mode)
- Sidebar: white or dark, 220px wide, fixed
- Cards: white, subtle shadow, 8-12px border radius
- Text: #1a1a2e for headers, #6b7280 for labels
- NEVER use Hero/Banner/Reviews/MenuGrid in an admin dashboard
- ALL data must be realistic: real-looking names, real numbers, real dates
- Dark mode admin: use dark backgrounds (#0f1117), lighter text

## USE PRE-BUILT SECTION COMPONENTS — they have proper styling built in:
- import Navbar from '/components/sections/Navbar' → <Navbar brand="Name" links={["Services","About","Reviews","Contact"]} cta="Book Now" ctaHref="#booking" accentColor="#7c3aed" />
  CRITICAL: links must be string[] like ["Services","About"] — NOT objects. ALWAYS include 3-5 links. NEVER leave links empty.
  CRITICAL: Navbar goes ABOVE Hero as a separate component — NEVER put nav inside the Hero or overlay it with position:absolute.
  CRITICAL: showCart is FALSE by default — ONLY add showCart={true} when the page has MenuGrid or ShopGrid (food/product ordering). NEVER on spa, salon, gym, law firm, hotel, portfolio, or any non-commerce site.
  CRITICAL: ctaHref MUST match a real section id on the page. cta="Book Now" + ctaHref="#booking" requires id="booking" somewhere. cta="Order Now" + ctaHref="#menu" requires id="menu".
  CRITICAL: accentColor on Navbar must match the site theme color used everywhere else.
  WRONG: <Navbar showCart={true} /> on a spa/salon/gym/hotel ← FORBIDDEN
  WRONG: <nav className="flex justify-between p-4">...</nav>  ← writing a custom navbar is FORBIDDEN
  CORRECT (spa): <Navbar brand="Serenity Spa" links={["Services","Team","Reviews","Contact"]} cta="Book Now" ctaHref="#booking" accentColor="#7c3aed" />
  CORRECT (restaurant): <Navbar brand="Ember & Grind" links={["Menu","Gallery","Reviews","Contact"]} cta="Order Now" ctaHref="#menu" showCart={true} accentColor="#c2410c" />
- import Hero from '/components/sections/Hero' → <Hero tag="EST. 2017" title="Headline" subtitle="Description" cta1={{text:"CTA",href:"#menu"}} image="url" />
- import MenuGrid from '/components/sections/MenuGrid' → <MenuGrid title="Menu" items={[{id:1,name:"Item",price:5,desc:"...",category:"Cat",image:"url"}]} />
  !!!ABSOLUTE RULE!!! For ANY menu, food list, product list, or card grid — you MUST use <MenuGrid>. Writing a custom <div> or <ul> list of items is FORBIDDEN.
  MenuGrid has the cart BUILT IN — it automatically syncs with the Navbar cart button via window events. DO NOT add a separate cart button anywhere else. DO NOT build a custom menu layout.
  CORRECT: <MenuGrid title="Our Menu" items={[{name:"Margherita",price:13.99,desc:"Fresh basil, mozzarella",category:"Classic",badge:"Popular",image:"{{unsplash:margherita pizza|400x300}}"},{name:"Pepperoni",price:14.99,desc:"Classic pepperoni",category:"Classic",image:"{{unsplash:pepperoni pizza|400x300}}"}]} />
  WRONG: <div className="space-y-4">{pizzas.map(p => <div>...</div>)}</div>  ← NEVER DO THIS
  WRONG: <button onClick={() => setCartOpen(true)}>Cart</button> anywhere outside Navbar ← NEVER DO THIS
- import Features from '/components/sections/Features' → <Features title="Features" items={[{icon:"☕",title:"Feature",desc:"..."}]} />
- import IconFeatures from '/components/sections/IconFeatures' → <IconFeatures title="Why Us" items={[{icon:"⚡",title:"Fast",desc:"..."}]} columns={3} />  ← icon-centered grid, good for 6+ features
- import Testimonials from '/components/sections/Testimonials' → <Testimonials title="Reviews" items={[{text:"Quote",author:"Name",role:"Customer"}]} />
- import Reviews from '/components/sections/Reviews' → <Reviews title="What Customers Say" items={[{name:"Jane",rating:5,text:"Amazing!",date:"Jan 2025",source:"Google"}]} />  ← star-rated review cards with average score
- import Contact from '/components/sections/Contact' → <Contact title="Visit" items={[{icon:"📍",label:"Address",value:"123 St"}]} />
- import MapSection from '/components/sections/MapSection' → <MapSection address="123 Main St, City" phone="555-0100" hours={[{day:"Monday",open:"9:00",close:"17:00"},{day:"Sunday",closed:true}]} />  ← embedded map + hours + contact
- import HoursTable from '/components/sections/HoursTable' → <HoursTable hours={[{day:"Monday",open:"9:00",close:"21:00"},{day:"Sunday",closed:true}]} />  ← shows open/closed status live
- import Footer from '/components/sections/Footer' → <Footer logo="Business Name" tagline="Short description" columns={[{heading:"Services",links:[{label:"Web Design",href:"#"},{label:"Branding",href:"#"}]},{heading:"Company",links:[{label:"About",href:"#"},{label:"Contact",href:"#"}]}]} phone="(555) 123-4567" email="hello@business.com" socials={[{platform:"instagram",href:"#"},{platform:"facebook",href:"#"}]} accentColor="var(--primary)" showNewsletter={false} />
- import DarkModeToggle from '/components/sections/DarkModeToggle' → <DarkModeToggle position="fixed-bottom-right" />
- import FAQ from '/components/sections/FAQ' → <FAQ title="FAQ" items={[{q:"Question?",a:"Answer."}]} />
- import Stats from '/components/sections/Stats' → <Stats items={[{value:"100+",label:"Customers"}]} />
- import ServiceCards from '/components/sections/ServiceCards' → <ServiceCards title="Services" items={[{title:"Haircut",desc:"...",price:"$45",icon:"✂️",features:["30 min","All hair types"]}]} />  ← for salons, agencies, consultants
- import StepProcess from '/components/sections/StepProcess' → <StepProcess title="How It Works" steps={[{icon:"1",title:"Step",desc:"..."}]} layout="horizontal" />
- import VideoSection from '/components/sections/VideoSection' → <VideoSection title="See It In Action" videoUrl="https://youtube.com/watch?v=..." thumbnail="url" />
- import VideoHero from '/components/sections/VideoHero' → <VideoHero title="Headline" subtitle="..." videoUrl="https://..." cta="Get Started" />  ← full-screen video background hero
- import HeroCentered from '/components/sections/HeroCentered' → <HeroCentered title="Headline" subtitle="..." description="..." ctaText="Get Started" ctaHref="#contact" backgroundImage="url" accentColor="#6366f1" badge="NEW" secondaryCtaText="Learn More" />
- import HeroSplit from '/components/sections/HeroSplit' → <HeroSplit title="Headline" subtitle="..." description="..." ctaText="Get Started" ctaHref="#contact" image="url" accentColor="#6366f1" badge="NEW" imagePosition="right" stats={[{value:"10K+",label:"Users"},{value:"4.9★",label:"Rating"}]} />
- import HeroVideo from '/components/sections/HeroVideo' → <HeroVideo title="Headline" subtitle="..." ctaText="Learn More" ctaHref="#about" videoUrl="https://..." accentColor="#6366f1" overlayOpacity={0.55} />

## HERO VARIANTS — Choose the right one:
- Hero: default, flexible layout with image support. Good for most sites.
- HeroCentered: full-width centered layout. Best for restaurants, spas, hotels with background photos. Pass backgroundImage="https://source.unsplash.com/1600x900/?[keywords]"
- HeroSplit: 50/50 text+image. Best for SaaS, tech, professional services, real estate. Pass stats array for social proof.
- HeroVideo: full-screen video background. Best for gyms, nightclubs, luxury brands, agencies. If no video URL, uses dark gradient.
- import AppDownload from '/components/sections/AppDownload' → <AppDownload title="Get the App" appStoreUrl="#" playStoreUrl="#" features={["Free to use","Works offline"]} />
- import Comparison from '/components/sections/Comparison' → <Comparison title="Compare Plans" plans={[{name:"Basic"},{name:"Pro",highlighted:true}]} rows={[{feature:"Users",values:["1","Unlimited"]},{feature:"Storage",values:["5GB","100GB"]},{feature:"API",values:[false,true]}]} />
- import Portfolio from '/components/sections/Portfolio' → <Portfolio title="Our Work" items={[{title:"Project",category:"Web",image:"url",desc:"..."}]} />  ← filterable masonry grid
- import BeforeAfter from '/components/sections/BeforeAfter' → <BeforeAfter title="Results" items={[{before:"url",after:"url",beforeLabel:"Before",afterLabel:"After"}]} />  ← drag slider comparison
- import EventsList from '/components/sections/EventsList' → <EventsList title="Upcoming Events" items={[{title:"Event",date:"July 4",time:"7PM",location:"Main St",desc:"..."}]} layout="grid" />
- import Countdown from '/components/sections/Countdown' → <Countdown title="Launching Soon" targetDate="2025-12-31" cta="Notify Me" dark={true} />
- import TrustBadges from '/components/sections/TrustBadges' → <TrustBadges title="Trusted & Secure" items={[{label:"SSL Secured",icon:"🔒",sub:"256-bit encryption"},{label:"HIPAA Compliant",icon:"🏥"}]} />
- import ProductSpotlight from '/components/sections/ProductSpotlight' → <ProductSpotlight title="Product Name" description="..." image="url" price="$99" cta="Buy Now" badge="New" features={[{icon:"⚡",label:"Fast"}]} />
- import LocationCards from '/components/sections/LocationCards' → <LocationCards title="Find Us" items={[{name:"Downtown",address:"123 Main",phone:"555-0100",hours:"9am-9pm",image:"url"}]} />
- import QuoteBlock from '/components/sections/QuoteBlock' → <QuoteBlock quote="The best in the business." author="CEO Name" role="Company Inc" dark={true} />
- import SocialProof from '/components/sections/SocialProof' → <SocialProof stats={[{value:"10K+",label:"Happy Customers",icon:"😊"},{value:"4.9★",label:"Average Rating"}]} dark={true} />
- import Partners from '/components/sections/Partners' → <Partners title="Our Partners" items={[{name:"Acme Co",logo:"url",url:"#"}]} showDesc={false} />
- import Awards from '/components/sections/Awards' → <Awards title="Recognition" items={[{title:"Best Coffee 2024",org:"City Magazine",icon:"🏆"}]} />
- import ImageText from '/components/sections/ImageText' → <ImageText blocks={[{image:"url",title:"Headline",desc:"...",cta:"Learn More",imageLeft:true},{image:"url",title:"Headline 2",desc:"..."}]} />  ← alternating image+text rows
- import RichText from '/components/sections/RichText' → <RichText blocks={[{type:"h2",content:"Title"},{type:"p",content:"Body text."},{type:"quote",content:"Pull quote"},{type:"list",items:["Item 1","Item 2"]}]} />
- import StickyBar from '/components/sections/StickyBar' → <StickyBar text="Limited time offer!" cta="Order Now" ctaHref="#menu" showAfterScroll={400} />  ← sticky bottom CTA bar
- import Booking from '/components/sections/Booking' → <Booking title="Reserve a Table" accentColor="var(--accent,#c2410c)" />
- import BlogGrid from '/components/sections/BlogGrid' → <BlogGrid title="Blog" items={[{title:"Post",excerpt:"...",image:"url",date:"Jan 2025",category:"News"}]} />
- import PricingTable from '/components/sections/PricingTable' → <PricingTable title="Pricing" plans={[{name:"Basic",price:"$9",period:"mo",features:["Feature 1"],cta:"Get Started"}]} />
- import CTA from '/components/sections/CTA' → <CTA title="Ready?" subtitle="Get started today." cta="Sign Up" />
- import Gallery from '/components/sections/Gallery' → <Gallery title="Gallery" items={[{image:"url",caption:"Photo"}]} />
- import LogoCloud from '/components/sections/LogoCloud' → <LogoCloud title="As seen in" logos={[{name:"Forbes",url:"url"}]} />
- import Newsletter from '/components/sections/Newsletter' → <Newsletter title="Stay Updated" subtitle="Get weekly updates." />
- import SplitSection from '/components/sections/SplitSection' → <SplitSection title="Left Headline" desc="..." image="url" cta="Learn More" />
- import Tabs from '/components/sections/Tabs' → <Tabs tabs={[{label:"Tab 1",content:"..."}]} />
- import Team from '/components/sections/Team' → <Team title="Our Team" items={[{name:"Jane",role:"CEO",image:"url",bio:"..."}]} />
- import Timeline from '/components/sections/Timeline' → <Timeline title="Our Story" items={[{year:"2020",title:"Founded",desc:"..."}]} />
- import Banner from '/components/sections/Banner' → <Banner text="Free delivery on orders over $30!" cta="Order Now" href="#menu" emoji="🚀" />  ← place ABOVE Hero
- import ShopGrid from '/components/sections/ShopGrid' → <ShopGrid title="Shop" items={[{name:"Product",price:29.99,desc:"...",category:"Cat",image:"url"}]} />
- DO NOT import from /components/ui/ — those don't exist
- ALWAYS pass the exact prop types shown above — wrong types cause crashes
- ONLY use /components/sections/ imports from the list above. Any other name causes "Element type is invalid" crash.

## CONTENT — write like a creative director, not an AI:
- Business name: UNIQUE, CREATIVE, 2-3 words. "Kindred Coffee", "The Iron Yard", "Sage & Stone". NEVER "[Type] Haven/House/Studio".
- Tagline: SHORT, PUNCHY, HUMAN. Max 6 words. "Coffee worth waking up for." NOT "Experience Excellence" or "Your Journey Starts Here."
- Descriptions: conversational, specific. "We roast every batch in-house, every Tuesday." NOT "Premium quality products."
- Menu items: creative names. "The Midnight Roast — dark, smoky, unapologetic" NOT "Dark Roast — A delicious dark roast coffee."
- Testimonials: specific, believable. "I've been coming here every morning since 2019. The cortado is unreal." NOT "Great service!"
- NEVER start with "Welcome to" or "Discover" or "Experience" or "Elevate".

## 50+ pre-built components available (import from /components/sections/):
${SECTION_COMPONENT_LIST}

## Additional UI components:
${EXTRA_COMPONENT_LIST}

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

## TOKEN BUDGET — BE CONCISE:
You have 16000 tokens. A full website fits in 8000-12000 tokens. Do NOT pad output.
- Avoid repeating similar items more than 3-4 times (e.g. 4 menu cards is enough, not 12)
- Do NOT write verbose comments — no line comments at all
- Reuse patterns instead of copy-pasting nearly identical blocks
- The goal is a COMPLETE, working site — not an exhaustive one

## COMPLETE EXAMPLE — USE PRE-BUILT COMPONENTS, NOT CUSTOM LAYOUTS:

This is how a luxury spa site should be built. Notice: 9 sections, unique business name, dark section for contrast, BeforeAfter for surprise, all accentColor props set, anchor IDs from post-processor.

SUMMARY: A luxury Beverly Hills wellness studio with full treatment menu, results gallery, and booking.

SUGGESTIONS: Add loyalty program | Add gift cards | Add seasonal promotions | Add blog | Add video tour

/App.tsx
\`\`\`tsx
import Navbar from '/components/sections/Navbar';
import Hero from '/components/sections/Hero';
import StickyBar from '/components/sections/StickyBar';
import ServiceCards from '/components/sections/ServiceCards';
import SocialProof from '/components/sections/SocialProof';
import BeforeAfter from '/components/sections/BeforeAfter';
import Team from '/components/sections/Team';
import Reviews from '/components/sections/Reviews';
import Booking from '/components/sections/Booking';
import MapSection from '/components/sections/MapSection';
import Footer from '/components/sections/Footer';

export default function App() {
  return (
    <div>
      <StickyBar text="✨ New: Hydrafacial Express — 45 min, $89" cta="Book Now" ctaHref="#booking" showAfterScroll={300} />
      <Navbar brand="Jade & Ivory Wellness" links={["Services","Results","Team","Reviews","Book"]} cta="Book Now" ctaHref="#booking" accentColor="var(--primary)" />
      <Hero tag="SINCE 2018 · BEVERLY HILLS" title="Where Science Meets Serenity" subtitle="Award-winning facials, body treatments, and wellness rituals in the heart of Beverly Hills." cta1={{text:"Book a Treatment",href:"#booking"}} cta2={{text:"View Services",href:"#services"}} image="{{unsplash:luxury spa treatment room candles soft lighting|1600x900}}" />
      <ServiceCards title="Signature Treatments" subtitle="Each service is customized to your skin's unique needs." items={[{title:"Signature HydraFacial",desc:"Deep cleanse + extraction + hydration. Skin transformation in 60 minutes.",price:"From $185",icon:"💎",badge:"Most Popular",features:["60 min","All skin types","No downtime"]},{title:"Vitamin C Brightening",desc:"Targeted treatment to eliminate dark spots and restore radiance.",price:"From $145",icon:"✨",features:["45 min","Visible results in 1 session"]},{title:"Deep Tissue Massage",desc:"Release tension with our signature 90-minute therapeutic massage.",price:"From $165",icon:"🌿",features:["90 min","Swedish or deep tissue"]}]} accentColor="var(--primary)" />
      <SocialProof stats={[{value:"4,800+",label:"Treatments Performed",icon:"💆"},{value:"4.9★",label:"Average Rating",icon:"⭐"},{value:"98%",label:"Would Recommend",icon:"❤️"},{value:"6+",label:"Years in Beverly Hills",icon:"📍"}]} dark={true} />
      <BeforeAfter title="Real Results" subtitle="Before and after treatments from our clients." items={[{before:"{{unsplash:dull tired skin texture close up|400x300}}",after:"{{unsplash:glowing healthy skin close up|400x300}}",beforeLabel:"Before",afterLabel:"After 3 Sessions"},{before:"{{unsplash:uneven skin tone texture|400x300}}",after:"{{unsplash:smooth even skin glow|400x300}}",beforeLabel:"Before",afterLabel:"After HydraFacial"}]} accentColor="var(--primary)" />
      <Team title="Meet Your Estheticians" items={[{name:"Dr. Camille Reyes",role:"Medical Director",image:"{{unsplash:professional woman doctor portrait studio|200x200}}",bio:"Board-certified dermatologist with 14 years specializing in non-invasive rejuvenation."},{name:"Sofia Marchetti",role:"Lead Esthetician",image:"{{unsplash:professional woman esthetician portrait|200x200}}",bio:"HydraFacial and microneedling expert with a passion for visible, lasting transformation."}]} accentColor="var(--primary)" />
      <Reviews title="What Our Guests Say" items={[{name:"Priya K.",rating:5,text:"The HydraFacial completely transformed my skin. I've tried everything and this is the only thing that actually worked.",date:"March 2025",source:"Google"},{name:"Amanda L.",rating:5,text:"Sofia is an absolute artist. My skin has never looked better. Worth every penny.",date:"February 2025",source:"Yelp"},{name:"Jessica M.",rating:5,text:"The atmosphere alone is worth coming for. The results are beyond anything I expected.",date:"January 2025",source:"Google"}]} accentColor="var(--primary)" />
      <Booking title="Reserve Your Treatment" accentColor="var(--primary)" />
      <MapSection title="Visit Us in Beverly Hills" address="9450 Wilshire Blvd, Suite 200, Beverly Hills, CA 90212" phone="(310) 555-0192" email="hello@jadeivorywellness.com" hours={[{day:"Monday",open:"9:00",close:"19:00"},{day:"Tuesday",open:"9:00",close:"19:00"},{day:"Wednesday",open:"9:00",close:"19:00"},{day:"Thursday",open:"9:00",close:"20:00"},{day:"Friday",open:"9:00",close:"20:00"},{day:"Saturday",open:"10:00",close:"18:00"},{day:"Sunday",closed:true}]} accentColor="var(--primary)" />
      <Footer brand="Jade & Ivory Wellness" tagline="Beverly Hills' Premier Wellness Studio" links={["Services","About","Reviews","Book"]} accentColor="var(--primary)" />
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
body { font-family: 'DM Sans', sans-serif; margin: 0; background: hsl(var(--background)); color: hsl(var(--foreground)); overflow-x: hidden; }
* { box-sizing: border-box; }
img { max-width: 100%; height: auto; }
/* Hard cap: card images never exceed 260px. Hero images use explicit height class. */
img:not(.hero-img) { max-height: 260px; width: 100%; object-fit: cover; display: block; }
\`\`\`

^^^ This App.tsx uses 9 sections, a unique business name, a dark SocialProof section for contrast, and a BeforeAfter for surprise. A full site using components should be 40-80 lines. If yours is >150 lines, you're writing too much custom code. USE THE COMPONENTS.

## SITE QUALITY CHECKLIST — every build must score 9/10+:

### Content quality:
- Business name must be creative and memorable — NOT "Serenity Spa", "Elite Fitness", "Modern Dental". Use specific, unique names like "Sage & Stone Wellness", "Ironside Athletic Club", "Coastal Crown Dental"
- Write real, specific copy — NOT "Lorem ipsum" or "We are the best". Write actual service descriptions, real-sounding staff bios, specific pricing
- Use real addresses (e.g. "2847 Pacific Coast Hwy, Malibu CA 90265") not "123 Main St"
- Hero headline must be punchy and specific: "Beverly Hills' Most Awarded Facial Studio" not "Welcome to Our Spa"

### Section uniqueness:
- Every build must use at least 8 sections
- Pick sections that make sense for the business — a dental office needs Booking, Team, TrustBadges, BeforeAfter. A restaurant needs MenuGrid, Gallery, HoursTable, Reviews
- At least one section must be non-obvious: use BeforeAfter, Countdown, Awards, VideoSection, or SocialProof to add surprise
- NEVER use the exact same set of sections for similar businesses

## WHAT EVERY SITE TYPE NEEDS — follow these blueprints:

### RESTAURANT / FOOD:
Sections: Navbar → Banner(promo) → Hero(image) → MenuGrid → Gallery → SocialProof → Reviews → HoursTable → MapSection → Footer
Must have: 12+ menu items with real prices, food photos, hours for every day, Google Maps link, phone as tel: link
Accent: warm colors — #c2410c, #b45309, #92400e

### SPA / SALON / WELLNESS:
Sections: Navbar → StickyBar(offer) → Hero → ServiceCards → SocialProof → BeforeAfter → Team → PricingTable → Reviews → Booking → MapSection → Footer
Must have: 6+ services with prices, before/after photos, team bios, booking form, trust stats
Accent: elegant — #7c3aed, #be185d, #0f766e, #4d7c5e

### FITNESS / GYM:
Sections: Navbar → Hero → SocialProof → ServiceCards → StepProcess → Team → PricingTable → Reviews → Countdown(trial offer) → Contact → Footer
Must have: 3 pricing tiers, transformation testimonials, class schedule, free trial CTA
Accent: bold — #dc2626, #ea580c, #7c3aed

### MEDICAL / DENTAL:
Sections: Navbar → Hero → TrustBadges → ServiceCards → Team → BeforeAfter → Reviews → Booking → MapSection → Footer
Must have: credentials/awards, insurance logos, doctor bios, before/after results, HIPAA trust badge
Accent: clinical — #0369a1, #0f766e, #1d4ed8

### LAW FIRM:
Sections: Navbar → Hero → Stats → ServiceCards → Team → Timeline → LogoCloud(press) → Reviews → Contact → Footer
Must have: case win stats, practice areas, attorney bios, bar certifications, free consultation CTA
Accent: authoritative — #1e3a5f, #b8860b, #1a1a1a

### SAAS / TECH PRODUCT:
Sections: Navbar → Hero → LogoCloud(customers) → Features → SplitSection → Comparison → PricingTable → FAQ → CTA → Footer
Must have: live demo link or screenshot, 3 pricing tiers (free/pro/enterprise), feature comparison table, customer logos
Accent: modern — #7c3aed, #2563eb, #0f766e

### E-COMMERCE / SHOP:
Sections: Navbar(showCart=true) → Banner(sale) → Hero → ShopGrid → Features → Reviews → Newsletter → Footer
Must have: 8+ products with real prices, cart functionality, sale banner, free shipping threshold
Accent: clean — #111, #7c3aed, #dc2626

### PORTFOLIO / CREATIVE:
Sections: Navbar → Hero → Portfolio → Awards → ImageText(about) → Team → Reviews → Contact → Footer
Must have: 6+ portfolio pieces with descriptions, personal bio, skills/tech list, contact form
Accent: creative — #111, #7c3aed, dark themes

### CONTRACTOR / TRADES:
Sections: Navbar → Hero → ServiceCards → Gallery → StepProcess → Reviews → TrustBadges → Contact → MapSection → Footer
Must have: licensed/insured badges, before/after gallery, process steps, real testimonials with names/cities
Accent: bold — #dc2626, #ea580c, #b45309

### HOTEL / RENTAL:
Sections: Navbar → Hero → Gallery → Features → PricingTable(room types) → Reviews → MapSection → Booking → Footer
Must have: room photos, amenities list, pricing per night, location map, booking form
Accent: luxury — #b8860b, #0f172a, #1e3a5f

### NONPROFIT / CHARITY:
Sections: Navbar → Hero → Stats → SplitSection → Team → Timeline → Reviews → Newsletter → CTA → Footer
Must have: impact numbers, mission statement, team photos, donation CTA, story timeline
Accent: warm/trustworthy — #16a34a, #0369a1, #b45309

### REAL ESTATE:
Sections: Navbar → Hero → Portfolio(listings) → ServiceCards → Team → Stats → Reviews → Contact → Footer
Must have: featured listings with prices, agent bios, neighborhood knowledge, testimonials from buyers/sellers
Accent: professional — #1e3a5f, #b8860b, #0f766e

### Visual distinctiveness:
- Hero must have a large, full-width image (use {{unsplash:...}} with specific query)
- At least one section must have a dark background
- Stats sections need real numbers: "4,800+ clients served", "$2.3M in sales", "98.6% satisfaction"
- Images must be SPECIFIC: not "{{unsplash:spa|400x300}}" but "{{unsplash:luxury hot stone massage warm lighting|400x300}}"

### Working interactions (VERIFY EACH):
- Every nav link → scrolls to matching section id
- "Book Now" / "Reserve" → scrolls to Booking section (id="booking")
- "Order Now" → scrolls to menu (id="menu")
- Phone numbers → tel: links
- Emails → mailto: links
- PricingTable plans → clickable, highlight on select
- FAQ items → expand/collapse on click

## MULTI-PAGE SITES
For sites with multiple pages (e.g., a business with Home, About, Services, Contact as separate pages):

Use the Router component with hash-based navigation:
\`\`\`tsx
import Router from '/components/sections/Router';
import Navbar from '/components/sections/Navbar';
import Footer from '/components/sections/Footer';

const HomePage = () => (
  <>
    <Hero title="..." accentColor="var(--primary)" />
    <Features items={[...]} accentColor="var(--primary)" />
  </>
);

const AboutPage = () => (
  <>
    <Team members={[...]} accentColor="var(--primary)" />
    <Timeline items={[...]} accentColor="var(--primary)" />
  </>
);

export default function App() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--fg)', minHeight: '100vh' }}>
      <Navbar
        links={[
          { label: 'Home', href: '#/' },
          { label: 'About', href: '#/about' },
          { label: 'Services', href: '#/services' },
          { label: 'Contact', href: '#/contact' },
        ]}
        accentColor="var(--primary)"
      />
      <Router pages={[
        { path: '/', label: 'Home', component: <HomePage /> },
        { path: '/about', label: 'About', component: <AboutPage /> },
        { path: '/services', label: 'Services', component: <ServicesPage /> },
        { path: '/contact', label: 'Contact', component: <ContactPage /> },
      ]} />
      <Footer links={[...]} accentColor="var(--primary)" />
    </div>
  );
}
\`\`\`

Use multi-page when: the user asks for multiple pages, a full website (not landing page), or a site with distinct sections that need their own URL. Single-page scrolling is fine for landing pages and simple sites.

{{DESIGN_INJECTION}}

{{INTEGRATIONS_INJECTION}}

## MOBILE RESPONSIVE — Critical for all sites

All sites MUST be mobile-responsive. Add these media query rules to /index.css:

\`\`\`css
/* Mobile responsiveness — always include */
@media (max-width: 768px) {
  /* Reduce section padding */
  section { padding: 48px 20px !important; }

  /* Stack grid layouts to single column */
  .grid-auto { grid-template-columns: 1fr !important; }

  /* Reduce hero font size */
  h1 { font-size: clamp(28px, 8vw, 48px) !important; }
  h2 { font-size: clamp(22px, 6vw, 36px) !important; }

  /* Stack flex rows */
  .flex-row-mobile { flex-direction: column !important; }

  /* Full width buttons on mobile */
  .btn-mobile { width: 100% !important; justify-content: center !important; }
}
\`\`\`

For inline styles in JSX components, use clamp() for font sizes:
- Section titles: fontSize: 'clamp(24px, 5vw, 48px)'
- Hero titles: fontSize: 'clamp(32px, 7vw, 80px)'
- Body text: fontSize: 'clamp(14px, 2vw, 18px)'

For grid layouts, use responsive grid:
\`\`\`javascript
// Instead of: gridTemplateColumns: 'repeat(3, 1fr)'
// Use:
gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
\`\`\`

This automatically collapses to 2 columns then 1 column as viewport shrinks.

For two-column flex layouts (like SplitSection):
\`\`\`javascript
// Add flexWrap: 'wrap' so columns stack on mobile
display: 'flex', flexWrap: 'wrap', gap: 40
// Each child: minWidth: '280px', flex: '1 1 280px'
\`\`\`

ALWAYS:
- Use clamp() for all font sizes in hero/headers
- Use repeat(auto-fit, minmax(X, 1fr)) for grids
- Add flexWrap: 'wrap' to flex rows
- Use maxWidth + margin auto for content containers
- Keep padding at least 20px on mobile (never 0)

In /index.css always include:
\`\`\`css
* { box-sizing: border-box; }
img { max-width: 100%; height: auto; }
body { overflow-x: hidden; }
\`\`\`

## VISUAL DESIGN — Make it look premium
- Hero sections: use gradient backgrounds or full-width images with dark overlays, never plain white
  Example: background: \`linear-gradient(135deg, \${accentColor}15, var(--bg))\`
- Primary buttons: add box-shadow for glow effect: \`boxShadow: \`0 0 24px \${accentColor}60\`\`
- Cards: add hover elevation: onMouseEnter → boxShadow: '0 12px 40px rgba(0,0,0,0.12)', transform: 'translateY(-4px)'
- Section backgrounds: alternate between var(--bg) and var(--card) for visual rhythm
- Stats numbers: make them large (font-size: clamp(40px, 6vw, 72px)) and colored with accentColor
- Testimonial cards: add a colored top border or left accent: \`borderTop: \`3px solid \${accentColor}\`\`
- Icons in features: use colored circle backgrounds: \`background: \${accentColor}20, color: \${accentColor}\`
- Dividers between sections: use \`<div style={{ height: 2, background: \`linear-gradient(90deg, transparent, \${accentColor}40, transparent)\` }} />\``;

// Edge functions instructions — only injected when Supabase is enabled
const EDGE_FUNCTIONS_HINT = `For server-side logic, generate /functions/<name>.js (Supabase Edge Functions, Deno runtime).`;

// Separate edit prompt — search/replace format for surgical edits
const SYSTEM_EDIT = `You are making SURGICAL edits to an existing React app. Use CSS variables (var(--primary), var(--bg), etc.) and inline styles — NEVER Tailwind CSS classes.

## GOLDEN RULE: PRESERVE EVERYTHING NOT EXPLICITLY ASKED TO CHANGE
The user's existing site took effort to build. Your job is a SCALPEL, not a sledgehammer.

## WHAT TO PRESERVE (non-negotiable):
- ALL /components/sections/* imports — never remove, never replace with inline code
- ALL existing section components (<Navbar>, <Hero>, <ServiceCards>, etc.) — only modify props if the user asked
- The overall page structure and section order
- All existing data (menu items, team members, prices, etc.) unless asked to change
- All existing IDs, hrefs, and section links

## WHAT YOU CAN CHANGE:
- Colors → update CSS variables in /index.css OR accentColor props on components
- Text content → update the specific prop value
- Adding a new section → add the import + JSX, don't touch other sections
- Removing a section → remove just that component from JSX
- Font → update @import in /index.css and font-family in body
- Build COMPLETE features — no stubs, no TODOs. The code MUST be fully functional.
- EVERY button MUST have a working onClick handler. No dead buttons.
- When adding interactive features (cart, modal, tabs, accordion, form), include ALL useState hooks, handlers, and conditional rendering.

## COLOR CHANGES — the right way:
If user says "change to blue":
1. Change --primary in /index.css :root to the blue color
2. If accentColor props are hardcoded hex (not var(--primary)), update those too
3. That's it. DO NOT rewrite App.tsx.

If user says "make it dark mode":
1. Change --bg to dark color, --fg to light color, --card to slightly lighter dark in /index.css
2. DO NOT rewrite App.tsx.

## COLOR/THEME CHANGES — detailed:
All apps use CSS variables. Change /index.css ONLY — swap the values in :root.
Example: "make it dark green" → --bg: #0a1a0f; --fg: #f0fff4; --primary: #86efac;
Do NOT touch /App.tsx for color changes.

## ADDING A SECTION:
If user says "add a FAQ section":
1. Add import FAQ from '/components/sections/FAQ'; at the top of App.tsx
2. Add <FAQ title="..." items={[...]} accentColor="var(--primary)" /> in the right place in JSX
3. That's it. DO NOT touch other sections.

## BEFORE YOU OUTPUT:
Ask yourself: "Did I remove any /components/sections/* import?" If yes, add it back.
Ask yourself: "Did I change anything the user didn't ask about?" If yes, revert it.

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

const SYSTEM_EDIT_TOOLS = `You are making SURGICAL edits to an existing React app.

## GOLDEN RULE: PRESERVE EVERYTHING NOT EXPLICITLY ASKED TO CHANGE
The user's existing site took effort to build. Your job is a SCALPEL, not a sledgehammer.

## WHAT TO PRESERVE (non-negotiable):
- ALL /components/sections/* imports — never remove, never replace with inline code
- ALL existing section components (<Navbar>, <Hero>, <ServiceCards>, etc.) — only modify props if the user asked
- The overall page structure and section order
- All existing data (menu items, team members, prices, etc.) unless asked to change
- All existing IDs, hrefs, and section links

## WHAT YOU CAN CHANGE:
- Colors → update CSS variables in /index.css OR accentColor props on components
- Text content → update the specific prop value
- Adding a new section → add the import + JSX, don't touch other sections
- Removing a section → remove just that component from JSX
- Font → update @import in /index.css and font-family in body

## COLOR CHANGES — the right way:
If user says "change to blue":
1. Change --primary in /index.css :root to the blue color
2. If accentColor props are hardcoded hex (not var(--primary)), update those too
3. That's it. DO NOT rewrite App.tsx.

If user says "make it dark mode":
1. Change --bg to dark color, --fg to light color, --card to slightly lighter dark in /index.css
2. DO NOT rewrite App.tsx.

## ADDING A SECTION:
If user says "add a FAQ section":
1. Add import FAQ from '/components/sections/FAQ'; at the top of App.tsx
2. Add <FAQ title="..." items={[...]} accentColor="var(--primary)" /> in the right place in JSX
3. That's it. DO NOT touch other sections.

## TOOL USAGE:
Use edit_file for each file you need to change.
Provide the COMPLETE updated file — not a diff.
Only edit files that actually need changing.

## BEFORE YOU OUTPUT:
Ask yourself: "Did I remove any /components/sections/* import?" If yes, add it back.
Ask yourself: "Did I change anything the user didn't ask about?" If yes, revert it.`;

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

// ─── Server-side validation + auto-fix loop ─────────────────────────────────

function validateFiles(files: ProjectFiles): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const appCode = files["/App.tsx"] ?? "";

  if (!appCode || appCode.length < 100) {
    errors.push("App.tsx is missing or nearly empty");
  }

  if (appCode && !appCode.includes("export default")) {
    errors.push("App.tsx is missing 'export default'");
  }

  // Unbalanced braces
  for (const [path, code] of Object.entries(files)) {
    if (!path.match(/\.(tsx?|jsx?)$/)) continue;
    const opens = (code.match(/\{/g) || []).length;
    const closes = (code.match(/\}/g) || []).length;
    if (Math.abs(opens - closes) > 2) {
      errors.push(`${path}: unbalanced braces (${opens} open, ${closes} close)`);
    }
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (Math.abs(openParens - closeParens) > 2) {
      errors.push(`${path}: unbalanced parentheses (${openParens} open, ${closeParens} close)`);
    }
  }

  // Invalid local imports — referencing files that don't exist in the project
  for (const [path, code] of Object.entries(files)) {
    if (!path.match(/\.(tsx?|jsx?)$/)) continue;
    const localImports = [...code.matchAll(/import\s+.*from\s+['"](\.\/[^'"]+)['"]/g)];
    for (const m of localImports) {
      const importPath = m[1];
      const resolved = "/" + importPath.replace(/^\.\//, "");
      const candidates = [resolved, resolved + ".tsx", resolved + ".ts", resolved + "/index.tsx", resolved + "/index.ts"];
      if (!candidates.some(c => files[c])) {
        errors.push(`${path}: imports '${importPath}' but that file doesn't exist`);
      }
    }
  }

  // Truncation detection
  for (const [path, code] of Object.entries(files)) {
    if (!path.match(/\.(tsx?|jsx?)$/)) continue;
    if (/[,(\{<]\s*$/.test(code.trim())) {
      errors.push(`${path}: appears truncated (ends with open syntax)`);
    }
  }

  return { valid: errors.length === 0, errors };
}

async function autoFixServerSide(
  files: ProjectFiles,
  errors: string[],
  originalPrompt: string,
  onToken: (t: string) => void,
  onStatus?: (text: string) => void,
): Promise<{ files: ProjectFiles; inputTokens: number; outputTokens: number }> {
  const errorList = errors.map(e => `- ${e}`).join("\n");
  const fileList = Object.entries(files)
    .filter(([p]) => p.match(/\.(tsx?|jsx?|css)$/))
    .map(([p, c]) => `${p}\n\`\`\`\n${c}\n\`\`\``)
    .join("\n\n");

  const fixPrompt = `The generated code has these errors:\n${errorList}\n\nFix ALL errors. Return the COMPLETE corrected files. Do not change any functionality — only fix the structural issues.\n\nCurrent files:\n${fileList}`;

  let fixText = "";
  let fixInputTokens = 0, fixOutputTokens = 0;

  ({ inputTokens: fixInputTokens, outputTokens: fixOutputTokens } = await generateWithAnthropic(
    "claude-sonnet-4-6", 32000, fixPrompt,
    "You are fixing broken React code. Return complete corrected files in markdown fence format. Fix ONLY the listed errors.",
    (t) => { fixText += t; onToken(t); },
  ));

  const parsed = parseOutput(fixText, files);
  if (parsed && Object.keys(parsed.files).length > 0) {
    onStatus?.("Applied auto-fix");
    return { files: parsed.files, inputTokens: fixInputTokens, outputTokens: fixOutputTokens };
  }

  return { files: {}, inputTokens: fixInputTokens, outputTokens: fixOutputTokens };
}

// ─── UI polish pass (new builds only) ────────────────────────────────────────

async function polishCheck(
  files: ProjectFiles,
  onToken: (t: string) => void,
  onStatus?: (text: string) => void,
): Promise<{ files: ProjectFiles; inputTokens: number; outputTokens: number }> {
  onStatus?.("Polishing UI…");

  const appCode = files["/App.tsx"] ?? "";
  const cssCode = files["/index.css"] ?? "";

  const polishPrompt = `Review this React app for UI polish issues. Check:
1. Mobile responsiveness — are there md: or lg: breakpoints?
2. Consistent spacing — padding/margin patterns
3. Button hover states — do buttons have hover: classes?
4. Image sizing — do all <img> tags have width/height constraints?
5. Color contrast — are text colors readable on backgrounds?

Only return fixes as SEARCH/REPLACE blocks. If the app is already polished, return just "SUMMARY: No polish needed" with no edits.

/App.tsx
\`\`\`tsx
${appCode.slice(0, 15000)}
\`\`\`

/index.css
\`\`\`css
${cssCode}
\`\`\``;

  let polishText = "";
  let polishInput = 0, polishOutput = 0;

  const hasGoogle = !!process.env.GOOGLE_AI_API_KEY;
  if (hasGoogle) {
    ({ inputTokens: polishInput, outputTokens: polishOutput } = await generateWithGoogle(
      "gemini-2.5-flash", 8000, polishPrompt,
      "You are a UI polish reviewer. Return SEARCH/REPLACE blocks for fixes, or 'SUMMARY: No polish needed' if the UI is already good. Be minimal — only fix real issues.",
      (t) => { polishText += t; },
    ));
  } else {
    ({ inputTokens: polishInput, outputTokens: polishOutput } = await generateWithAnthropic(
      "claude-haiku-4-5-20251001", 8000, polishPrompt,
      "You are a UI polish reviewer. Return SEARCH/REPLACE blocks for fixes, or 'SUMMARY: No polish needed' if the UI is already good. Be minimal — only fix real issues.",
      (t) => { polishText += t; },
    ));
  }

  const parsed = parseOutput(polishText, files);
  if (parsed && Object.keys(parsed.files).length > 0) {
    onStatus?.("Applied UI polish");
    return { files: parsed.files, inputTokens: polishInput, outputTokens: polishOutput };
  }

  return { files: {}, inputTokens: polishInput, outputTokens: polishOutput };
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
  qualityScore?: number;
  qualityIssues?: QualityIssue[];
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

  // Layout variety — different section order / hero style each build
  const LAYOUT_VARIANTS = [
    "Stats-first: Hero → bold STATS bar (4 numbers) → Menu/Products → Testimonials → FAQ → Contact.",
    "Story-first: Hero → SplitSection (brand story, image right) → Menu/Products → Stats → Footer.",
    "Social-proof-first: Hero → LogoCloud (press mentions) → Features → Menu/Products → Testimonials → CTA.",
    "Features-first: Hero → 3-column Features grid → Menu/Products → single bold Testimonial quote → Contact.",
    "Minimal: Hero (no bg image, giant typography) → Menu/Products → one Testimonials row → Contact. Clean and fast.",
    "Dark band: Hero → Stats (dark={true}) → Menu/Products → Testimonials → Newsletter (dark band) → Footer.",
    "Gallery-forward: Hero → Gallery (4 photos) → Menu/Products → Team → Contact.",
    "FAQ-heavy: Hero → Features → Menu/Products → FAQ (6+ questions) → CTA → Footer.",
    "Timeline story: Hero → Timeline (brand history) → Features → Menu/Products → Testimonials → Contact.",
    "Banner-led: Banner (promo) → Hero → Menu/Products → Stats → Testimonials → Newsletter → Footer.",
  ];
  const layoutVariant = isEdit ? "" : LAYOUT_VARIANTS[Math.floor(Math.random() * LAYOUT_VARIANTS.length)];

  // Design system — 83 categories × 25 moods × 40 palettes = 80,000+ unique combinations
  const designMatch = isEdit ? null : matchDesign(prompt);
  const advancedDesignContext = designMatch ? buildDesignContext(designMatch) : "";

  // Fallback to original 8-theme system if no category matched
  const pickedDesign = (!designMatch && !isEdit) ? pickDesign(prompt) : null;
  const layoutBlock = layoutVariant ? `\n\n## LAYOUT DIRECTION FOR THIS BUILD:\n${layoutVariant}` : "";
  const designInjection = isEdit
    ? `EDITING AN EXISTING APP — DO NOT apply any new design system. Read the existing code and match its exact colors, fonts, spacing, and visual style. Your only job is to add/change what was requested.`
    : designMatch
    ? advancedDesignContext + layoutBlock
    : `${pickedDesign!.description}

In /index.css, define EXACTLY these CSS variables:
:root {
  --bg: ${pickedDesign!.bg};
  --fg: ${pickedDesign!.text};
  --card: ${pickedDesign!.card};
  --border: ${pickedDesign!.border};
  --primary: ${pickedDesign!.accent};
  --primary-fg: #ffffff;
  --accent: ${pickedDesign!.accent};
  --muted: ${pickedDesign!.muted};
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--fg); }

Use var(--primary) for buttons/CTAs, var(--bg) for page backgrounds, var(--fg) for text, var(--card) for cards.
Pass accentColor="var(--primary)" to ALL section components.
border-radius: ${pickedDesign!.radius} everywhere.${layoutBlock}`;

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

  // Build preservation reminder for edit context
  const preservationReminder = isEdit && existingFiles
    ? `\n\nREMEMBER: Only change what the user asked. Keep ALL section components and imports intact.\nEXISTING SECTIONS TO PRESERVE: ${
        Object.values(existingFiles).join('\n').match(/import\s+(\w+)\s+from\s+'\/components\/sections\/[^']+'/g)?.map(m => m.match(/import\s+(\w+)/)?.[1]).filter(Boolean).join(', ') || 'check the file above'
      }`
    : "";

  // Tool-use path gets a clean prompt without search/replace hints
  const toolUserContent = isEdit
    ? `EXISTING APP (DO NOT REWRITE — only change what was asked):\n${existingSection}${envSection}${knowledgeSection}${historySection}${conversationCtx}\n\n[${editIntent.toUpperCase()}] USER REQUEST: ${prompt}${preservationReminder}`
    : "";

  // Text-based path keeps the intent hints (tells AI to use SEARCH/REPLACE format)
  const userContent = isEdit
    ? `EXISTING APP (DO NOT REWRITE — only change what was asked):\n${existingSection}${envSection}${knowledgeSection}${historySection}${conversationCtx}\n\n[${editIntent.toUpperCase()}] USER REQUEST: ${prompt}${preservationReminder}\n\n${intentHints[editIntent]}`
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

  // ── TEXT-BASED GENERATION (proven to work with Sandpack) ──
  // Reverted to text-based because tool-use output doesn't use Sandpack's Tailwind config correctly
  const useToolPipeline = false;

  if (useToolPipeline) {
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
      fixed = fixed.replace(/(\w)’(ll|re|ve|t|s|d|m)\b/g, "$1’$2");
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

    // Parse CSS variables and create HARDCODED utility classes
    if (toolUseFiles["/index.css"]) {
      const css = toolUseFiles["/index.css"];
      // Extract HSL values from :root
      const vars: Record<string, string> = {};
      const varMatches = css.matchAll(/--(\w[\w-]*)\s*:\s*([^;]+)/g);
      for (const m of varMatches) {
        const name = m[1].trim();
        const val = m[2].trim();
        if (val && !val.includes('rem') && !val.includes('px')) {
          vars[name] = val;
        }
      }

      // Build hardcoded utility classes from actual values
      const hsl = (name: string) => vars[name] ? `hsl(${vars[name]})` : '';
      toolUseFiles["/index.css"] += `
/* FORCE STYLES — hardcoded from :root values */
body, #root, #app, [data-reactroot], main { background-color: ${hsl('background') || '#faf8f5'}; color: ${hsl('foreground') || '#1c1109'}; min-height: 100vh; }
nav, header { background-color: ${hsl('card') || '#ffffff'}; backdrop-filter: blur(12px); border-bottom: 1px solid ${hsl('border') || '#e8dfd5'}; }
img:not([class*="h-"]):not([class*="hero"]):not([style*="vh"]) { max-height: 240px !important; object-fit: cover !important; width: 100% !important; display: block !important; }
.bg-background { background-color: ${hsl('background') || '#faf8f5'} !important; }
.bg-foreground { background-color: ${hsl('foreground') || '#1c1109'} !important; }
.bg-card { background-color: ${hsl('card') || '#ffffff'} !important; }
.bg-primary { background-color: ${hsl('primary') || '#6b3a2a'} !important; }
.bg-secondary { background-color: ${hsl('secondary') || '#f5ebe0'} !important; }
.bg-muted { background-color: ${hsl('muted') || '#7c6b5d'} !important; }
.bg-accent { background-color: ${hsl('accent') || '#b45309'} !important; }
.text-foreground { color: ${hsl('foreground') || '#1c1109'} !important; }
.text-muted { color: ${hsl('muted') || '#7c6b5d'} !important; }
.text-primary { color: ${hsl('primary') || '#6b3a2a'} !important; }
.text-primary-foreground { color: ${hsl('primary-foreground') || '#ffffff'} !important; }
.border-border { border-color: ${hsl('border') || '#e8dfd5'} !important; }
`;
    }

    // PRESERVE all section imports — only add missing ones, never remove
    if (isEdit && existingFiles && toolUseFiles['/App.tsx']) {
      const sectionImportRegex = /import\s+\w+\s+from\s+'\/components\/sections\/[^']+';/g;
      const existingImports = (existingFiles['/App.tsx'] || '').match(sectionImportRegex) || [];
      const newImports = (toolUseFiles['/App.tsx'] || '').match(sectionImportRegex) || [];
      const missingFromNew = existingImports.filter(imp => !newImports.includes(imp));
      if (missingFromNew.length > 0) {
        const firstImport = toolUseFiles['/App.tsx'].indexOf('import ');
        if (firstImport !== -1) {
          toolUseFiles['/App.tsx'] = toolUseFiles['/App.tsx'].slice(0, firstImport) +
            missingFromNew.join('\n') + '\n' + toolUseFiles['/App.tsx'].slice(firstImport);
        }
      }
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
  } // end useToolPipeline

  // Text-based generation (the original, working approach)
  if (!useToolPipeline) {
    try {
      if (modelOpt.provider === "anthropic") {
        ({ stopped, inputTokens, outputTokens } = await generateWithAnthropic(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback, imageBase64, imageMimeType));
      } else if (modelOpt.provider === "openai") {
        ({ stopped, inputTokens, outputTokens } = await generateWithOpenAI(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback));
      } else if (modelOpt.provider === "google") {
        ({ stopped, inputTokens, outputTokens } = await generateWithGoogle(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback));
      }
    } catch {
      const fallback = MODELS["claude-sonnet-4-6"];
      if (modelOpt.provider !== "anthropic") {
        text = ""; lastStatusIdx = -1;
        ({ stopped, inputTokens, outputTokens } = await generateWithAnthropic(fallback.model, fallback.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback, imageBase64, imageMimeType));
        modelOpt = { ...fallback };
      } else {
        throw new Error("Generation failed. Please try again.");
      }
    }
    if (stopped && modelOpt.model !== "claude-sonnet-4-6") {
      const sonnet = MODELS["claude-sonnet-4-6"];
      text = ""; lastStatusIdx = -1;
      ({ stopped, inputTokens, outputTokens } = await generateWithAnthropic(sonnet.model, sonnet.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback, imageBase64, imageMimeType));
      modelOpt = { ...sonnet };
    }
    if (stopped) {
      throw new Error("Response was cut off. Try breaking your request into steps.");
    }
  }

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

  // ── Build Validator ──
  // Remove files that conflict with Sandpack's built-in files
  // Remove ALL entry point files — Sandpack has its own
  const keysToDelete: string[] = [];
  for (const key of Object.keys(parsed.files)) {
    if (key.match(/\/?index\.(tsx?|jsx?)$/) || key.match(/\/?main\.(tsx?|jsx?)$/)) {
      if (!key.endsWith(".css")) {
        keysToDelete.push(key);
      }
    }
  }
  for (const key of keysToDelete) {
    delete parsed.files[key];
    console.log("[BUILD VALIDATOR] Deleted conflicting file:", key);
  }

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
    // Strip ALL invalid imports — only allow known-good ones
    if (parsed) {
      let fixedApp = parsed.files["/App.tsx"] ?? appCode;
      const VALID_SECTIONS = ['AppDownload','Awards','Banner','BeforeAfter','BlogGrid','Booking','CTA','Comparison','Contact','Countdown','EventsList','FAQ','Features','Footer','Gallery','Hero','HoursTable','IconFeatures','ImageText','LocationCards','LogoCloud','MapSection','MenuGrid','Navbar','Newsletter','Partners','Portfolio','PricingTable','ProductSpotlight','QuoteBlock','Reviews','RichText','ServiceCards','ShopGrid','SocialProof','SplitSection','Stats','StepProcess','StickyBar','Tabs','Team','Testimonials','Timeline','TrustBadges','VideoHero','VideoSection'];
      // Check every import line — PRESERVE all /components/sections/* imports
      fixedApp = fixedApp.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?\n?/g, (match, name, path) => {
        // Always keep: react, lucide-react, react-hot-toast
        if (path === 'react' || path.includes('lucide') || path.includes('toast')) return match;
        // PRESERVE all /components/sections/* imports — these are our pre-built library
        if (path.includes('/components/sections/')) return match;
        // Strip only clearly invalid relative imports (./components/ui/, etc.)
        if (path.startsWith('./') || path.startsWith('../')) return '';
        return match;
      });
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

  // PRESERVE all section imports — only add missing ones, never remove (text-based path)
  if (isEdit && existingFiles && resolvedFiles['/App.tsx']) {
    const sectionImportRegex = /import\s+\w+\s+from\s+'\/components\/sections\/[^']+';/g;
    const existingImports = (existingFiles['/App.tsx'] || '').match(sectionImportRegex) || [];
    const newImports = (resolvedFiles['/App.tsx'] || '').match(sectionImportRegex) || [];
    const missingFromNew = existingImports.filter(imp => !newImports.includes(imp));
    if (missingFromNew.length > 0) {
      const firstImport = resolvedFiles['/App.tsx'].indexOf('import ');
      if (firstImport !== -1) {
        resolvedFiles['/App.tsx'] = resolvedFiles['/App.tsx'].slice(0, firstImport) +
          missingFromNew.join('\n') + '\n' + resolvedFiles['/App.tsx'].slice(firstImport);
      }
    }
  }

  // For edits: merge returned files with existing (AI only returns changed files)
  let finalFiles = isEdit && existingFiles
    ? { ...existingFiles, ...resolvedFiles }
    : resolvedFiles;

  // ── Server-side auto-fix loop ──
  // Validate generated code and retry up to 3 times before sending to client
  for (let fixAttempt = 0; fixAttempt < 3; fixAttempt++) {
    const validation = validateFiles(finalFiles);
    if (validation.valid) break;
    onStatus?.(`Fixing issues (attempt ${fixAttempt + 1}/3)…`);
    try {
      const fix = await autoFixServerSide(
        finalFiles, validation.errors, prompt,
        onToken ?? (() => {}), onStatus,
      );
      inputTokens += fix.inputTokens;
      outputTokens += fix.outputTokens;
      if (Object.keys(fix.files).length > 0) {
        finalFiles = { ...finalFiles, ...fix.files };
      } else {
        break; // Fix produced nothing — stop retrying
      }
    } catch {
      break; // Fix call failed — stop retrying
    }
  }

  // ── UI polish pass disabled — layout rules in main prompt handle this ──
  if (false && !isEdit) {
    try {
      const polish = await polishCheck(finalFiles, onToken ?? (() => {}), onStatus);
      inputTokens += polish.inputTokens;
      outputTokens += polish.outputTokens;
      if (Object.keys(polish.files).length > 0) {
        finalFiles = { ...finalFiles, ...polish.files };
      }
    } catch {
      // Polish failed — continue with unpolished output
    }
  }

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

  // ── sanitizeAppTsx: fix common AI output issues ──
  function sanitizeAppTsx(code: string): string {
    let fixed = code;
    // Remove any markdown code fences that leaked in
    fixed = fixed.replace(/^```[a-z]*\n?/gm, '').replace(/^```\s*$/gm, '');
    // Fix double export defaults (keep only the last one)
    const doubleExport = /export default function App[\s\S]*?export default function App/;
    if (doubleExport.test(fixed)) {
      const lastIdx = fixed.lastIndexOf('export default function App');
      fixed = fixed.slice(lastIdx);
    }
    // Ensure proper React import when React is referenced
    if (!fixed.includes('import React') && fixed.includes('React.')) {
      fixed = "import React from 'react';\n" + fixed;
    }
    // Remove any stray backtick-only lines
    fixed = fixed.replace(/^`+\s*$/gm, '');
    return fixed.trim();
  }

  if (finalFiles['/App.tsx']) {
    finalFiles['/App.tsx'] = sanitizeAppTsx(finalFiles['/App.tsx']);
  }

  // ── Improved truncation detection + brace recovery ──
  if (finalFiles['/App.tsx']) {
    const appTsx = finalFiles['/App.tsx'];
    const lastLine = appTsx.trim().split('\n').pop() || '';
    const incompletePatterns = [
      /^\s*[{([\`'"]/,
      /=>\s*$/,
      /,\s*$/,
      /\bconst\s+\w+\s*=\s*$/,
    ];
    const hasProperEnd = appTsx.trim().endsWith('}') || appTsx.trim().endsWith(');') || appTsx.trim().endsWith('/>');
    const looksIncomplete = !hasProperEnd || incompletePatterns.some(p => p.test(lastLine));
    if (looksIncomplete) {
      const opens = (appTsx.match(/\{/g) || []).length;
      const closes = (appTsx.match(/\}/g) || []).length;
      const diff = opens - closes;
      if (diff > 0 && diff < 10) {
        finalFiles['/App.tsx'] = appTsx + '\n' + '}'.repeat(diff);
      }
    }
  }

  // ── Missing default export recovery ──
  if (finalFiles['/App.tsx'] && !finalFiles['/App.tsx'].includes('export default')) {
    let recovered = finalFiles['/App.tsx'].replace(
      /^(function App\b)/m,
      'export default function App'
    );
    if (!recovered.includes('export default')) {
      recovered += '\nexport default App;';
    }
    finalFiles['/App.tsx'] = recovered;
  }

  // Auto-fix missing section component imports in App.tsx
  if (finalFiles['/App.tsx']) {
    const KNOWN_SECTIONS = ['MetaTags','Navbar','Hero','Banner','VideoHero','HeroCentered','HeroSplit','HeroVideo','Stats','Features','IconFeatures','SplitSection','ImageText','MenuGrid','ShopGrid','Gallery','Portfolio','Team','Timeline','Testimonials','Reviews','LogoCloud','BlogGrid','PricingTable','Comparison','FAQ','Newsletter','CTA','SocialProof','QuoteBlock','Booking','HoursTable','MapSection','ServiceCards','StepProcess','VideoSection','AppDownload','BeforeAfter','EventsList','Countdown','TrustBadges','LocationCards','ProductSpotlight','Partners','Awards','RichText','StickyBar','Contact','Footer','DarkModeToggle','Tabs','DashboardStats','DataTable','ActivityFeed','RevenueChart','AdminSidebar','KanbanBoard','UserManagement','NotificationCenter','AnalyticsPanel','OrdersTable','FormBuilder','FileManager','CalendarWidget','QuickActions','DashboardShell','PricingCard','TestimonialCard','FeatureCard','StatBadge','ImageCard','ProfileCard','AlertBanner','ProgressBar','CountdownTimer','VideoEmbed','MapEmbed','SocialLinks','NewsletterInline','RatingStars','Breadcrumbs','TabsInline','AccordionItem','ImageGalleryGrid','CallToActionBanner','EmptyState','Router','LoginForm','SignupForm','ChatWidget','CheckoutForm','ProductDetail','BlogPost','JobListing','RestaurantReservation','PropertyListing','DoctorProfile','MenuCategory','PackageComparison','IntegrationGrid','MegaMenu','PressKit','ReferralProgram','MembershipTiers','EventDetail','FilterBar','CartDrawer','CookieBanner','LoadingScreen','SearchBar','PricingToggle','ForgotPassword'];
    let appCode = finalFiles['/App.tsx'];
    const missingImports: string[] = [];
    for (const comp of KNOWN_SECTIONS) {
      const used = new RegExp(`<${comp}[\\s/>]`).test(appCode);
      const imported = new RegExp(`import\\s+${comp}\\s+from`).test(appCode);
      if (used && !imported) missingImports.push(comp);
    }
    if (missingImports.length > 0) {
      const importLines = missingImports.map(c => `import ${c} from '/components/sections/${c}';`).join('\n');
      // Insert after last existing section import, or at top after React import
      const lastImportIdx = appCode.lastIndexOf("import ");
      const lastImportEnd = appCode.indexOf('\n', lastImportIdx) + 1;
      appCode = appCode.slice(0, lastImportEnd) + importLines + '\n' + appCode.slice(lastImportEnd);
      finalFiles['/App.tsx'] = appCode;
    }

    // Auto-inject scroll anchor ids for navbar links.
    // Maps each section component → the id the Navbar will link to.
    const SECTION_IDS: Record<string, string> = {
      ServiceCards: 'services', Booking: 'booking', Reviews: 'reviews', SplitSection: 'about',
      MenuGrid: 'menu', ShopGrid: 'shop', Gallery: 'gallery', Portfolio: 'portfolio',
      Team: 'team', Timeline: 'timeline', Testimonials: 'testimonials',
      PricingTable: 'pricing', FAQ: 'faq', Contact: 'contact', MapSection: 'location',
      HoursTable: 'hours', StepProcess: 'process', Features: 'features',
      Stats: 'stats', LogoCloud: 'partners', BlogGrid: 'blog', Newsletter: 'newsletter',
      AppDownload: 'download', BeforeAfter: 'results', EventsList: 'events',
      Countdown: 'offer', TrustBadges: 'trust', VideoSection: 'video',
      DashboardStats: 'stats', DataTable: 'data', ActivityFeed: 'activity', OrdersTable: 'orders',
      UserManagement: 'users', KanbanBoard: 'tasks', CalendarWidget: 'calendar', AnalyticsPanel: 'analytics',
      // Admin components
      DashboardShell: 'dashboard', RevenueChart: 'revenue', AdminSidebar: 'sidebar',
      NotificationCenter: 'notifications', FormBuilder: 'forms', FileManager: 'files',
      QuickActions: 'actions',
      // Micro components
      PricingCard: 'pricing', TestimonialCard: 'testimonials', FeatureCard: 'features',
      StatBadge: 'stats', ImageCard: 'gallery', ProfileCard: 'team', AlertBanner: 'alert',
      ProgressBar: 'progress', CountdownTimer: 'countdown', VideoEmbed: 'video',
      MapEmbed: 'map', SocialLinks: 'social', NewsletterInline: 'newsletter',
      RatingStars: 'reviews', Breadcrumbs: 'nav', TabsInline: 'tabs',
      AccordionItem: 'faq', ImageGalleryGrid: 'gallery', CallToActionBanner: 'cta',
      EmptyState: 'empty',
      // Hero variants
      HeroCentered: 'hero', HeroSplit: 'hero', HeroVideo: 'hero',
      // Utility — no anchor needed (empty string = skip)
      MetaTags: '', DarkModeToggle: '', Router: '',
      // Specialty components
      LoginForm: 'login', SignupForm: 'signup', ChatWidget: 'chat',
      CheckoutForm: 'checkout', ProductDetail: 'product', BlogPost: 'blog',
      JobListing: 'jobs', RestaurantReservation: 'reservation', PropertyListing: 'properties',
      DoctorProfile: 'doctor', MenuCategory: 'menu', PackageComparison: 'comparison',
      IntegrationGrid: 'integrations', MegaMenu: 'menu', PressKit: 'press',
      ReferralProgram: 'referral', MembershipTiers: 'membership', EventDetail: 'events',
      FilterBar: 'filter', CartDrawer: 'cart',
      CookieBanner: '', LoadingScreen: '',  // no anchor needed
      SearchBar: 'search', PricingToggle: 'pricing', ForgotPassword: 'forgot',
      // Coming soon components
      ComingSoon: 'coming-soon', MaintenanceMode: 'maintenance', StickyContactBar: 'contact',
      PopupModal: '',  // no anchor needed
      InteractiveMap: 'map', TestimonialsCarousel: 'testimonials', ImageCompare: 'compare',
      VideoTestimonial: 'testimonials', AffiliatePartners: 'partners', StatsCounter: 'stats',
    };
    for (const [comp, anchorId] of Object.entries(SECTION_IDS)) {
      // Only inject anchor if component is used, has a non-empty anchor id, and no element already has that id
      const compUsed = new RegExp(`<${comp}[\\s/>]`).test(appCode);
      const idAlreadySet = anchorId ? new RegExp(`id=["']${anchorId}["']`).test(appCode) : false;
      if (compUsed && anchorId && !idAlreadySet) {
        // Inject <div id="anchorId" style={{position:'relative',top:-64}} /> just before the component
        appCode = appCode.replace(
          new RegExp(`([ \\t]*)(<${comp}[\\s/>])`),
          `$1<div id="${anchorId}" style={{position:'relative',top:-64}} />\n$1$2`
        );
      }
    }
    finalFiles['/App.tsx'] = appCode;
  }

  // Inject bold design CSS: force accent color var + section background alternation
  if (finalFiles['/App.tsx'] && finalFiles['/index.css']) {
    // Extract accent color from App.tsx (look for accentColor="#..." pattern)
    const accentMatch = finalFiles['/App.tsx'].match(/accentColor=["']([^"']+)["']/);
    const accentHex = accentMatch?.[1] || null;

    let css = finalFiles['/index.css'];

    // Inject --accent CSS variable if we found an accent color and it's not already defined
    if (accentHex && !css.includes('--accent:')) {
      css = css.replace(':root {', `:root {\n  --accent: ${accentHex};`);
    }

    // Add alternating section backgrounds via CSS custom property --bg
    // All section components use background:'var(--bg,#fff)' so this propagates automatically
    if (!css.includes('section:nth-child')) {
      const tintHex = accentHex ? `${accentHex}18` : '#f5f3ff';
      css += `\n\n/* Bold design: alternating section backgrounds */\nsection:nth-child(4n+2) { --bg: ${tintHex}; }\nsection:nth-child(4n+3) { --bg: #f4f4f5; }\nsection:nth-child(4n+4) { --bg: #0f0f0f; color: #fff; }\nsection:nth-child(4n+4) h1, section:nth-child(4n+4) h2, section:nth-child(4n+4) h3, section:nth-child(4n+4) h4 { color: #fff; }\nsection:nth-child(4n+4) p { color: rgba(255,255,255,0.72); }`;
    }

    finalFiles['/index.css'] = css;
  }

  // ── Quality check ──
  // Only run on new builds (not edits) to surface issues before the user sees the preview
  let qualityScore: number | undefined;
  let qualityIssues: QualityIssue[] | undefined;
  if (!isEdit) {
    const qualityReport = checkSiteQuality(finalFiles);
    qualityScore = qualityReport.score;
    qualityIssues = qualityReport.issues;
    if (!qualityReport.passed) {
      parsed.summary += `\n\n${formatQualityReport(qualityReport)}`;
    }
  }

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
    qualityScore,
    qualityIssues,
  };
}

export function defaultProjectFiles(): ProjectFiles {
  return {
    "/App.tsx": `import './index.css';\n\nexport default function App() {\n  return (\n    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>\n      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Your app will appear here</h1>\n      <p style={{ color: "hsl(var(--muted-foreground))" }}>Describe what you want to build in the chat.</p>\n    </div>\n  );\n}`,
    "/index.css": `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');\n\n:root {\n  --background: 0 0% 100%;\n  --foreground: 222 47% 11%;\n  --primary: 262 83% 58%;\n  --primary-foreground: 0 0% 100%;\n  --secondary: 210 40% 96%;\n  --secondary-foreground: 222 47% 11%;\n  --muted: 210 40% 96%;\n  --muted-foreground: 215 16% 47%;\n  --accent: 210 40% 96%;\n  --accent-foreground: 222 47% 11%;\n  --destructive: 0 84% 60%;\n  --destructive-foreground: 0 0% 100%;\n  --border: 214 32% 91%;\n  --input: 214 32% 91%;\n  --ring: 262 83% 58%;\n  --card: 0 0% 100%;\n  --card-foreground: 222 47% 11%;\n  --radius: 0.5rem;\n}\n\n* { box-sizing: border-box; margin: 0; padding: 0; }\nbody { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }`,
  };
}
