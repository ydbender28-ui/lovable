"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

type Agent = {
  id: string; name: string; description: string | null; systemPrompt: string;
  model: string; avatar: string; slug: string; public: boolean;
};
type Message = { role: "user" | "assistant"; content: string };

const MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Fast (Haiku)" },
  { id: "claude-sonnet-4-6",         label: "Smart (Sonnet)" },
];

const AVATAR_OPTIONS = ["🤖", "🧠", "💬", "🎯", "🚀", "💡", "⚡", "🔮", "🎨", "📊", "🛠️", "🔬"];

export default function AgentWorkspace({ agent: initial }: { agent: Agent }) {
  const [agent, setAgent] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [responding, setResponding] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, responding]);

  async function saveAgent() {
    setSaving(true);
    try {
      await fetch(`/api/agents/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      setAgent(draft);
      setEditing(false);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || responding) return;
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setResponding(true);

    let reply = "";
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`/api/agents/${agent.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.body) throw new Error("No response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const dataLine = part.match(/^data: (.+)/)?.[1];
          if (!dataLine) continue;
          try {
            const { text, error } = JSON.parse(dataLine);
            if (error) { reply += `[Error: ${error}]`; }
            else if (text) { reply += text; }
            setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: reply }]);
          } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setResponding(false);
    }
  }

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : "https://thatcode.dev"}/a/${agent.slug}`;
  const embedCode = `<iframe src="${publicUrl}" width="400" height="600" style="border:none;border-radius:16px;" allow="clipboard-write"></iframe>`;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur px-4 py-2.5 flex items-center gap-3 shrink-0">
        <Link href="/dashboard" className="shrink-0"><Logo size="sm" /></Link>
        <span className="text-gray-700">/</span>
        <span className="text-gray-500 text-sm hidden sm:inline">Agents</span>
        <span className="text-gray-700 hidden sm:inline">/</span>
        <span className="text-sm font-medium text-white truncate">{agent.avatar} {agent.name}</span>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {saveMsg && <span className="text-xs text-green-400">{saveMsg}</span>}
          <button onClick={() => { setDraft(agent); setEditing(e => !e); }}
            className={`text-xs rounded-lg border px-3 py-1.5 transition-colors ${editing ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"}`}>
            {editing ? "Cancel" : "Edit"}
          </button>
          {editing && (
            <button onClick={saveAgent} disabled={saving}
              className="text-xs rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300 px-3 py-1.5 hover:bg-fuchsia-500/20 transition-colors disabled:opacity-40">
              {saving ? "Saving…" : "Save"}
            </button>
          )}
          <button onClick={() => setShowEmbed(e => !e)}
            className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-300 px-3 py-1.5 hover:bg-white/10 transition-colors hidden sm:block">
            Share
          </button>
          <a href={publicUrl} target="_blank" rel="noreferrer"
            className="text-xs rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 px-3 py-1.5 hover:bg-green-500/20 transition-colors hidden sm:block">
            Live ↗
          </a>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Settings panel */}
        {editing && (
          <div className="w-72 sm:w-80 border-r border-white/10 bg-[#0c0c12] overflow-y-auto p-5 space-y-5 shrink-0">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map(a => (
                  <button key={a} onClick={() => setDraft(d => ({ ...d, avatar: a }))}
                    className={`text-lg w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${draft.avatar === a ? "bg-fuchsia-500/20 ring-1 ring-fuchsia-400/50" : "bg-white/5 hover:bg-white/10"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Name</label>
              <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-400/40" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Short description (shown on public page)</label>
              <input value={draft.description ?? ""} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                placeholder="What does this agent do?"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Instructions (system prompt)</label>
              <textarea value={draft.systemPrompt} onChange={e => setDraft(d => ({ ...d, systemPrompt: e.target.value }))}
                rows={10}
                placeholder="You are a helpful assistant that specializes in..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40 resize-none font-mono leading-relaxed" />
              <p className="text-[10px] text-gray-600 mt-1">Write in plain English. Describe what the agent knows, how it talks, what it should and shouldn't do.</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Model</label>
              <div className="space-y-1.5">
                {MODELS.map(m => (
                  <button key={m.id} onClick={() => setDraft(d => ({ ...d, model: m.id }))}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${draft.model === m.id ? "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200" : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                    {m.label}
                    <span className="text-[10px] text-gray-600 ml-2">{m.id}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 flex items-center justify-between">
                <span>Public link</span>
                <button onClick={() => setDraft(d => ({ ...d, public: !d.public }))}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${draft.public ? "bg-fuchsia-500" : "bg-white/10"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${draft.public ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </label>
              <p className="text-[10px] text-gray-600">{draft.public ? "Anyone with the link can chat" : "Only you can access"}</p>
            </div>
          </div>
        )}

        {/* Share panel */}
        {showEmbed && !editing && (
          <div className="w-72 sm:w-80 border-r border-white/10 bg-[#0c0c12] overflow-y-auto p-5 space-y-5 shrink-0">
            <div>
              <p className="text-xs font-medium text-white mb-1">Public link</p>
              <div className="flex gap-2">
                <input readOnly value={publicUrl}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 focus:outline-none" />
                <button onClick={() => navigator.clipboard.writeText(publicUrl)}
                  className="rounded-lg border border-white/10 bg-white/5 text-gray-300 px-3 py-2 text-xs hover:bg-white/10">Copy</button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-white mb-1">Embed on any website</p>
              <pre className="rounded-lg border border-white/10 bg-white/5 p-3 text-[10px] text-gray-400 whitespace-pre-wrap break-all">{embedCode}</pre>
              <button onClick={() => navigator.clipboard.writeText(embedCode)}
                className="mt-2 text-xs rounded-lg border border-white/10 bg-white/5 text-gray-300 px-3 py-1.5 hover:bg-white/10 transition-colors">
                Copy embed code
              </button>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
              <p className="text-xs font-medium text-blue-300 mb-1">API access</p>
              <p className="text-[10px] text-gray-500">POST to <code className="text-gray-400">/api/agents/{agent.id}/chat</code></p>
              <pre className="mt-1.5 text-[10px] text-gray-500">{`{ "messages": [
  { "role": "user", "content": "Hello" }
]}`}</pre>
            </div>
          </div>
        )}

        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="text-5xl">{agent.avatar}</div>
                <p className="text-base font-medium text-white">{agent.name}</p>
                {agent.description && <p className="text-sm text-gray-500 max-w-xs">{agent.description}</p>}
                <p className="text-xs text-gray-600">Send a message to start chatting</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm shrink-0 mt-0.5">
                    {agent.avatar}
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white rounded-br-sm"
                    : "bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm"
                }`}>
                  {m.content || (responding && i === messages.length - 1 ? (
                    <span className="flex gap-1 items-center">
                      {[0,1,2].map(j => <span key={j} className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: `${j*200}ms` }} />)}
                    </span>
                  ) : "")}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-3 shrink-0">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-fuchsia-400/40 transition-colors flex items-end gap-2 px-3 py-2">
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Message ${agent.name}…`}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none max-h-32" />
              <button onClick={sendMessage} disabled={responding || !input.trim()}
                className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0">
                {responding ? "…" : "↑"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
