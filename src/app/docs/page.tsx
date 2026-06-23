import Link from "next/link";
import Logo from "@/components/Logo";

const SECTIONS = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      {
        title: "Your first app",
        content: `Sign up for free at thatcode.dev. Once logged in, you'll land on your dashboard. Type what you want to build in the text box — be as descriptive as you like — and press Enter or click Build.\n\nThatCode will write the code and open a live preview in seconds. You can keep chatting to make changes.`,
      },
      {
        title: "Describing what you want",
        content: `The more specific you are, the better the result. Instead of "make a website", try "build a landing page for a fitness app with a hero section, pricing table, and contact form".\n\nYou can also paste screenshots into the chat — ThatCode will read them and match the design.`,
      },
    ],
  },
  {
    id: "editing",
    title: "Editing your app",
    items: [
      {
        title: "Chatting with your app",
        content: `Once your app is built, keep chatting to refine it. You can say things like:\n\n• "Make the button bigger"\n• "Change the color scheme to dark blue"\n• "Add a search bar to the top"\n• "Make it mobile responsive"\n\nEvery change creates a new version so nothing is ever lost.`,
      },
      {
        title: "Fixing errors",
        content: `If your app has a JavaScript error, a banner will appear. Type "fix" in the chat and ThatCode will diagnose and repair the broken code while leaving everything else exactly as it was.`,
      },
      {
        title: "Version history",
        content: `Click History in the top bar to see every build. You can preview and restore any past version. Each one is permanent — nothing gets deleted.`,
      },
    ],
  },
  {
    id: "publishing",
    title: "Publishing",
    items: [
      {
        title: "Publish to thatcode.dev",
        content: `Click Publish in the top-right corner. Choose a slug (e.g. my-project) and your app will be live at my-project.thatcode.dev instantly. Every time you make changes and they rebuild, the live URL updates automatically.`,
      },
      {
        title: "Custom domains",
        content: `On the Pro plan, enter your own domain in the Publish dialog. ThatCode will register it with our CDN and show you a CNAME record to add at your DNS provider.\n\nOnce the record propagates (usually under 5 minutes), your app is live at your domain.`,
      },
      {
        title: "Password protection",
        content: `Toggle "Password protect" in the Publish dialog and set a password. Visitors will see a clean gate before they can view your app — useful for client previews or private betas.`,
      },
    ],
  },
  {
    id: "exporting",
    title: "Exporting",
    items: [
      {
        title: "Export to GitHub",
        content: `Click Export App → GitHub in the top bar. Paste your GitHub token (needs repo scope), choose a repo name and visibility, and ThatCode will create the repo and push all files automatically.`,
      },
      {
        title: "Fork a project",
        content: `From your dashboard, hover over any project and click Fork. A full copy is created in your account — useful for experimenting without touching the original.`,
      },
    ],
  },
  {
    id: "ai-models",
    title: "AI models",
    items: [
      {
        title: "How model routing works",
        content: `ThatCode automatically picks the best model for each request:\n\n• Simple tweaks → Claude Haiku (fast, cheap)\n• Most builds → Claude Sonnet or GPT-4o\n• Complex apps → Claude Sonnet 4.6 or Gemini 2.5 Flash\n\nPro users always get priority routing to the strongest available model.`,
      },
      {
        title: "Forcing a specific model",
        content: `You can override model selection by opening the model picker next to the send button. Useful when you want to ensure a specific capability for a particular build.`,
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <div style={{ background: "#f6f6f8", minHeight: "100vh" }}>
      {/* Nav */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/"><Logo size="md" /></Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm" style={{ color: "#7a8099" }}>Log in</Link>
            <Link
              href="/signup"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg,#6d5fff,#5b4ee0)", boxShadow: "0 6px 22px rgba(109,95,255,0.35)" }}
            >
              Start free
            </Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto flex max-w-6xl gap-0 px-6 py-12">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 pr-8 lg:block">
          <nav className="sticky top-8 space-y-1">
            {SECTIONS.map((s) => (
              <div key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-white"
                  style={{ color: "#4b5263", letterSpacing: "0.08em" }}
                >
                  {s.title}
                </a>
                {s.items.map((item) => (
                  <a
                    key={item.title}
                    href={`#${s.id}`}
                    className="block rounded-lg px-3 py-1 text-sm transition-colors hover:bg-white/5"
                    style={{ color: "#7a8099" }}
                  >
                    {item.title}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="mb-10">
            <h1 className="text-3xl font-bold" style={{ color: "#eef0f6", letterSpacing: "-0.04em" }}>
              Documentation
            </h1>
            <p className="mt-2 text-sm" style={{ color: "#7a8099" }}>
              Everything you need to know to build and ship apps with ThatCode.
            </p>
          </div>

          <div className="space-y-16">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-8">
                <h2
                  className="mb-6 text-xl font-bold"
                  style={{ color: "#eef0f6", letterSpacing: "-0.03em", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 12 }}
                >
                  {s.title}
                </h2>
                <div className="space-y-8">
                  {s.items.map((item) => (
                    <div key={item.title}>
                      <h3 className="mb-3 text-base font-semibold" style={{ color: "#c4cad6" }}>
                        {item.title}
                      </h3>
                      <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid rgba(255,255,255,0.07)" }}>
                        {item.content.split("\n\n").map((para, i) => (
                          <p key={i} className={`text-sm leading-relaxed ${i > 0 ? "mt-3" : ""}`} style={{ color: "#7a8099", whiteSpace: "pre-line" }}>
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
