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
  {
    category: "luxury_spa_salon",
    keywords: ["spa", "salon", "beauty", "massage", "facial", "nails", "waxing", "blowout", "medspa", "skincare", "esthetics", "lashes", "brows", "wellness retreat"],
    layout: "Sensory-first. Full-bleed photography. Calm, uncluttered. Booking always one tap away.",
    sections: ["Navbar with sticky 'Book Now' CTA", "Cinematic hero (ambient photo + elegant tagline)", "StickyBar for promotions or new client offers", "Services menu with pricing", "Before/after results slider", "Meet the team (credentials + warmth)", "Client reviews with star ratings", "Booking widget (date, service, staff)", "Map + hours", "Footer"],
    designTone: "Luxurious, serene, aspirational. Clients should feel relaxed before they even walk in.",
    colorApproach: "Soft neutrals: champagne, blush, sage, warm white. Gold or muted rose as accent. Never bright primaries.",
    heroPattern: "Full-width atmospheric photo (spa interior or treatment in progress), minimal overlay text, single CTA: 'Book Your Experience'. No clutter.",
    mustHave: ["Booking form with service selector, date picker, and staff preference", "Before/after photo slider (skin, hair, nails — whatever fits)", "Real pricing on service cards — clients expect transparency", "New client special offer prominently displayed"],
    avoid: ["Bright or corporate colors", "Stock photo clichés (candles on rocks)", "Hiding prices", "Dense text blocks — this is a visual/emotional category"],
  },
  {
    category: "medical_dental",
    keywords: ["dentist", "dental", "doctor", "clinic", "medical", "orthodontist", "dermatologist", "chiropractor", "optometrist", "pediatrician", "urgent care", "healthcare", "physician", "surgeon"],
    layout: "Trust-first, clinical-clean. Patients need to feel safe and informed before booking.",
    sections: ["Navbar (logo + Services + About + Insurance + phone number)", "Hero (warm photo of staff + reassuring headline)", "Services grid with condition/treatment cards", "Trust badges (board certified, years of experience, insurance accepted)", "Doctor/team bios with credentials", "Before/after results (smile transformations, skin results)", "Patient reviews (Google star ratings)", "Online booking widget", "Map and office hours", "Footer"],
    designTone: "Reassuring, warm, and credible. Patients are often anxious — the site should calm and convert.",
    colorApproach: "Clean white or light gray base. Blue or teal accent for trust. Warm photography balances clinical coldness.",
    heroPattern: "Smiling doctor or welcoming waiting room photo, headline focused on patient outcome (e.g., 'Your Healthiest Smile Starts Here'), two CTAs: 'Book Appointment' + 'Meet Our Team'.",
    mustHave: ["Insurance logos or 'We accept most insurance' statement", "Doctor credentials (MD, DDS, board certifications) on team cards", "Online booking or prominent phone number", "Real patient testimonials with star ratings"],
    avoid: ["Sterile stock-photo operating rooms", "Burying the phone number", "Vague headlines like 'Quality Care for the Whole Family'", "No pricing or insurance info"],
  },
  {
    category: "fitness_gym",
    keywords: ["gym", "fitness", "crossfit", "yoga", "pilates", "personal trainer", "bootcamp", "martial arts", "boxing", "cycling", "studio", "health club", "weightlifting", "strength"],
    layout: "High-energy. Bold imagery. Clear membership path. Community-forward.",
    sections: ["Navbar with 'Start Free Trial' CTA", "Hero (action shot + motivational headline)", "Social proof (member count, Google rating, transformation results)", "Class/program cards with schedule and difficulty", "How to get started (3-step process)", "Trainer bios with specialties", "Membership pricing tiers", "Member testimonials + transformation photos", "Contact and location", "Footer"],
    designTone: "Energetic, motivational, community-driven. Visitors should feel they can achieve their goals here.",
    colorApproach: "High contrast: black + electric yellow, dark navy + orange, or red + white. Bold, athletic. Avoid soft pastels.",
    heroPattern: "Full-bleed action photo or video loop. Bold motivational headline (5-7 words). Subhead about community or results. CTA: 'Start Free Trial' or 'Claim Your Free Class'.",
    mustHave: ["Free trial or intro offer CTA above the fold", "Clear membership pricing (monthly, annual, drop-in)", "Class schedule or program overview", "Transformation testimonials with photos if possible"],
    avoid: ["Soft or feminine pastels (unless niche yoga/pilates)", "Hiding pricing until contact", "Generic 'Get Fit' copy", "No social proof — skeptics need proof this gym gets results"],
  },
  {
    category: "legal_professional",
    keywords: ["law firm", "attorney", "lawyer", "legal", "counsel", "litigation", "injury", "divorce", "criminal defense", "immigration", "estate planning", "corporate law", "solicitor", "barrister"],
    layout: "Authority-first. Credibility signals everywhere. Clear practice areas. Easy consultation path.",
    sections: ["Navbar (logo + Practice Areas + About + Contact + phone)", "Hero (professional team photo + bold results-focused headline)", "Case stats (settlements won, years experience, cases handled)", "Practice area cards", "Attorney bios with bar admissions and credentials", "Case timeline or process walkthrough", "Client testimonials and case results", "Free consultation CTA", "Contact form", "Footer"],
    designTone: "Authoritative, composed, trustworthy. Clients are often scared — they need a firm that projects total competence.",
    colorApproach: "Navy blue, charcoal, or deep gray base. Gold or white accent. Conservative — no trendy gradients or bright colors.",
    heroPattern: "Professional team or courthouse photo, headline anchored in outcomes ('Aggressive Representation. Real Results.'), two CTAs: 'Free Consultation' + 'View Practice Areas'. Display a key stat (e.g., '$50M+ recovered') in the hero.",
    mustHave: ["Key stat in hero or just below (cases won, settlements, years experience)", "Practice area breakdown — clients need to confirm you handle their issue", "Attorney credentials with bar admissions and notable cases", "Free consultation CTA with form or phone — lower barrier to contact"],
    avoid: ["Casual or friendly tone — this is a high-stakes service", "Hiding attorney credentials", "Slow load time — clients shop multiple firms quickly", "Vague practice areas like 'We handle all legal matters'"],
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
