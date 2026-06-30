import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MODELS, estimateCost, scoreComplexity } from "@/lib/generate";

const OWNER_EMAIL = "ydbender28@gmail.com";

function calcCost(modelDisplay: string, inputTokens: number, outputTokens: number): number {
  const found = Object.values(MODELS).find(m => m.displayName === modelDisplay);
  if (!found) return 0;
  return estimateCost(found.model, inputTokens, outputTokens);
}

function fmt(n: number) {
  return n < 0.01 ? "<$0.01" : `$${n.toFixed(4)}`;
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.email !== OWNER_EMAIL) redirect("/dashboard");

  const versions = await prisma.version.findMany({
    orderBy: { createdAt: "desc" },
    include: { project: { select: { name: true, deletedAt: true, owner: { select: { email: true } } } } },
  });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, plan: true, credits: true, createdAt: true },
  });

  const totalProjects = await prisma.project.count({ where: { deletedAt: null } });
  const publishedProjects = await prisma.project.count({ where: { publishSlug: { not: null }, deletedAt: null } });
  const planCounts = await prisma.user.groupBy({ by: ["plan"], _count: true });

  const recentProjects = await prisma.project.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, name: true, createdAt: true, publishSlug: true, owner: { select: { email: true } } },
  });

  // Aggregate by model
  const byModel: Record<string, { count: number; inputTokens: number; outputTokens: number; cost: number }> = {};
  let totalCost = 0;

  for (const v of versions) {
    const model = v.modelUsed ?? "Unknown";
    if (!byModel[model]) byModel[model] = { count: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    byModel[model].count++;
    byModel[model].inputTokens += v.inputTokens ?? 0;
    byModel[model].outputTokens += v.outputTokens ?? 0;
    const cost = calcCost(model, v.inputTokens ?? 0, v.outputTokens ?? 0);
    byModel[model].cost += cost;
    totalCost += cost;
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8] text-[#17171c] p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">ThatCode Admin</h1>
            <p className="text-[#71717f] text-sm">Usage and cost overview</p>
          </div>
          <Link href="/dashboard" className="text-xs text-[#71717f] hover:text-[#17171c] transition-colors">← Dashboard</Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total users", value: users.length, color: "#3b82f6" },
            { label: "Total projects", value: totalProjects, color: "#8b5cf6" },
            { label: "Published sites", value: publishedProjects, color: "#10b981" },
            { label: "Total builds", value: versions.length, color: "#6a1ff7" },
            { label: "Total cost", value: fmt(totalCost), color: "#f59e0b" },
            { label: "Avg cost/build", value: versions.length ? fmt(totalCost / versions.length) : "$0", color: "#ef4444" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-[#ececf1] bg-white p-4" style={{ borderLeft: `3px solid ${color}` }}>
              <p className="text-xs text-[#71717f] mb-1">{label}</p>
              <p className="text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {/* Plan breakdown */}
        <div>
          <h2 className="text-sm font-semibold text-[#71717f] mb-3">Plan breakdown</h2>
          <div className="flex flex-wrap gap-3">
            {planCounts.map(({ plan, _count }) => {
              const colors: Record<string, string> = { free: "#6b7280", pro: "#3b82f6", team: "#8b5cf6", owner: "#f59e0b" };
              const color = colors[plan] ?? "#6b7280";
              return (
                <div key={plan} className="flex items-center gap-2 rounded-lg border border-[#ececf1] bg-white px-4 py-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-sm font-medium capitalize">{plan}</span>
                  <span className="text-sm text-[#71717f] font-mono">{_count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Routing logic explainer */}
        <div>
          <h2 className="text-sm font-semibold text-[#71717f] mb-3">Model routing logic</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["simple", "medium", "complex"] as const).map(tier => {
              const colors = { simple: "green", medium: "yellow", complex: "fuchsia" };
              const c = colors[tier];
              const example = {
                simple: '"add a button", "change color", short edits',
                medium: '"add search", "make a form", "add a table"',
                complex: '"build a dashboard", "add auth", "payment checkout"',
              }[tier];
              const thresholds = {
                simple: "score < 2",
                medium: "score 2–5",
                complex: "score ≥ 6",
              }[tier];
              // Find which model would be picked for this tier
              const models = {
                simple: ["GPT-5.4 nano", "Claude Haiku"],
                medium: ["GPT-5.4 mini", "Claude Haiku"],
                complex: ["Claude Sonnet", "GPT-5.4", "Claude Haiku"],
              }[tier];
              return (
                <div key={tier} className={`rounded-xl border border-[#ececf1] bg-white p-4 space-y-3`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${c === "green" ? "text-green-400" : c === "yellow" ? "text-yellow-400" : "text-[#6a1ff7]"}`}>{tier}</span>
                    <span className="text-[10px] text-gray-600 font-mono ml-auto">{thresholds}</span>
                  </div>
                  <p className="text-[10px] text-[#71717f] leading-relaxed">{example}</p>
                  <div className="space-y-1">
                    {models.map((m, i) => (
                      <div key={m} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 w-3">{i + 1}.</span>
                        <span className={`text-xs ${i === 0 ? "text-[#17171c] font-medium" : "text-[#71717f]"}`}>{m}</span>
                        {i === 0 && <span className="text-[10px] text-green-400 ml-auto">primary</span>}
                        {i > 0 && <span className="text-[10px] text-gray-700 ml-auto">fallback</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-600 mt-2">
            Scoring: prompt length + keyword detection (dashboard+2, auth+3, payment+3, etc.). Each provider is tried in order; if it fails it&apos;s skipped for the rest of the session. Claude is always primary since it&apos;s most reliable.
          </p>
        </div>

        {/* Live scoring demo */}
        <div>
          <h2 className="text-sm font-semibold text-[#71717f] mb-3">How recent prompts were scored</h2>
          <div className="rounded-xl border border-[#ececf1] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#fbfbfc] text-[#71717f] text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Project</th>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Model used</th>
                  <th className="text-right px-4 py-3">Tokens</th>
                  <th className="text-right px-4 py-3">Cost</th>
                  <th className="text-right px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececf1]">
                {versions.slice(0, 20).map((v) => {
                  const cost = calcCost(v.modelUsed ?? "", v.inputTokens ?? 0, v.outputTokens ?? 0);
                  const modelColor = (v.modelUsed ?? "").includes("Haiku") ? "text-green-400"
                    : (v.modelUsed ?? "").includes("Sonnet") ? "text-[#6a1ff7]"
                    : (v.modelUsed ?? "").includes("GPT") ? "text-blue-400"
                    : "text-yellow-400";
                  return (
                    <tr key={v.id} className="hover:bg-[#fbfbfc]">
                      <td className="px-4 py-3 font-medium truncate max-w-[200px]">
                        <a href={`/projects/${v.projectId}`} className="hover:text-[#6a1ff7] transition-colors" title="Open project">
                          {v.project.name}
                        </a>
                        {v.project.deletedAt && <span className="ml-1 text-[10px] text-red-400/70">(deleted)</span>}
                      </td>
                      <td className="px-4 py-3 text-[#71717f] text-xs truncate max-w-[160px]">{v.project.owner?.email ?? "—"}</td>
                      <td className={`px-4 py-3 font-medium ${modelColor}`}>{v.modelUsed ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-[#71717f] font-mono text-xs">{((v.inputTokens ?? 0) + (v.outputTokens ?? 0)).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{cost < 0.0001 ? "<$0.0001" : `$${cost.toFixed(4)}`}</td>
                      <td className="px-4 py-3 text-right text-[#71717f] text-xs">{new Date(v.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* By model */}
        <div>
          <h2 className="text-sm font-semibold text-[#71717f] mb-3">Usage by model</h2>
          <div className="rounded-xl border border-[#ececf1] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#fbfbfc] text-[#71717f] text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Model</th>
                  <th className="text-right px-4 py-3">Generations</th>
                  <th className="text-right px-4 py-3">Input tokens</th>
                  <th className="text-right px-4 py-3">Output tokens</th>
                  <th className="text-right px-4 py-3">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececf1]">
                {Object.entries(byModel).sort((a, b) => b[1].cost - a[1].cost).map(([model, stats]) => (
                  <tr key={model} className="hover:bg-[#fbfbfc]">
                    <td className="px-4 py-3 font-medium">{model}</td>
                    <td className="px-4 py-3 text-right text-[#71717f]">{stats.count}</td>
                    <td className="px-4 py-3 text-right text-[#71717f]">{stats.inputTokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-[#71717f]">{stats.outputTokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-[#6a1ff7] font-mono">{fmt(stats.cost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#fbfbfc] font-semibold">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{versions.length}</td>
                  <td className="px-4 py-3 text-right">{Object.values(byModel).reduce((s, m) => s + m.inputTokens, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{Object.values(byModel).reduce((s, m) => s + m.outputTokens, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[#6a1ff7] font-mono">{fmt(totalCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Recent Users */}
        <div>
          <h2 className="text-sm font-semibold text-[#71717f] mb-3">Recent signups ({users.length} total)</h2>
          <div className="rounded-xl border border-[#ececf1] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#fbfbfc] text-[#71717f] text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-right px-4 py-3">Credits</th>
                  <th className="text-right px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececf1]">
                {users.map((u) => {
                  const planColors: Record<string, string> = { free: "#6b7280", pro: "#3b82f6", team: "#8b5cf6", owner: "#f59e0b" };
                  const planColor = planColors[u.plan] ?? "#6b7280";
                  return (
                    <tr key={u.id} className="hover:bg-[#fbfbfc]">
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${planColor}18`, color: planColor }}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#71717f] font-mono">{u.credits.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right text-[#71717f]">
                        {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <h2 className="text-sm font-semibold text-[#71717f] mb-3">Recent projects</h2>
          <div className="rounded-xl border border-[#ececf1] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#fbfbfc] text-[#71717f] text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Owner</th>
                  <th className="text-left px-4 py-3">Published</th>
                  <th className="text-right px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececf1]">
                {recentProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fbfbfc]">
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">
                      <a href={`/projects/${p.id}`} className="hover:text-[#6a1ff7] transition-colors">{p.name}</a>
                    </td>
                    <td className="px-4 py-3 text-[#71717f] text-xs truncate max-w-[160px]">{p.owner.email}</td>
                    <td className="px-4 py-3">
                      {p.publishSlug
                        ? <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-600">live</span>
                        : <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">draft</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right text-[#71717f] text-xs">
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent generations */}
        <div>
          <h2 className="text-sm font-semibold text-[#71717f] mb-3">Recent generations</h2>
          <div className="rounded-xl border border-[#ececf1] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#fbfbfc] text-[#71717f] text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Project</th>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Model</th>
                  <th className="text-right px-4 py-3">Tokens</th>
                  <th className="text-right px-4 py-3">Cost</th>
                  <th className="text-right px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececf1]">
                {versions.slice(0, 50).map((v) => (
                  <tr key={v.id} className="hover:bg-[#fbfbfc]">
                    <td className="px-4 py-3 font-medium truncate max-w-[150px]">
                      {v.project.name}
                      {v.project.deletedAt && <span className="ml-1 text-[10px] text-red-400/70">(deleted)</span>}
                    </td>
                    <td className="px-4 py-3 text-[#71717f] truncate max-w-[150px]">{v.project.owner.email}</td>
                    <td className="px-4 py-3">{v.modelUsed ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-[#71717f]">{((v.inputTokens ?? 0) + (v.outputTokens ?? 0)).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-[#6a1ff7] font-mono">{fmt(calcCost(v.modelUsed ?? "", v.inputTokens ?? 0, v.outputTokens ?? 0))}</td>
                    <td className="px-4 py-3 text-right text-[#71717f]">{new Date(v.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
