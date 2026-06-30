// Website pattern knowledge base — 8 categories with layout/design best practices
// Injected into new builds to guide the AI toward professional output

interface WebsitePattern {
  category: string
  keywords: string[]
  layout: string
  sections: string[]
  designTone: string
  colorApproach: string
  heroPattern: string
  mustHave: string[]
  avoid: string[]
}

const PATTERNS: WebsitePattern[] = [
  {
    category: "saas_landing",
    keywords: ["saas", "software", "app", "platform", "tool", "dashboard", "analytics", "crm", "project management", "api", "startup", "product", "b2b"],
    layout: "Clean, minimal, high contrast. Lots of white space. Linear/Vercel/Stripe aesthetic.",
    sections: ["Navbar (logo + nav + CTA)", "Hero (headline + subhead + CTA + product screenshot)", "Social proof (logos or stats bar)", "Features (3-column icon grid)", "How it works (numbered steps)", "Pricing (3-tier cards)", "Testimonials", "Final CTA banner", "Footer"],
    designTone: "Professional, confident, modern tech. Trust-building.",
    colorApproach: "Dark navy or white base. Electric blue/violet accent. High contrast CTAs.",
    heroPattern: "Large bold headline (max 8 words), single-sentence subhead, two CTAs (primary + secondary), product screenshot or animation below",
    mustHave: ["Specific metric in hero (e.g., '10x faster', '47% reduction')", "Real company name (not 'YourBrand')", "Pricing with actual numbers", "Social proof — logos OR testimonials (not both)"],
    avoid: ["Stock photo heroes", "Vague headlines like 'Streamline your workflow'", "More than 3 nav items + CTA", "Gradients on everything"],
  },
  {
    category: "ecommerce",
    keywords: ["shop", "store", "ecommerce", "buy", "product", "cart", "checkout", "sell", "merchandise", "clothing", "fashion", "sneakers", "jewelry"],
    layout: "Product-first. Large imagery. Sticky cart. Mobile-optimized grid.",
    sections: ["Navbar (logo + search + cart icon)", "Hero banner (seasonal promo)", "Featured categories (visual grid)", "Product grid (cards with image, name, price)", "Bestsellers carousel", "Brand story / USP", "Reviews", "Footer with trust badges"],
    designTone: "Aspirational, visual, brand-forward.",
    colorApproach: "Match product category. Fashion = minimal black/white. Outdoors = earthy greens. Tech = dark + neon.",
    heroPattern: "Full-width image with overlay text and shop CTA. Alternate: split layout (image left, text right).",
    mustHave: ["Working cart state (add/remove items)", "Product cards with real prices", "Filter/sort UI (even if not functional)", "Trust badges (free shipping, returns, secure)"],
    avoid: ["Text-only product cards", "Generic 'Shop Now' as the only CTA", "Hiding the cart"],
  },
  {
    category: "restaurant_cafe",
    keywords: ["restaurant", "cafe", "coffee", "food", "menu", "dining", "bistro", "bar", "bakery", "pizza", "sushi", "brunch", "catering"],
    layout: "Atmosphere-first. Full-bleed hero. Warm, inviting. Menu prominently featured.",
    sections: ["Sticky nav (logo + Hours + Reserve CTA)", "Full-bleed hero (atmospheric photo + tagline)", "Menu highlights (cards with image + price)", "About / Story section", "Hours & Location", "Reservation CTA", "Reviews (Google/Yelp style)", "Footer"],
    designTone: "Warm, artisanal, inviting. 'Come in and stay a while' energy.",
    colorApproach: "Warm earth tones (amber, terracotta, cream). Dark backgrounds for upscale. Bright for casual.",
    heroPattern: "Full-width atmospheric image, semi-transparent overlay, restaurant name + tagline, two CTAs: 'View Menu' + 'Reserve a Table'",
    mustHave: ["Real menu items with prices (make them up)", "Hours and address", "Reservation or order CTA", "Brand name (not 'Our Restaurant')"],
    avoid: ["Stock photo food grid without context", "No menu/prices", "Corporate blue color palette", "Missing contact info"],
  },
  {
    category: "portfolio_agency",
    keywords: ["portfolio", "agency", "designer", "developer", "freelance", "creative", "studio", "branding", "web design", "photography", "architect"],
    layout: "Work-first. Large case study images. Personal/team story. Clean and confident.",
    sections: ["Minimal nav (name + Work + About + Contact)", "Hero (name, role, 1-line tagline, scroll CTA)", "Selected work (case study cards)", "Services or skills", "About / Story", "Testimonials", "Contact CTA", "Footer"],
    designTone: "Confident, creative, editorial. The work speaks.",
    colorApproach: "Usually monochrome (black/white) with one bold accent. Or match personal brand.",
    heroPattern: "Name large, role below, short personal tagline, one primary CTA to see work. Often asymmetric layout.",
    mustHave: ["3-5 fake case study projects with titles + descriptions", "Clear role/specialty", "Contact method", "Specific skills or tools listed"],
    avoid: ["Centering everything", "Too many colors", "Generic taglines like 'Crafting digital experiences'", "Missing actual work samples"],
  },
  {
    category: "dashboard_app",
    keywords: ["dashboard", "admin", "analytics", "metrics", "reports", "monitor", "management", "system", "internal", "tracker", "crm"],
    layout: "Sidebar navigation + main content area. Data-dense but scannable.",
    sections: ["Sidebar (logo + nav items with icons)", "Top bar (search + notifications + user avatar)", "Stats row (4 KPI cards)", "Charts (line/bar graphs)", "Data table (with search/filter)", "Recent activity feed"],
    designTone: "Professional, efficient, information-dense.",
    colorApproach: "Dark sidebar + light content, or all-light. Blue/indigo accents for interactive elements.",
    heroPattern: "Not applicable — lead with stats and charts immediately on load.",
    mustHave: ["Sidebar with 5-8 nav items + icons", "4 KPI stat cards", "At least one chart (fake data ok)", "Responsive table"],
    avoid: ["Marketing-style hero", "Too much animation", "Missing sidebar", "Unusable at real data density"],
  },
  {
    category: "blog_editorial",
    keywords: ["blog", "magazine", "editorial", "news", "articles", "newsletter", "publication", "media", "content", "writing"],
    layout: "Reading-optimized. Clear typography hierarchy. Content density.",
    sections: ["Minimal header (logo + categories + search)", "Featured article (hero card)", "Article grid (cards with image, category, title, excerpt, author)", "Category tabs", "Newsletter signup", "Footer"],
    designTone: "Editorial, trustworthy, readable.",
    colorApproach: "Clean white/off-white base. Accent on category tags. Strong typography is the design.",
    heroPattern: "Large featured article with image, category badge, title, excerpt and author. Grid of 3 secondary articles below.",
    mustHave: ["Readable font (serif for editorial feel)", "Category tags", "Article cards with author and date", "At least 6 fake articles"],
    avoid: ["Auto-play media", "Clutter/too many elements", "Poor line length (too wide)", "Missing reading time"],
  },
  {
    category: "landing_service",
    keywords: ["service", "agency", "consulting", "law", "accounting", "plumbing", "electrician", "cleaning", "roofing", "contractor", "insurance", "mortgage", "real estate"],
    layout: "Trust-first. Local/professional. Clear services and contact.",
    sections: ["Nav (logo + Services + About + Contact + phone)", "Hero (service + location + trust signals)", "Services grid (3-6 cards)", "Why us (3 USP columns)", "Process steps", "Testimonials", "CTA banner ('Get a free quote')", "Contact form", "Footer"],
    designTone: "Trustworthy, local, professional. Customers need to feel safe choosing you.",
    colorApproach: "Industry-appropriate. Legal = navy/gold. Trades = bold red/blue. Medical = blue/green.",
    heroPattern: "Headline = what + who + where. Subhead = key benefit. CTA = 'Get Free Quote' or 'Schedule Service'. Trust signal = years in business, rating, or guarantee.",
    mustHave: ["Phone number visible in nav", "Clear list of services", "Free quote or contact CTA", "Customer reviews"],
    avoid: ["Burying contact info", "No local signals (city/area name)", "Weak CTAs like 'Learn More'"],
  },
  {
    category: "mobile_app_landing",
    keywords: ["mobile app", "ios", "android", "app store", "download", "phone app", "native app"],
    layout: "App-focused. Phone mockups. Download CTAs. Feature highlights.",
    sections: ["Nav (logo + Features + Pricing + Download)", "Hero (headline + phone mockup + download badges)", "Feature highlights (screenshot + text, alternating)", "Social proof (ratings, downloads)", "Pricing or plans", "Download CTA banner", "Footer"],
    designTone: "Modern, polished, mobile-first energy.",
    colorApproach: "Gradient backgrounds, vibrant accent. App Store aesthetic.",
    heroPattern: "Left: headline + subhead + App Store + Google Play badges. Right: phone mockup showing app UI.",
    mustHave: ["App Store + Google Play download buttons", "Phone mockup (CSS-only is fine)", "Feature screenshots", "App ratings/download count"],
    avoid: ["Desktop-only layout", "No download CTA", "Missing app store links"],
  },
]

export function matchPattern(prompt: string): WebsitePattern {
  const lower = prompt.toLowerCase()
  let bestMatch = PATTERNS[0]
  let bestScore = 0

  for (const p of PATTERNS) {
    const score = p.keywords.reduce((s, kw) => s + (lower.includes(kw) ? 1 : 0), 0)
    if (score > bestScore) { bestScore = score; bestMatch = p }
  }

  return bestMatch
}

export function buildWebsiteKnowledge(prompt: string): string {
  const p = matchPattern(prompt)
  return `## Site guidance (${p.category}): ${p.designTone} | Colors: ${p.colorApproach} | Must: ${p.mustHave.slice(0,2).join(", ")} | Avoid: ${p.avoid.slice(0,2).join(", ")}`
}
