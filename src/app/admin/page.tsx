import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OWNER_EMAIL = "ydbender28@gmail.com";

// Cost per 1M tokens in USD (approximate)
const COST_PER_M: Record<string, { input: number; output: number }> = {
  "Claude Haiku":  { input: 0.25,  output: 1.25  },
  "Claude Sonnet": { input: 3.00,  output: 15.00 },
  "GPT-4o mini":   { input: 0.15,  output: 0.60  },
  "GPT-4o":        { input: 2.50,  output: 10.00 },
  "Gemini Flash":  { input: 0.075, output: 0.30  },
  "Gemini Pro":    { input: 1.25,  output: 5.00  },
};

function calcCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = COST_PER_M[model];
  if (!rates) return 0;
  return (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
}

function fmt(n: number) {
  return n < 0.01 ? "<$0.01" : `$${n.toFixed(4)}`;
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.email !== OWNER_EMAIL) redirect("/dashboard");

  const versions = await prisma.version.findMany({
    orderBy: { createdAt: "desc" },
    include: { project: { select: { name: true, owner: { select: { email: true } } } } },
  });

  const users = await prisma.user.findMany({ select: { id: true, email: true, createdAt: true } });

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
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <h1 className="text-2xl font-bold mb-1">ThatCode Admin</h1>
          <p className="text-gray-400 text-sm">Usage and cost overview</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total users", value: users.length },
            { label: "Total generations", value: versions.length },
            { label: "Total cost", value: fmt(totalCost) },
            { label: "Avg cost/gen", value: versions.length ? fmt(totalCost / versions.length) : "$0" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {/* By model */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Usage by model</h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Model</th>
                  <th className="text-right px-4 py-3">Generations</th>
                  <th className="text-right px-4 py-3">Input tokens</th>
                  <th className="text-right px-4 py-3">Output tokens</th>
                  <th className="text-right px-4 py-3">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Object.entries(byModel).sort((a, b) => b[1].cost - a[1].cost).map(([model, stats]) => (
                  <tr key={model} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium">{model}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{stats.count}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{stats.inputTokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{stats.outputTokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-fuchsia-400 font-mono">{fmt(stats.cost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/[0.04] font-semibold">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{versions.length}</td>
                  <td className="px-4 py-3 text-right">{Object.values(byModel).reduce((s, m) => s + m.inputTokens, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{Object.values(byModel).reduce((s, m) => s + m.outputTokens, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-fuchsia-400 font-mono">{fmt(totalCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Users */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Users ({users.length})</h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-right px-4 py-3">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent generations */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Recent generations</h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Project</th>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Model</th>
                  <th className="text-right px-4 py-3">Tokens</th>
                  <th className="text-right px-4 py-3">Cost</th>
                  <th className="text-right px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {versions.slice(0, 50).map((v) => (
                  <tr key={v.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium truncate max-w-[150px]">{v.project.name}</td>
                    <td className="px-4 py-3 text-gray-400 truncate max-w-[150px]">{v.project.owner.email}</td>
                    <td className="px-4 py-3">{v.modelUsed ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{((v.inputTokens ?? 0) + (v.outputTokens ?? 0)).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-fuchsia-400 font-mono">{fmt(calcCost(v.modelUsed ?? "", v.inputTokens ?? 0, v.outputTokens ?? 0))}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{new Date(v.createdAt).toLocaleDateString()}</td>
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
