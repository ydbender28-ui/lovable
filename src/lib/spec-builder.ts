import Anthropic from "@anthropic-ai/sdk";

export interface BuildSpec {
  enhancedPrompt: string;
  componentPlan: string;
}

export async function buildSpec(prompt: string): Promise<BuildSpec> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const [enhanceRes, architectRes] = await Promise.all([
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `You are an expert at writing prompts for AI web app generators. Rewrite the following prompt to be more specific, detailed, and actionable for generating a professional website.\n\nYour enhanced prompt must include:\n1. Business name (invent one if not given, make it fit the industry)\n2. City/location (invent if not given)\n3. Target audience and key differentiators\n4. Specific services, products, or features (at least 4-6, NOT generic)\n5. Tone/vibe (e.g., "upscale and elegant", "friendly and approachable", "bold and high-energy")\n6. Key conversion goal (what should visitors do? book, buy, contact, sign up?)\n\nKeep it under 150 words. Return ONLY the improved prompt with no preamble.\n\nOriginal prompt: ${prompt}`,
      }],
    }),
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: `You are a web page architect. Given a build request, choose which pre-built sections to use and in what order.

AVAILABLE SECTIONS (use ONLY these names):
Navbar, Hero, HeroCentered, HeroSplit, HeroVideo, Banner, VideoHero, Stats, Features, IconFeatures, SplitSection, ImageText, MenuGrid, ShopGrid, Gallery, Portfolio, Team, Timeline, Testimonials, Reviews, LogoCloud, BlogGrid, PricingTable, Comparison, FAQ, Newsletter, CTA, SocialProof, QuoteBlock, Booking, HoursTable, MapSection, ServiceCards, StepProcess, VideoSection, AppDownload, BeforeAfter, EventsList, Countdown, TrustBadges, LocationCards, ProductSpotlight, Partners, Awards, RichText, StickyBar, Contact, Footer, Tabs, DashboardShell, DashboardStats, DataTable, RevenueChart, AdminSidebar, KanbanBoard, UserManagement, NotificationCenter, AnalyticsPanel, OrdersTable, FormBuilder, FileManager, CalendarWidget, QuickActions, PricingCard, TestimonialCard, FeatureCard, StatBadge, ImageCard, ProfileCard, AlertBanner, ProgressBar, CountdownTimer, VideoEmbed, MapEmbed, SocialLinks, NewsletterInline, RatingStars, Breadcrumbs, TabsInline, AccordionItem, ImageGalleryGrid, CallToActionBanner, EmptyState, Router, MetaTags, DarkModeToggle

BUSINESS TYPE SECTION PLANS (follow the order closely):
- Spa/Salon/Beauty: Navbar→MetaTags→HeroCentered(backgroundImage)→StickyBar→ServiceCards→SocialProof→BeforeAfter→Team→Reviews→Booking→MapSection→Footer
- Restaurant/Food: Navbar→MetaTags→Banner→HeroCentered(backgroundImage)→MenuGrid→Gallery→SocialProof→Reviews→HoursTable→MapSection→Footer
- Fitness/Gym: Navbar→MetaTags→HeroVideo→SocialProof→ServiceCards→StepProcess→Team→PricingTable→Reviews→Contact→Footer→DarkModeToggle
- Medical/Dental: Navbar→MetaTags→Hero→ServiceCards→TrustBadges→Team→BeforeAfter→Reviews→Booking→MapSection→Footer
- Law/Professional: Navbar→MetaTags→HeroSplit→Stats→ServiceCards→Team→Timeline→Reviews→Contact→Footer
- Retail/Ecommerce: Navbar→MetaTags→Banner→Hero→ShopGrid→Features→Reviews→Newsletter→Footer
- SaaS/Tech: Navbar→MetaTags→HeroSplit→LogoCloud→Features→Comparison→PricingTable→FAQ→CTA→Footer→DarkModeToggle
- Contractor/Trades: Navbar→MetaTags→Hero→ServiceCards→Gallery→StepProcess→Reviews→Contact→MapSection→Footer
- Hotel/Real Estate: Navbar→MetaTags→HeroCentered(backgroundImage)→Gallery→Features→PricingTable→Reviews→MapSection→Contact→Footer
- Photography/Creative: Navbar→MetaTags→HeroVideo→Portfolio→Stats→Team→PricingTable→Reviews→Booking→Contact→Footer
- Bar/Nightclub: Navbar→MetaTags→HeroVideo→Banner→MenuGrid→EventsList→Gallery→Reviews→HoursTable→MapSection→Footer
- Wedding/Events: Navbar→MetaTags→HeroCentered(backgroundImage)→Gallery→Stats→Features→PricingTable→Reviews→Booking→MapSection→Footer
- Admin/Dashboard/CRM/Internal Tool: MetaTags→DashboardShell→DashboardStats→RevenueChart→DataTable→ActivityFeed→(OrdersTable or UserManagement or KanbanBoard based on context)→AnalyticsPanel
- Multi-page Site: MetaTags→Router with Navbar→(per-page sections)→Footer

HERO VARIANT SELECTION:
- HeroCentered: use for sites with beautiful background photos — spa, restaurant, hotel, wedding venue, any site with strong imagery
- HeroSplit: use for product/service businesses where showing a product/app screenshot matters — SaaS, real estate, personal trainer, coaching
- HeroVideo: use for high-energy businesses — gym, nightclub, bar, luxury brand, agency, music
- Hero (default): use for everything else or when unsure
- ALWAYS include backgroundImage param for HeroCentered: "https://source.unsplash.com/1600x900/?[business-keywords]"
- ALWAYS include a stats array for HeroSplit: [{value: "...", label: "..."}] with 3 believable stats

VARIETY RULES (all MUST be followed):
- For every build, include at least one "surprise" section not in the default plan for that type. Choose from: VideoSection, Countdown, Awards, SocialProof, AppDownload, QuoteBlock, TrustBadges, ProductSpotlight. Pick whichever fits the business best.
- Never use the exact same section list twice — vary order of non-critical middle sections slightly.
- ALWAYS place Contact or MapSection BEFORE Footer (never after).
- StickyBar must appear immediately AFTER Navbar for time-sensitive businesses: restaurants, salons, spas, event venues.
- Banner goes ABOVE Hero only when there is a promotion, sale, or urgent announcement.
- MenuGrid = food menus only. ShopGrid = product stores only. Never use both.
- Add DarkModeToggle for: SaaS, tech, gym, bar/nightclub, photography, creative portfolio.
- Add MetaTags ALWAYS as first child after the opening App div.
- RANDOMIZE: for every 3rd build, swap the position of two middle sections (e.g., put Testimonials before ServiceCards).
- Pick at least ONE full-width dramatic section: HeroVideo/HeroCentered with background image, or a dark Stats section.

FEATURE SPECIFICITY RULES:
- Return 3-5 features that are concrete and specific to THIS business, not generic.
- BAD: ["booking form", "team section", "reviews"]
- GOOD: ["booking form with date/time/service picker and confirmation email", "team cards with headshots, credentials, and specialties", "Google star rating display with 5+ real-sounding reviews", "before/after photo slider showing treatment results"]

Return 8-12 sections total (MetaTags, DarkModeToggle, Router do not count as visual sections — always include them when appropriate without worrying about the count). Non-visual utility sections like MetaTags and DarkModeToggle should always be included for relevant business types.

Return JSON only:
{
  "sections": ["Navbar", "Hero", "...in order...", "Footer"],
  "features": ["3-5 specific content/interactive features tailored to this business"]
}`,
      messages: [{ role: "user", content: `Build request: ${prompt}` }],
    }),
  ]);

  const enhanced = enhanceRes.content[0].type === "text"
    ? enhanceRes.content[0].text.trim()
    : prompt;

  let componentPlan = "";
  try {
    const raw = (architectRes.content[0] as { type: string; text: string }).text;
    const cleaned = raw.includes("```") ? raw.split("```")[1].replace("json","").trim() : raw.trim();
    const plan = JSON.parse(cleaned);
    const parts: string[] = [];
    if (plan.sections?.length) parts.push(`Use these sections in this order: ${plan.sections.join(" → ")}`);
    if (plan.features?.length) parts.push(`Include: ${plan.features.join(", ")}`);
    componentPlan = parts.join("\n");
  } catch {
    // Architect call failed to parse — proceed without plan
  }

  return { enhancedPrompt: enhanced, componentPlan };
}
