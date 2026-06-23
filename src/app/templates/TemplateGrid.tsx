"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  desc: string;
  category: string;
  emoji: string;
  accent: string;
  tags: string[];
  prompt: string;
}

const TEMPLATES: Template[] = [
  // E-Commerce
  {
    id: "ecommerce-store",
    name: "E-Commerce Store",
    desc: "Product grid, cart, checkout, order management, and admin panel.",
    category: "E-Commerce",
    emoji: "🛍️",
    accent: "#f59e0b",
    tags: ["cart", "checkout", "admin"],
    prompt: "Build a modern e-commerce store with a product grid (12 products with images, prices, categories), shopping cart with quantity controls, checkout form with address and payment fields, order confirmation screen, and a password-protected admin panel to add/edit/delete products with image uploads. Use a clean light theme with warm accent colors.",
  },
  {
    id: "saas-dashboard",
    name: "SaaS Dashboard",
    desc: "Analytics, metrics, charts, user table, and sidebar navigation.",
    category: "SaaS",
    emoji: "📊",
    accent: "#6d5fff",
    tags: ["analytics", "charts", "metrics"],
    prompt: "Build a SaaS analytics dashboard with a left sidebar navigation, key metric cards (revenue, users, conversion, churn), a line chart showing monthly revenue, a bar chart for user growth, a recent activity feed, and a users table with search and filter. Use a dark theme with purple accents.",
  },
  {
    id: "crm",
    name: "CRM System",
    desc: "Contacts, deals pipeline, activity log, and company management.",
    category: "Business",
    emoji: "🤝",
    accent: "#0ea5e9",
    tags: ["contacts", "pipeline", "deals"],
    prompt: "Build a full CRM system like Salesforce with: a contacts list with search and filters, a Kanban deal pipeline with drag-and-drop across stages (Lead, Qualified, Proposal, Closed Won/Lost), company profiles, an activity timeline for each contact, and a dashboard with pipeline value and win rate stats. Dense data-heavy UI with dark blue theme.",
  },
  {
    id: "restaurant",
    name: "Restaurant Website",
    desc: "Menu, reservations, gallery, and online ordering.",
    category: "Hospitality",
    emoji: "🍽️",
    accent: "#dc2626",
    tags: ["menu", "reservations", "ordering"],
    prompt: "Build an upscale restaurant website with: a hero section with the restaurant name and atmosphere, a full menu with categories (Starters, Mains, Desserts, Drinks) and beautiful food cards with prices, an online reservation form with date/time/party size, a photo gallery, and contact info with embedded map placeholder. Warm, sophisticated design with dark red accents.",
  },
  {
    id: "project-management",
    name: "Project Manager",
    desc: "Kanban board, tasks, team members, deadlines, and sprints.",
    category: "Productivity",
    emoji: "📋",
    accent: "#10b981",
    tags: ["kanban", "tasks", "team"],
    prompt: "Build a project management app like Linear with: a Kanban board with drag-and-drop (Backlog, In Progress, Review, Done), task cards with assignees, priority badges, and due dates, a project sidebar, sprint planning view, team member list, and a burndown chart. Dark minimal design with green accents.",
  },
  {
    id: "landing-page",
    name: "SaaS Landing Page",
    desc: "Hero, features, pricing, testimonials, and CTA sections.",
    category: "Marketing",
    emoji: "🚀",
    accent: "#8b5cf6",
    tags: ["hero", "pricing", "testimonials"],
    prompt: "Build a stunning SaaS landing page with: an animated hero section with a headline and product screenshot mockup, a features section with 6 feature cards, a social proof bar with logos, a pricing section with 3 tiers (Free/Pro/Team), a testimonials carousel with 4 customer quotes, and a final CTA section. Modern dark design with violet gradient accents.",
  },
  {
    id: "blog",
    name: "Blog / Publication",
    desc: "Article feed, categories, rich post view, and author profiles.",
    category: "Content",
    emoji: "✍️",
    accent: "#f97316",
    tags: ["articles", "categories", "editor"],
    prompt: "Build a modern blog/publication platform with: a homepage with featured article hero and article grid, category filtering (Tech, Design, Business, Life), individual article view with rich typography, estimated read time, author bio, table of contents, related articles, and a dark/light mode toggle. Editorial magazine aesthetic.",
  },
  {
    id: "inventory",
    name: "Inventory System",
    desc: "Stock tracking, SKUs, reorder alerts, suppliers, and reports.",
    category: "Business",
    emoji: "📦",
    accent: "#f59e0b",
    tags: ["stock", "SKU", "suppliers"],
    prompt: "Build an inventory management system with: a product list with SKU, stock level, reorder point, and supplier columns, low-stock alert badges, a stock movement log, supplier management, purchase order creation, and charts for stock value and top products. Dark warehouse aesthetic with amber accents.",
  },
  {
    id: "booking",
    name: "Booking System",
    desc: "Calendar, appointments, service selection, and confirmation.",
    category: "Services",
    emoji: "📅",
    accent: "#06b6d4",
    tags: ["calendar", "appointments", "services"],
    prompt: "Build an appointment booking system for a salon/spa with: a service selection step (Haircut, Color, Massage, Facial with prices), a calendar date picker showing available slots, a time slot grid, a booking form with customer details, confirmation screen with booking ID, and an admin view to see all upcoming appointments. Clean light theme with teal accents.",
  },
  {
    id: "social-feed",
    name: "Social Media Feed",
    desc: "Posts, likes, comments, stories, following, and profile pages.",
    category: "Social",
    emoji: "💬",
    accent: "#ec4899",
    tags: ["posts", "likes", "comments"],
    prompt: "Build a social media app like Instagram with: a feed of posts with images (use colored placeholders), like/comment/share buttons, a stories bar at the top, a user profile page with post grid, a notifications panel, a search page with trending posts and user suggestions, and a compose post modal. Dark minimal design with pink accents.",
  },
  {
    id: "job-board",
    name: "Job Board",
    desc: "Job listings, filters, company profiles, and apply flow.",
    category: "HR",
    emoji: "💼",
    accent: "#3b82f6",
    tags: ["jobs", "filters", "apply"],
    prompt: "Build a job board like LinkedIn/Lever with: a searchable job listing with filters (role, location, salary, type), individual job detail pages, company profile pages with their open roles, an application modal with resume upload, a saved jobs list, and a recruiter dashboard to post and manage job listings. Clean professional light design.",
  },
  {
    id: "finance-tracker",
    name: "Finance Tracker",
    desc: "Income, expenses, budgets, categories, and monthly reports.",
    category: "Finance",
    emoji: "💰",
    accent: "#22c55e",
    tags: ["budget", "expenses", "reports"],
    prompt: "Build a personal finance tracker with: an overview dashboard showing total income, expenses, savings rate, and net worth, a transaction list with categories and merchant names, budget progress bars per category, a monthly spending breakdown pie chart, a savings goals tracker, and the ability to add/edit/delete transactions. Dark premium design with green accents.",
  },
  {
    id: "real-estate",
    name: "Real Estate Listings",
    desc: "Property grid, map view, filters, and property detail pages.",
    category: "Real Estate",
    emoji: "🏠",
    accent: "#0891b2",
    tags: ["listings", "map", "filters"],
    prompt: "Build a real estate listings site with: a property grid with price, beds, baths, and square footage, advanced filters (price range, property type, beds/baths, city), a map placeholder view, individual property detail pages with photo gallery, specs table, and neighborhood info, and a favorite/save feature. Clean modern design like Zillow.",
  },
  {
    id: "fitness-app",
    name: "Fitness Tracker",
    desc: "Workouts, exercises, progress charts, and weekly plans.",
    category: "Health",
    emoji: "💪",
    accent: "#ef4444",
    tags: ["workouts", "exercises", "progress"],
    prompt: "Build a fitness tracking app with: a workout dashboard showing weekly activity, today's workout plan, a full exercise library with muscle groups and demo descriptions, a workout builder to create custom routines, progress charts for weight/reps over time, a streak tracker, and body measurements log. Bold dark design with red accents.",
  },
  {
    id: "education",
    name: "Online Course Platform",
    desc: "Course catalog, video lessons, progress tracking, and quizzes.",
    category: "Education",
    emoji: "🎓",
    accent: "#8b5cf6",
    tags: ["courses", "lessons", "progress"],
    prompt: "Build an online learning platform like Udemy with: a course catalog with ratings, enrolled count, and difficulty levels, individual course pages with a lesson list and progress bar, a video player placeholder with lesson notes, a quiz component with multiple choice questions, a student dashboard showing enrolled courses and certificates, and an instructor view to create courses. Modern clean design.",
  },
  {
    id: "kanban",
    name: "Kanban Board",
    desc: "Drag-and-drop cards, columns, labels, due dates, and team.",
    category: "Productivity",
    emoji: "🗂️",
    accent: "#6366f1",
    tags: ["kanban", "drag-drop", "tasks"],
    prompt: "Build a beautiful Kanban board like Trello/Notion with: drag-and-drop cards between columns (To Do, In Progress, Review, Done), card creation with title, description, assignee, priority label (High/Medium/Low), and due date, column management (add/rename/delete), card detail modal, and a board filter by assignee and label. Dark design with indigo accents.",
  },
  {
    id: "portfolio",
    name: "Developer Portfolio",
    desc: "Hero, projects showcase, skills, experience, and contact.",
    category: "Personal",
    emoji: "👨‍💻",
    accent: "#14b8a6",
    tags: ["projects", "skills", "contact"],
    prompt: "Build a stunning developer portfolio with: an animated hero section with name, title, and typewriter role animation, a projects showcase with 6 project cards (title, description, tech stack badges, live/GitHub links), a skills section with progress bars or tag clouds, a timeline work experience section, a contact form, and dark/light toggle. Bold modern design with teal accents.",
  },
  {
    id: "invoice",
    name: "Invoice Generator",
    desc: "Create invoices, line items, client management, and PDF export.",
    category: "Business",
    emoji: "🧾",
    accent: "#64748b",
    tags: ["invoices", "clients", "PDF"],
    prompt: "Build an invoice generator with: a client list with company name and contact info, invoice creation with line items (description, quantity, rate), automatic total/tax/subtotal calculation, invoice status (Draft, Sent, Paid, Overdue) badges, a preview that looks like a real invoice, a list of all invoices with totals, and a dashboard showing total revenue and outstanding amounts. Clean professional light design.",
  },
  {
    id: "chat-app",
    name: "Chat Application",
    desc: "Conversations, rooms, members, reactions, and file sharing.",
    category: "Social",
    emoji: "💬",
    accent: "#6d5fff",
    tags: ["chat", "rooms", "messages"],
    prompt: "Build a chat application like Slack/Discord with: a left sidebar with channels and direct messages list, message bubbles with avatars, timestamps, and reaction emoji support, a message input with emoji picker and file attachment button, channel creation, user mentions with @name highlighting, unread badges, and a user presence indicator (online/away/offline). Dark design with purple accents.",
  },
  {
    id: "admin-dashboard",
    name: "Admin Dashboard",
    desc: "User management, system metrics, logs, settings, and roles.",
    category: "SaaS",
    emoji: "⚙️",
    accent: "#0ea5e9",
    tags: ["users", "roles", "logs"],
    prompt: "Build a comprehensive admin dashboard with: a sidebar with Dashboard, Users, Analytics, Logs, and Settings sections. Dashboard: system health metrics and quick stats. Users: searchable table with role badges, actions (edit/suspend/delete), and a user detail modal. Analytics: daily active users chart and revenue graph. Logs: filterable activity log with timestamps. Settings: appearance, email, and security config. Dark professional design with blue accents.",
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

export default function TemplateGrid({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = category === "All" || t.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q));
    return matchCat && matchSearch;
  });

  async function useTemplate(template: Template) {
    if (!isLoggedIn) {
      router.push(`/signup?template=${template.id}`);
      return;
    }
    setLoading(template.id);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: template.name }),
      });
      const project = await res.json();
      router.push(`/projects/${project.id}?prompt=${encodeURIComponent(template.prompt)}`);
    } catch {
      setLoading(null);
    }
  }

  return (
    <div>
      {/* Search + filter */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates…"
          className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          style={{ background: "#ffffff", border: "1px solid rgba(255,255,255,0.09)", color: "#17171c" }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(106,31,247,0.5)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
        />
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
              style={
                category === c
                  ? { background: "rgba(106,31,247,0.22)", color: "#a78bfa", border: "1px solid rgba(106,31,247,0.35)" }
                  : { background: "rgba(0,0,0,0.03)", color: "#71717f", border: "1px solid #ececf1" }
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="group relative overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-1"
            style={{ background: "#ffffff", border: "1px solid #ececf1" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${t.accent}55`;
              e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${t.accent}22`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#ececf1";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Preview area */}
            <div
              className="relative flex h-32 items-center justify-center overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${t.accent}18, ${t.accent}08)` }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(ellipse 80% 80% at 50% 0%, ${t.accent}30 0%, transparent 70%)` }}
              />
              <span className="relative text-5xl" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>
                {t.emoji}
              </span>
              {/* Category badge */}
              <div
                className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: `${t.accent}22`, color: t.accent, border: `1px solid ${t.accent}44` }}
              >
                {t.category}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="mb-1 text-sm font-semibold" style={{ color: "#17171c" }}>{t.name}</h3>
              <p className="mb-3 text-xs leading-relaxed" style={{ color: "#71717f" }}>{t.desc}</p>
              <div className="mb-4 flex flex-wrap gap-1">
                {t.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#5b6070", border: "1px solid #ececf1" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => useTemplate(t)}
                disabled={loading === t.id}
                className="w-full rounded-xl py-2 text-xs font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent}cc)`, boxShadow: `0 4px 16px ${t.accent}30` }}
              >
                {loading === t.id ? "Creating…" : "Use template →"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center" style={{ color: "#71717f" }}>
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">No templates match &quot;{search}&quot;</p>
        </div>
      )}
    </div>
  );
}
