"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AVATARS = ["🤖", "🧠", "💬", "🎯", "🚀", "💡", "⚡", "🔮", "🎨", "📊"];

const TEMPLATES = [
  {
    name: "Customer Support",
    avatar: "💬",
    description: "Answers questions about your product",
    systemPrompt: "You are a friendly and helpful customer support agent. Be concise, empathetic, and solution-focused. If you don't know something, say so honestly and offer to escalate.",
  },
  {
    name: "Sales Assistant",
    avatar: "🎯",
    description: "Helps qualify leads and answer product questions",
    systemPrompt: "You are an enthusiastic but honest sales assistant. Help prospects understand the product benefits, answer objections, and guide them toward a purchase decision. Never be pushy.",
  },
  {
    name: "Coding Helper",
    avatar: "⚡",
    description: "Answers coding questions and reviews code",
    systemPrompt: "You are an expert software engineer. Help with code reviews, debugging, architecture decisions, and explaining concepts. Use clear, concise code examples. Ask clarifying questions when needed.",
  },
  {
    name: "Content Writer",
    avatar: "✍️",
    description: "Writes and edits content for you",
    systemPrompt: "You are a skilled content writer. Help create blog posts, social media content, emails, and marketing copy. Match the user's tone and style. Ask about the target audience and purpose before writing.",
  },
];

export default function NewAgentButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"template" | "custom">("template");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [avatar, setAvatar] = useState("🤖");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStep("template"); setName(""); setDescription("");
    setSystemPrompt(""); setAvatar("🤖"); setError(null);
  }

  function useTemplate(t: typeof TEMPLATES[0]) {
    setName(t.name); setDescription(t.description);
    setSystemPrompt(t.systemPrompt); setAvatar(t.avatar);
    setStep("custom");
  }

  async function create() {
    if (!name.trim() || !systemPrompt.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, systemPrompt: systemPrompt.trim(), avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setOpen(false); reset();
      router.push(`/agents/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <button onClick={() => { setOpen(true); reset(); }}
        className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 px-4 py-2.5 text-sm font-medium hover:bg-indigo-500/20 transition-colors">
        <span className="text-base">+</span> New Agent
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="rounded-2xl border border-white/10 bg-[#141418] w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {step === "template" ? (
              <div className="p-6">
                <h2 className="text-base font-semibold text-white mb-1">Create an AI Agent</h2>
                <p className="text-xs text-gray-500 mb-5">Start from a template or build from scratch.</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {TEMPLATES.map(t => (
                    <button key={t.name} onClick={() => useTemplate(t)}
                      className="text-left rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-indigo-400/40 hover:bg-indigo-500/5 transition-colors">
                      <span className="text-2xl block mb-2">{t.avatar}</span>
                      <p className="text-sm font-medium text-white">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep("custom")}
                  className="w-full rounded-xl border border-dashed border-white/10 bg-transparent text-gray-500 py-3 text-sm hover:text-gray-300 hover:border-white/20 transition-colors">
                  Start from scratch →
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep("template")} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
                  <h2 className="text-base font-semibold text-white">Configure your agent</h2>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Avatar</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map(a => (
                      <button key={a} onClick={() => setAvatar(a)}
                        className={`text-xl w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${avatar === a ? "bg-indigo-500/20 ring-1 ring-indigo-400/50" : "bg-white/5 hover:bg-white/10"}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Support Bot"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-400/40" />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Description <span className="text-gray-600">(shown on public page)</span></label>
                  <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this agent help with?"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-400/40" />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Instructions *</label>
                  <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={6}
                    placeholder={`You are a helpful assistant that...\n\nYou should:\n- Answer questions about X\n- Always be polite\n- Never discuss Y`}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-400/40 resize-none font-mono leading-relaxed" />
                  <p className="text-[10px] text-gray-600 mt-1">Plain English. What does the agent know? How should it talk? What should it avoid?</p>
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button onClick={create} disabled={creating || !name.trim() || !systemPrompt.trim()}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
                  {creating ? "Creating…" : `Create ${avatar} ${name || "Agent"}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
