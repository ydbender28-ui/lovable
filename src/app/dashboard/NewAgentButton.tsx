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
        className="inline-flex items-center gap-2 rounded-xl border border-[#6a1ff7]/30 bg-[#eef2ff] text-[#6a1ff7] px-4 py-2.5 text-sm font-medium hover:bg-[#e0e7ff] transition-colors">
        <span className="text-base">+</span> New Agent
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="rounded-2xl border border-[#ececf1] bg-[#ffffff] w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {step === "template" ? (
              <div className="p-6">
                <h2 className="text-base font-semibold text-[#17171c] mb-1">Create an AI Agent</h2>
                <p className="text-xs text-[#71717f] mb-5">Start from a template or build from scratch.</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {TEMPLATES.map(t => (
                    <button key={t.name} onClick={() => useTemplate(t)}
                      className="text-left rounded-xl border border-[#ececf1] bg-white p-4 hover:border-[#6a1ff7]/40 hover:bg-[#eef2ff] transition-colors">
                      <span className="text-2xl block mb-2">{t.avatar}</span>
                      <p className="text-sm font-medium text-[#17171c]">{t.name}</p>
                      <p className="text-xs text-[#71717f] mt-0.5">{t.description}</p>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep("custom")}
                  className="w-full rounded-xl border border-dashed border-[#ececf1] bg-transparent text-[#71717f] py-3 text-sm hover:text-[#17171c] hover:border-[#d0d0d8] transition-colors">
                  Start from scratch →
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep("template")} className="text-[#71717f] hover:text-[#17171c] text-sm">← Back</button>
                  <h2 className="text-base font-semibold text-[#17171c]">Configure your agent</h2>
                </div>

                <div>
                  <label className="text-xs text-[#71717f] mb-1.5 block">Avatar</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map(a => (
                      <button key={a} onClick={() => setAvatar(a)}
                        className={`text-xl w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${avatar === a ? "bg-[#eef2ff] ring-1 ring-[#6a1ff7]/50" : "bg-[#f0f0f5] hover:bg-[#e8e8ed]"}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#71717f] mb-1.5 block">Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Support Bot"
                    className="w-full rounded-xl border border-[#ececf1] bg-[#f6f6f8] px-3 py-2.5 text-sm text-[#17171c] placeholder:text-[#a0a0ab] focus:outline-none focus:border-[#6a1ff7]/40" />
                </div>

                <div>
                  <label className="text-xs text-[#71717f] mb-1.5 block">Description <span className="text-[#a0a0ab]">(shown on public page)</span></label>
                  <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this agent help with?"
                    className="w-full rounded-xl border border-[#ececf1] bg-[#f6f6f8] px-3 py-2.5 text-sm text-[#17171c] placeholder:text-[#a0a0ab] focus:outline-none focus:border-[#6a1ff7]/40" />
                </div>

                <div>
                  <label className="text-xs text-[#71717f] mb-1.5 block">Instructions *</label>
                  <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={6}
                    placeholder={`You are a helpful assistant that...\n\nYou should:\n- Answer questions about X\n- Always be polite\n- Never discuss Y`}
                    className="w-full rounded-xl border border-[#ececf1] bg-[#f6f6f8] px-3 py-2.5 text-sm text-[#17171c] placeholder:text-[#a0a0ab] focus:outline-none focus:border-[#6a1ff7]/40 resize-none font-mono leading-relaxed" />
                  <p className="text-[10px] text-[#a0a0ab] mt-1">Plain English. What does the agent know? How should it talk? What should it avoid?</p>
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button onClick={create} disabled={creating || !name.trim() || !systemPrompt.trim()}
                  className="w-full rounded-xl bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
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
