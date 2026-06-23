import Link from "next/link";
import Logo from "@/components/Logo";
import { auth } from "@/lib/auth";

const TIERS = [
  {
    name: "Plus",
    price: "$9",
    period: "/ month",
    desc: "For individuals building side projects and personal apps.",
    features: [
      "15 apps",
      "Unlimited edits per app",
      "Live preview",
      "thatcode.dev subdomain",
      "Visit analytics",
      "Email support",
    ],
    cta: "Start Plus →",
    ctaLoggedIn: "Buy credits →",
    href: "/signup",
    hrefLoggedIn: "/dashboard?buy=1",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    desc: "For builders who ship real products to real users.",
    features: [
      "Unlimited apps",
      "Private projects",
      "Custom domains",
      "Password protection",
      "GitHub export",
      "Fork & clone projects",
      "Priority AI (Claude Sonnet)",
      "Remove ThatCode badge",
      "Priority email support",
    ],
    cta: "Start Pro →",
    ctaLoggedIn: "Buy credits →",
    href: "/signup",
    hrefLoggedIn: "/dashboard?buy=1",
    highlight: true,
  },
  {
    name: "Business",
    price: "$49",
    period: "/ month",
    desc: "For teams and agencies building client projects at scale.",
    features: [
      "Everything in Pro",
      "5 seats included",
      "Shared project library",
      "Team permissions",
      "API access",
      "White-label publishing",
      "Dedicated Slack support",
    ],
    cta: "Start Business →",
    ctaLoggedIn: "Contact us",
    href: "/signup",
    hrefLoggedIn: "mailto:hi@thatcode.dev",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For organizations that need security, compliance, and SLAs.",
    features: [
      "Everything in Business",
      "Unlimited seats",
      "SSO / SAML",
      "SOC 2 compliance",
      "Dedicated infrastructure",
      "Custom AI model routing",
      "SLA guarantee",
      "Dedicated account manager",
    ],
    cta: "Contact sales",
    ctaLoggedIn: "Contact sales",
    href: "mailto:hi@thatcode.dev",
    hrefLoggedIn: "mailto:hi@thatcode.dev",
    highlight: false,
  },
] as const;

const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings any time — no questions, no retention loops.",
  },
  {
    q: "What happens to my apps if I downgrade?",
    a: "Your apps stay live. Published projects remain accessible. You just won't be able to create new ones past the plan limit until you upgrade again.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Start free with no credit card required. Upgrade when you're ready.",
  },
  {
    q: "What AI models does ThatCode use?",
    a: "We route between Claude Sonnet, Claude Haiku, and Gemini 2.5 Flash based on task complexity. Pro users always get the best available model.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes, on Pro and above. Add any domain you own, set a CNAME record, and your app is live at your own URL in minutes.",
  },
  {
    q: "How do credits work?",
    a: "Credits power AI generations. Simple edits cost ~0.3–1 credit, new features 2–4 credits, and full app builds 3–8 credits. Credits never expire.",
  },
];

export default async function PricingPage() {
  const session = await auth();
  const loggedIn = !!session?.user;

  return (
    <div style={{ background: "#f6f6f8", minHeight: "100vh" }}>
      {/* Nav */}
      <header>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/"><Logo size="md" /></Link>
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <Link href="/dashboard" className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg,#6a1ff7,#0a8ff0)", boxShadow: "0 6px 22px rgba(106,31,247,0.25)" }}>
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm" style={{ color: "#71717f" }}>Log in</Link>
                <Link href="/signup" className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ background: "linear-gradient(135deg,#6a1ff7,#0a8ff0)", boxShadow: "0 6px 22px rgba(106,31,247,0.25)" }}>
                  Start free
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-28 pt-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl" style={{ color: "#17171c", letterSpacing: "-0.045em" }}>
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-base" style={{ color: "#71717f" }}>
            {loggedIn ? "Add credits to your account — they never expire." : "Start for free. Upgrade when you're ready to ship."}
          </p>
        </div>

        {/* Free tier strip */}
        <div className="mb-6 flex items-center justify-between rounded-2xl px-6 py-4"
          style={{ background: "#ffffff", border: "1px solid #ececf1" }}>
          <div>
            <span className="text-sm font-semibold" style={{ color: "#17171c" }}>Free</span>
            <span className="ml-3 text-sm" style={{ color: "#71717f" }}>5 apps · Live preview · thatcode.dev subdomain · Community support</span>
          </div>
          <Link href={loggedIn ? "/dashboard" : "/signup"}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px"
            style={{ background: "#f0f0f5", color: "#17171c", border: "1px solid #ececf1" }}>
            {loggedIn ? "Go to dashboard" : "Get started free"}
          </Link>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className="relative flex flex-col overflow-hidden rounded-2xl p-6"
              style={
                t.highlight
                  ? { background: "linear-gradient(145deg,#f0ecff,#e8e4ff)", border: "1px solid rgba(106,31,247,0.3)", boxShadow: "0 0 60px rgba(106,31,247,0.08)" }
                  : { background: "#ffffff", border: "1px solid #ececf1" }
              }
            >
              {t.highlight && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(106,31,247,0.4),transparent)" }} />
              )}
              {t.highlight && (
                <div className="mb-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: "rgba(106,31,247,0.1)", color: "#6a1ff7", border: "1px solid rgba(106,31,247,0.25)" }}>
                  Most popular
                </div>
              )}
              <h3 className="text-sm font-semibold" style={{ color: "#17171c" }}>{t.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold" style={{ color: "#17171c", letterSpacing: "-0.04em" }}>{t.price}</span>
                {t.period && <span className="text-sm" style={{ color: "#71717f" }}>{t.period}</span>}
              </div>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "#71717f" }}>{t.desc}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "#51515c" }}>
                    <span className="mt-0.5 shrink-0 text-[10px]" style={{ color: "#4ade80" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={loggedIn ? t.hrefLoggedIn : t.href}
                className="mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all hover:-translate-y-px"
                style={
                  t.highlight
                    ? { background: "linear-gradient(135deg,#6a1ff7,#0a8ff0)", color: "#fff", boxShadow: "0 8px 24px rgba(106,31,247,0.25)" }
                    : { background: "#f0f0f5", color: "#17171c", border: "1px solid #ececf1" }
                }
              >
                {loggedIn ? t.ctaLoggedIn : t.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="mb-8 text-center text-2xl font-bold" style={{ color: "#17171c", letterSpacing: "-0.04em" }}>
            Frequently asked questions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #ececf1" }}>
                <p className="mb-2 text-sm font-semibold" style={{ color: "#17171c" }}>{f.q}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#71717f" }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
