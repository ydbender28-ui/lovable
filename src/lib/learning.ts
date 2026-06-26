import { prisma } from "./prisma";

// ─── Category detection ─────────────────────────────────────────────────────

const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/coffee|cafe|espresso|brew|roast|barista/, "coffee_shop"],
  [/restaurant|dining|bistro|kitchen|chef/, "restaurant"],
  [/bakery|bread|pastry|cake|bake/, "bakery"],
  [/pizza|pizzeria/, "pizza"],
  [/sushi|japanese|ramen/, "sushi"],
  [/bar|pub|cocktail|brewery|wine/, "bar"],
  [/salon|hair|stylist/, "salon"],
  [/spa|massage|wellness/, "spa"],
  [/nail|manicure/, "nails"],
  [/barber/, "barbershop"],
  [/tattoo|ink|piercing/, "tattoo"],
  [/yoga|meditation|pilates/, "yoga"],
  [/gym|fitness|crossfit|workout/, "gym"],
  [/martial art|karate|boxing|dojo/, "martial_arts"],
  [/doctor|medical|clinic|dental|dentist/, "medical"],
  [/therapy|therapist|counseling/, "therapy"],
  [/vet|veterinary/, "veterinary"],
  [/law|lawyer|attorney|legal/, "law"],
  [/accounting|accountant|tax/, "accounting"],
  [/real estate|property|realtor/, "real_estate"],
  [/hotel|resort/, "hotel"],
  [/construction|contractor/, "construction"],
  [/plumb/, "plumbing"],
  [/electric/, "electrician"],
  [/roof/, "roofing"],
  [/landscap|lawn|garden/, "landscaping"],
  [/clean/, "cleaning"],
  [/auto.*repair|mechanic/, "auto_repair"],
  [/photo/, "photography"],
  [/wedding|bridal/, "wedding"],
  [/ecommerce|shop|store|boutique/, "ecommerce"],
  [/saas|startup|software|app|tech/, "tech"],
  [/school|education|tutor/, "education"],
  [/nonprofit|charity/, "nonprofit"],
  [/church|worship/, "church"],
];

export function detectCategory(prompt: string): string {
  const p = prompt.toLowerCase();
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(p)) return category;
  }
  return "general";
}

// ─── Edit pattern normalization ─────────────────────────────────────────────

const EDIT_PATTERNS: [RegExp, string][] = [
  [/\b(cart|shopping cart|add to cart)\b/, "add_cart"],
  [/\b(checkout|check out)\b/, "add_checkout"],
  [/\b(testimonial|review|customer review)\b/, "add_reviews"],
  [/\b(contact form|contact us)\b/, "add_contact_form"],
  [/\b(booking|appointment|reservation)\b/, "add_booking"],
  [/\b(gallery|photo gallery|portfolio)\b/, "add_gallery"],
  [/\b(pricing|price|prices)\b/, "add_pricing"],
  [/\b(menu|food menu|drink menu)\b/, "add_menu"],
  [/\b(faq|frequently asked)\b/, "add_faq"],
  [/\b(newsletter|subscribe)\b/, "add_newsletter"],
  [/\b(dark mode|dark theme)\b/, "add_dark_mode"],
  [/\b(color|theme|palette)\b/, "change_colors"],
  [/\b(map|location|directions)\b/, "add_map"],
  [/\b(team|staff|about us)\b/, "add_team"],
  [/\b(search|filter)\b/, "add_search"],
  [/\b(hours|schedule|opening)\b/, "add_hours"],
  [/\b(phone|call|whatsapp)\b/, "add_phone"],
];

function normalizeEdit(prompt: string): string {
  const p = prompt.toLowerCase();
  for (const [pattern, key] of EDIT_PATTERNS) {
    if (pattern.test(p)) return key;
  }
  return p.replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "_").substring(0, 40);
}

// ─── Learn from past builds ─────────────────────────────────────────────────

interface LearnedPattern {
  feature: string;
  frequency: number;
  example: string;
}

export async function getSmartDefaults(prompt: string): Promise<string | null> {
  const category = detectCategory(prompt);

  try {
    // Find all projects in this category by looking at first user messages
    const projects = await prisma.project.findMany({
      where: { updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 10 },
      },
      take: 100,
    });

    // Filter to projects in the same category
    const sameCategory = projects.filter((p) => {
      const firstUserMsg = p.messages.find((m) => m.role === "user");
      return firstUserMsg && detectCategory(firstUserMsg.content) === category;
    });

    if (sameCategory.length < 3) return null;

    // Analyze what edits users commonly make after the initial build
    const editCounts: Record<string, { count: number; example: string }> = {};
    for (const project of sameCategory) {
      const userMsgs = project.messages.filter((m) => m.role === "user").slice(1); // Skip the build prompt
      const seen = new Set<string>();
      for (const msg of userMsgs.slice(0, 5)) {
        const key = normalizeEdit(msg.content);
        if (!seen.has(key)) {
          if (!editCounts[key]) editCounts[key] = { count: 0, example: msg.content };
          editCounts[key].count++;
          seen.add(key);
        }
      }
    }

    // Find features that >40% of users in this category add
    const total = sameCategory.length;
    const common = Object.entries(editCounts)
      .filter(([, v]) => v.count / total >= 0.4)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4);

    if (common.length === 0) return null;

    const FEATURE_MAP: Record<string, string> = {
      add_cart: "shopping cart with add-to-cart buttons",
      add_checkout: "checkout page",
      add_reviews: "customer testimonials section",
      add_contact_form: "contact form",
      add_booking: "booking/appointment form",
      add_gallery: "photo gallery",
      add_pricing: "pricing section",
      add_menu: "full menu with items and prices",
      add_faq: "FAQ section",
      add_newsletter: "newsletter signup",
      add_map: "location map",
      add_team: "team profiles",
      add_hours: "business hours",
      add_phone: "phone number with click-to-call",
    };

    const features = common
      .map(([key]) => FEATURE_MAP[key] || key.replace(/_/g, " "))
      .filter(Boolean);

    return `AUTO-INCLUDE these features (${Math.round((common[0][1].count / total) * 100)}%+ of similar users add them): ${features.join(", ")}. Build them into the initial version.`;
  } catch {
    return null;
  }
}

// ─── Track mistakes and learn ───────────────────────────────────────────────

export async function getRecentMistakes(category: string): Promise<string | null> {
  try {
    // Find projects where the AI response was "Error:" — these are failures to learn from
    const recentProjects = await prisma.project.findMany({
      where: { updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 20 },
      },
      take: 50,
    });

    const sameCategory = recentProjects.filter((p) => {
      const firstUserMsg = p.messages.find((m) => m.role === "user");
      return firstUserMsg && detectCategory(firstUserMsg.content) === category;
    });

    // Find edits that were immediately followed by the same edit (user had to retry = failure)
    const retries: string[] = [];
    for (const project of sameCategory) {
      const userMsgs = project.messages.filter((m) => m.role === "user");
      for (let i = 1; i < userMsgs.length - 1; i++) {
        const current = normalizeEdit(userMsgs[i].content);
        const next = normalizeEdit(userMsgs[i + 1].content);
        if (current === next) {
          retries.push(userMsgs[i].content);
        }
      }
    }

    if (retries.length === 0) return null;

    const uniqueRetries = [...new Set(retries.map(normalizeEdit))].slice(0, 3);
    return `KNOWN ISSUES for this type of site: Users often need to retry these edits, so be extra careful: ${uniqueRetries.join(", ")}. Make sure these work on the first try.`;
  } catch {
    return null;
  }
}
