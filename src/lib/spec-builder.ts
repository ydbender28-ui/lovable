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
        content: `You are an expert at writing prompts for AI web app generators. Rewrite the following prompt to be more specific, detailed, and actionable. Add relevant UI details, features, and design direction. Keep it under 120 words. Return ONLY the improved prompt with no preamble.\n\nOriginal prompt: ${prompt}`,
      }],
    }),
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: `You are a web page architect. Given a build request, choose which pre-built sections to use and in what order.

AVAILABLE SECTIONS (use ONLY these names):
Navbar, Hero, Banner, VideoHero, Stats, Features, IconFeatures, SplitSection, ImageText, MenuGrid, ShopGrid, Gallery, Portfolio, Team, Timeline, Testimonials, Reviews, LogoCloud, BlogGrid, PricingTable, Comparison, FAQ, Newsletter, CTA, SocialProof, QuoteBlock, Booking, HoursTable, MapSection, ServiceCards, StepProcess, VideoSection, AppDownload, BeforeAfter, EventsList, Countdown, TrustBadges, LocationCards, ProductSpotlight, Partners, Awards, RichText, StickyBar, Contact, Footer, Tabs

BUSINESS TYPE SECTION PLANS (follow the order closely):
- Spa/Salon/Beauty: Navbar→Hero→StickyBar→ServiceCards→SocialProof→BeforeAfter→Team→Reviews→Booking→MapSection→Footer
- Restaurant/Food: Navbar→Banner→Hero→MenuGrid→Gallery→SocialProof→Reviews→HoursTable→MapSection→Footer
- Fitness/Gym: Navbar→Hero→SocialProof→ServiceCards→StepProcess→Team→PricingTable→Reviews→Contact→Footer
- Medical/Dental: Navbar→Hero→ServiceCards→TrustBadges→Team→BeforeAfter→Reviews→Booking→MapSection→Footer
- Law/Professional: Navbar→Hero→Stats→ServiceCards→Team→Timeline→Reviews→Contact→Footer
- Retail/Ecommerce: Navbar→Banner→Hero→ShopGrid→Features→Reviews→Newsletter→Footer
- SaaS/Tech: Navbar→Hero→LogoCloud→Features→Comparison→PricingTable→FAQ→CTA→Footer
- Contractor/Trades: Navbar→Hero→ServiceCards→Gallery→StepProcess→Reviews→Contact→MapSection→Footer
- Hotel/Real Estate: Navbar→Hero→Gallery→Features→PricingTable→Reviews→MapSection→Contact→Footer

VARIETY RULES:
- For every build, include at least one "surprise" section not in the default plan for that type. Choose from: VideoSection, Countdown, Awards, SocialProof, AppDownload, QuoteBlock. Pick whichever fits the business best.
- Never use the exact same section list twice — vary order of non-critical middle sections slightly.
- ALWAYS place Contact or MapSection BEFORE Footer (never after).
- StickyBar must appear immediately AFTER Navbar (before Hero) for time-sensitive businesses: restaurants, salons, spas, event venues.
- Banner goes ABOVE Hero only when there is a promotion, sale, or urgent announcement.
- MenuGrid = food menus. ShopGrid = product stores. Never use both.

FEATURE SPECIFICITY RULES:
- Return 3-5 features that are concrete and specific to THIS business, not generic.
- BAD: ["booking form", "team section", "reviews"]
- GOOD: ["booking form with date/time/service picker and confirmation email", "team cards with headshots, credentials, and specialties", "Google star rating display with 5+ real-sounding reviews", "before/after photo slider showing treatment results"]

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
