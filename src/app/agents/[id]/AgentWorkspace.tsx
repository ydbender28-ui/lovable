"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { type AgentTool, type ToolParam } from "@/lib/agentTools";

type Agent = {
  id: string; name: string; description: string | null; systemPrompt: string;
  model: string; avatar: string; slug: string; public: boolean; tools: string; knowledge: string;
};

type KnowledgeItem = { id: string; title: string; content: string };

type TextBlock = { type: "text"; text: string };
type ToolStartBlock = { type: "tool_start"; name: string; description: string; input: Record<string, unknown> };
type ToolResultBlock = { type: "tool_result"; name: string; result: string; collapsed: boolean };
type MessageBlock = TextBlock | ToolStartBlock | ToolResultBlock;
type Message = { role: "user" | "assistant"; blocks: MessageBlock[] };

const MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Fast (Haiku)" },
  { id: "claude-sonnet-4-6", label: "Smart (Sonnet) — best for complex tasks" },
];
const AVATAR_OPTIONS = ["🤖", "🧠", "💬", "🎯", "🚀", "💡", "⚡", "🔮", "🎨", "📊", "🛠️", "🔬"];

const TOOL_TEMPLATES: Partial<AgentTool>[] = [
  {
    name: "check_inventory",
    description: "Check current inventory levels. Call this to find out what items are in stock and how many.",
    type: "webhook",
    method: "GET",
    parameters: [
      { name: "item_id", type: "string", description: "Optional: specific item ID to check", required: false },
    ],
  },
  {
    name: "place_order",
    description: "Place a purchase order for a specific item. Call this when inventory is low and a reorder is needed.",
    type: "webhook",
    method: "POST",
    parameters: [
      { name: "item_id", type: "string", description: "ID of item to order", required: true },
      { name: "quantity", type: "number", description: "How many units to order", required: true },
      { name: "supplier", type: "string", description: "Supplier name or ID", required: false },
    ],
  },
  {
    name: "get_supplier_pricing",
    description: "Get current pricing from a supplier for a specific item.",
    type: "webhook",
    method: "GET",
    parameters: [
      { name: "item_id", type: "string", description: "Item to get pricing for", required: true },
    ],
  },
  {
    name: "send_report",
    description: "Send a summary report via email.",
    type: "send_email",
    parameters: [
      { name: "subject", type: "string", description: "Email subject", required: true },
      { name: "body", type: "string", description: "Email body content", required: true },
    ],
  },
];

function newToolId() { return `tool_${Math.random().toString(36).slice(2, 8)}`; }

// ── Tool block renderers ────────────────────────────────────────────────────
function ToolBadge({ block, onToggle }: { block: ToolStartBlock | ToolResultBlock; onToggle?: () => void }) {
  const isStart = block.type === "tool_start";
  const isResult = block.type === "tool_result";
  const collapsed = isResult && (block as ToolResultBlock).collapsed;

  return (
    <div className="rounded-lg border border-[#ececf1] bg-white overflow-hidden text-xs my-1">
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#f0f0f5] transition-colors text-left">
        {isStart && <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />}
        {isResult && <span className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />}
        <span className="font-mono text-fuchsia-300">{block.name}</span>
        <span className="text-gray-500">{isStart ? (block as ToolStartBlock).description : "→ result"}</span>
        {isResult && <span className="ml-auto text-gray-600">{collapsed ? "▸" : "▾"}</span>}
      </button>
      {isResult && !collapsed && (
        <pre className="px-3 pb-2 text-[10px] text-gray-400 whitespace-pre-wrap break-all max-h-40 overflow-y-auto border-t border-white/5">
          {(block as ToolResultBlock).result}
        </pre>
      )}
    </div>
  );
}

function MessageBubble({ msg, onToggleTool }: { msg: Message; onToggleTool: (blockIdx: number) => void }) {
  if (msg.role === "user") {
    const text = msg.blocks.map(b => b.type === "text" ? b.text : "").join("");
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">{text}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 rounded-full bg-[#f0f0f5] border border-[#ececf1] flex items-center justify-center text-sm shrink-0 mt-0.5">
        {/* avatar rendered by parent */}
      </div>
      <div className="flex-1 min-w-0">
        {msg.blocks.map((block, i) => {
          if (block.type === "text") {
            return block.text ? (
              <div key={i} className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{block.text}</div>
            ) : null;
          }
          return (
            <ToolBadge key={i} block={block}
              onToggle={block.type === "tool_result" ? () => onToggleTool(i) : undefined} />
          );
        })}
      </div>
    </div>
  );
}

// ── Tool editor ─────────────────────────────────────────────────────────────
function ToolEditor({ tool, onChange, onDelete }: {
  tool: AgentTool;
  onChange: (t: AgentTool) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#ececf1] bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-[#f0f0f5] transition-colors" onClick={() => setOpen(o => !o)}>
        <span className="text-xs font-mono text-fuchsia-300 flex-1 truncate">{tool.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
          tool.type === "webhook" ? "border-orange-500/30 text-orange-400 bg-orange-500/10" :
          tool.type === "browse_web" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
          tool.type === "send_email" ? "border-green-500/30 text-green-400 bg-green-500/10" :
          "border-[#ececf1] text-gray-500"
        }`}>{tool.type}</span>
        <span className="text-gray-600 text-xs">{open ? "▾" : "▸"}</span>
      </div>
      {open && (
        <div className="border-t border-[#ececf1] p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Function name (no spaces)</label>
              <input value={tool.name} onChange={e => onChange({ ...tool, name: e.target.value.replace(/\s/g, "_").toLowerCase() })}
                className="w-full rounded-lg border border-[#ececf1] bg-[#f0f0f5] px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-fuchsia-400/40" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Type</label>
              <select value={tool.type} onChange={e => onChange({ ...tool, type: e.target.value as AgentTool["type"] })}
                className="w-full rounded-lg border border-[#ececf1] bg-white px-2 py-1.5 text-xs text-white focus:outline-none focus:border-fuchsia-400/40">
                <option value="webhook">Webhook (call your API)</option>
                <option value="fetch_url">Fetch URL</option>
                <option value="browse_web">Browse Web</option>
                <option value="send_email">Send Email</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Description — tell the AI when to use this</label>
            <textarea value={tool.description} onChange={e => onChange({ ...tool, description: e.target.value })}
              rows={2} className="w-full rounded-lg border border-[#ececf1] bg-[#f0f0f5] px-2 py-1.5 text-xs text-white resize-none focus:outline-none focus:border-fuchsia-400/40" />
          </div>

          {(tool.type === "webhook" || tool.type === "fetch_url") && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Method</label>
                <select value={tool.method || "POST"} onChange={e => onChange({ ...tool, method: e.target.value as AgentTool["method"] })}
                  className="w-full rounded-lg border border-[#ececf1] bg-white px-2 py-1.5 text-xs text-white focus:outline-none">
                  {["GET","POST","PUT","PATCH","DELETE"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-gray-500 mb-1 block">Endpoint URL</label>
                <input value={tool.url || ""} onChange={e => onChange({ ...tool, url: e.target.value })}
                  placeholder="https://your-api.com/endpoint"
                  className="w-full rounded-lg border border-[#ececf1] bg-[#f0f0f5] px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-fuchsia-400/40" />
              </div>
            </div>
          )}

          {tool.type === "send_email" && (
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Send to email</label>
              <input value={tool.toEmail || ""} onChange={e => onChange({ ...tool, toEmail: e.target.value })}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#ececf1] bg-[#f0f0f5] px-2 py-1.5 text-xs text-white focus:outline-none focus:border-fuchsia-400/40" />
            </div>
          )}

          <div>
            <label className="text-[10px] text-gray-500 mb-1.5 block">Authorization header (optional)</label>
            <input value={tool.headers?.Authorization || ""} onChange={e => onChange({ ...tool, headers: { ...tool.headers, Authorization: e.target.value } })}
              placeholder="Bearer your_api_key_here"
              className="w-full rounded-lg border border-[#ececf1] bg-[#f0f0f5] px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-fuchsia-400/40" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-gray-500">Parameters</label>
              <button onClick={() => onChange({ ...tool, parameters: [...tool.parameters, { name: "param", type: "string", description: "", required: false }] })}
                className="text-[10px] text-fuchsia-400 hover:text-fuchsia-300">+ Add param</button>
            </div>
            <div className="space-y-1.5">
              {tool.parameters.map((p, pi) => (
                <div key={pi} className="flex gap-1.5 items-start">
                  <input value={p.name} onChange={e => { const ps = [...tool.parameters]; ps[pi] = { ...p, name: e.target.value }; onChange({ ...tool, parameters: ps }); }}
                    placeholder="name" className="w-24 rounded-lg border border-[#ececf1] bg-[#f0f0f5] px-2 py-1 text-[10px] text-white font-mono focus:outline-none" />
                  <select value={p.type} onChange={e => { const ps = [...tool.parameters]; ps[pi] = { ...p, type: e.target.value as ToolParam["type"] }; onChange({ ...tool, parameters: ps }); }}
                    className="w-20 rounded-lg border border-[#ececf1] bg-white px-1 py-1 text-[10px] text-white focus:outline-none">
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">bool</option>
                  </select>
                  <input value={p.description} onChange={e => { const ps = [...tool.parameters]; ps[pi] = { ...p, description: e.target.value }; onChange({ ...tool, parameters: ps }); }}
                    placeholder="Description for AI" className="flex-1 rounded-lg border border-[#ececf1] bg-[#f0f0f5] px-2 py-1 text-[10px] text-white focus:outline-none" />
                  <button onClick={() => { const ps = [...tool.parameters]; ps[pi] = { ...p, required: !p.required }; onChange({ ...tool, parameters: ps }); }}
                    className={`text-[10px] px-1.5 py-1 rounded border shrink-0 ${p.required ? "border-fuchsia-400/30 text-fuchsia-300 bg-fuchsia-500/10" : "border-[#ececf1] text-gray-600"}`}>req</button>
                  <button onClick={() => { const ps = tool.parameters.filter((_, i) => i !== pi); onChange({ ...tool, parameters: ps }); }}
                    className="text-gray-600 hover:text-red-400 px-1 text-xs">×</button>
                </div>
              ))}
            </div>
          </div>

          <button onClick={onDelete} className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors">Delete tool</button>
        </div>
      )}
    </div>
  );
}

// ── Main workspace ──────────────────────────────────────────────────────────
export default function AgentWorkspace({ agent: initial }: { agent: Agent }) {
  const [agent, setAgent] = useState(initial);
  const [panel, setPanel] = useState<"chat" | "teach" | "tools" | "share">("chat");
  const [draft, setDraft] = useState(initial);
  const [tools, setTools] = useState<AgentTool[]>(JSON.parse(initial.tools || "[]"));
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(JSON.parse(initial.knowledge || "[]"));
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [promptDescription, setPromptDescription] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [responding, setResponding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, responding]);

  async function saveAll() {
    setSaving(true);
    try {
      await Promise.all([
        fetch(`/api/agents/${agent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...draft }),
        }),
        fetch(`/api/agents/${agent.id}/tools`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tools),
        }),
        fetch(`/api/agents/${agent.id}/knowledge`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(knowledge),
        }),
      ]);
      setAgent({ ...draft, tools: JSON.stringify(tools), knowledge: JSON.stringify(knowledge) });
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function generatePrompt() {
    if (!promptDescription.trim()) return;
    setGeneratingPrompt(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/generate-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: promptDescription }),
      });
      const data = await res.json();
      if (data.prompt) setDraft(d => ({ ...d, systemPrompt: data.prompt }));
    } finally {
      setGeneratingPrompt(false);
    }
  }

  function addKnowledge() {
    setKnowledge(prev => [...prev, { id: `k_${Math.random().toString(36).slice(2, 8)}`, title: "New document", content: "" }]);
  }

  function addTool(template?: Partial<AgentTool>) {
    const t: AgentTool = {
      id: newToolId(),
      name: template?.name || "my_tool",
      description: template?.description || "Describe what this tool does and when the AI should use it.",
      type: template?.type || "webhook",
      method: template?.method || "POST",
      url: template?.url || "",
      headers: template?.headers || {},
      toEmail: template?.toEmail || "",
      parameters: template?.parameters || [],
    };
    setTools(prev => [...prev, t]);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || responding) return;
    setInput("");

    const userMsg: Message = { role: "user", blocks: [{ type: "text", text }] };
    const msgs: Message[] = [...messages, userMsg];
    setMessages(msgs);
    setResponding(true);

    // Convert to flat format for API
    const apiMessages = msgs.map(m => ({
      role: m.role,
      content: m.blocks.filter(b => b.type === "text").map(b => (b as TextBlock).text).join(""),
    }));

    let currentAssistant: Message = { role: "assistant", blocks: [] };
    setMessages(prev => [...prev, currentAssistant]);

    try {
      const res = await fetch(`/api/agents/${agent.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
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
          const eventType = part.match(/^event: (\w+)/m)?.[1];
          const dataLine = part.match(/^data: (.+)/m)?.[1];
          if (!dataLine) continue;
          try {
            const payload = JSON.parse(dataLine);
            if (eventType === "text" && payload.text) {
              currentAssistant = {
                ...currentAssistant,
                blocks: [
                  ...currentAssistant.blocks.filter(b => b.type !== "text" ||
                    currentAssistant.blocks.indexOf(b) < currentAssistant.blocks.length - 1),
                ],
              };
              // Append to last text block or create new one
              const last = currentAssistant.blocks[currentAssistant.blocks.length - 1];
              if (last?.type === "text") {
                currentAssistant = {
                  ...currentAssistant,
                  blocks: [
                    ...currentAssistant.blocks.slice(0, -1),
                    { type: "text", text: last.text + payload.text },
                  ],
                };
              } else {
                currentAssistant = {
                  ...currentAssistant,
                  blocks: [...currentAssistant.blocks, { type: "text", text: payload.text }],
                };
              }
            } else if (eventType === "tool_start") {
              currentAssistant = {
                ...currentAssistant,
                blocks: [...currentAssistant.blocks, { type: "tool_start", name: payload.name, description: payload.description, input: payload.input }],
              };
            } else if (eventType === "tool_result") {
              // Replace the matching tool_start with a result block
              const blocks = [...currentAssistant.blocks];
              const startIdx = [...blocks].reverse().findIndex(b => b.type === "tool_start" && (b as ToolStartBlock).name === payload.name);
              if (startIdx !== -1) {
                const realIdx = blocks.length - 1 - startIdx;
                blocks[realIdx] = { type: "tool_result", name: payload.name, result: payload.result, collapsed: true };
              } else {
                blocks.push({ type: "tool_result", name: payload.name, result: payload.result, collapsed: true });
              }
              currentAssistant = { ...currentAssistant, blocks };
            } else if (eventType === "error") {
              currentAssistant = {
                ...currentAssistant,
                blocks: [...currentAssistant.blocks, { type: "text", text: `\n⚠️ ${payload.error}` }],
              };
            }
            setMessages(prev => [...prev.slice(0, -1), currentAssistant]);
          } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { role: "assistant", blocks: [{ type: "text", text: "Sorry, something went wrong." }] }]);
    } finally {
      setResponding(false);
    }
  }

  function toggleToolResult(msgIdx: number, blockIdx: number) {
    setMessages(prev => prev.map((m, mi) => {
      if (mi !== msgIdx) return m;
      return {
        ...m, blocks: m.blocks.map((b, bi) => {
          if (bi !== blockIdx || b.type !== "tool_result") return b;
          return { ...b, collapsed: !(b as ToolResultBlock).collapsed };
        }),
      };
    }));
  }

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : "https://thatcode.dev"}/a/${agent.slug}`;
  const embedCode = `<iframe src="${publicUrl}" width="400" height="600" style="border:none;border-radius:16px;" allow="clipboard-write"></iframe>`;

  const tabs = [
    { id: "chat", label: "Chat" },
    { id: "teach", label: `Teach ${knowledge.length > 0 ? `(${knowledge.length})` : ""}` },
    { id: "tools", label: `Tools ${tools.length > 0 ? `(${tools.length})` : ""}` },
    { id: "share", label: "Share" },
  ] as const;

  return (
    <div className="h-screen flex flex-col bg-[#f6f6f8]">
      {/* Header */}
      <header className="border-b border-[#ececf1] bg-[#f6f6f8]/90 backdrop-blur px-4 py-2.5 flex items-center gap-3 shrink-0">
        <Link href="/dashboard" className="shrink-0"><Logo size="sm" /></Link>
        <span className="text-gray-700">/</span>
        <span className="text-sm font-medium text-white truncate hidden sm:block">{agent.avatar} {agent.name}</span>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {saveMsg && <span className="text-xs text-green-400">{saveMsg}</span>}
          {(panel === "teach" || panel === "tools") && (
            <button onClick={saveAll} disabled={saving}
              className="text-xs rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300 px-3 py-1.5 hover:bg-fuchsia-500/20 transition-colors disabled:opacity-40">
              {saving ? "Saving…" : "Save"}
            </button>
          )}
          <a href={publicUrl} target="_blank" rel="noreferrer"
            className="text-xs rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 px-3 py-1.5 hover:bg-green-500/20 transition-colors hidden sm:block">
            Live ↗
          </a>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-[#ececf1] bg-[#ffffff] shrink-0 px-4">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setPanel(tab.id)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              panel === tab.id ? "border-fuchsia-400 text-fuchsia-300" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chat panel */}
      {panel === "chat" && (
        <div className="flex flex-1 overflow-hidden flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="text-5xl">{agent.avatar}</div>
                <p className="text-base font-medium text-white">{agent.name}</p>
                {agent.description && <p className="text-sm text-gray-500 max-w-sm">{agent.description}</p>}
                {tools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
                    {tools.map(t => (
                      <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full border border-fuchsia-400/20 text-fuchsia-400/70 bg-fuchsia-500/5">
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-600">Send a message to start</p>
              </div>
            )}
            {messages.map((msg, mi) => (
              <div key={mi}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.blocks.map(b => b.type === "text" ? b.text : "").join("")}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-[#f0f0f5] border border-[#ececf1] flex items-center justify-center text-sm shrink-0 mt-0.5">{agent.avatar}</div>
                    <div className="flex-1 min-w-0 space-y-1">
                      {msg.blocks.map((block, bi) => {
                        if (block.type === "text") return block.text ? (
                          <div key={bi} className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{block.text}</div>
                        ) : null;
                        return <ToolBadge key={bi} block={block} onToggle={() => toggleToolResult(mi, bi)} />;
                      })}
                      {responding && mi === messages.length - 1 && msg.blocks.length === 0 && (
                        <span className="flex gap-1 items-center h-5">
                          {[0,1,2].map(j => <span key={j} className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: `${j*200}ms` }} />)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-[#ececf1] p-3 shrink-0">
            <div className="rounded-xl border border-[#ececf1] bg-white focus-within:border-fuchsia-400/40 transition-colors flex items-end gap-2 px-3 py-2">
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Message ${agent.name}…`} rows={2}
                className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none max-h-40" />
              <button onClick={sendMessage} disabled={responding || !input.trim()}
                className="rounded-lg bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-40 shrink-0">
                {responding ? "…" : "↑"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teach panel */}
      {panel === "teach" && (
        <div className="flex-1 overflow-y-auto p-5 max-w-2xl space-y-6">

          {/* Section 1: Identity */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500/20 text-[10px] font-bold text-fuchsia-300">1</span>
              <h3 className="text-sm font-medium text-white">Who is this agent?</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Name</label>
                <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                  className="w-full rounded-xl border border-[#ececf1] bg-[#f0f0f5] px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-400/40" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">One-line description</label>
                <input value={draft.description ?? ""} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                  placeholder="e.g. Sales assistant for ACME Corp"
                  className="w-full rounded-xl border border-[#ececf1] bg-[#f0f0f5] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map(a => (
                  <button key={a} onClick={() => setDraft(d => ({ ...d, avatar: a }))}
                    className={`text-lg w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${draft.avatar === a ? "bg-fuchsia-500/20 ring-1 ring-fuchsia-400/50" : "bg-[#f0f0f5] hover:bg-white/10"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Instructions */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500/20 text-[10px] font-bold text-fuchsia-300">2</span>
              <h3 className="text-sm font-medium text-white">How should it behave?</h3>
            </div>

            {/* AI prompt generator */}
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
              <p className="text-xs font-medium text-indigo-300">✨ Generate instructions with AI</p>
              <p className="text-[10px] text-gray-500">Describe what you want in plain English — AI will write professional instructions for you.</p>
              <textarea value={promptDescription} onChange={e => setPromptDescription(e.target.value)}
                placeholder={`e.g. "A sales assistant for my software company. It should qualify leads, explain our pricing plans (Basic $29/mo, Pro $99/mo, Enterprise custom), handle objections, and book demos. Should be friendly but professional. Never give discounts without manager approval."`}
                rows={4}
                className="w-full rounded-xl border border-[#ececf1] bg-[#f0f0f5] px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-400/40 resize-none leading-relaxed" />
              <button onClick={generatePrompt} disabled={generatingPrompt || !promptDescription.trim()}
                className="rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-4 py-2 text-xs font-medium hover:bg-indigo-500/30 transition-colors disabled:opacity-40 flex items-center gap-2">
                {generatingPrompt ? <><span className="h-3 w-3 rounded-full border border-indigo-400 border-t-transparent animate-spin" />Generating…</> : "✨ Generate instructions"}
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-gray-500">Instructions (edit directly)</label>
                <span className="text-[10px] text-gray-600">{draft.systemPrompt.length} chars</span>
              </div>
              <textarea value={draft.systemPrompt} onChange={e => setDraft(d => ({ ...d, systemPrompt: e.target.value }))}
                rows={12}
                placeholder={"You are a sales assistant for [Company].\n\nYou should:\n- Help customers understand our products\n- Answer pricing questions\n- Book demos when appropriate\n\nYou should NOT:\n- Give unauthorized discounts\n- Make promises you can't keep"}
                className="w-full rounded-xl border border-[#ececf1] bg-[#f0f0f5] px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40 resize-none font-mono leading-relaxed" />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 mb-1.5 block">AI model</label>
              <div className="flex gap-2">
                {MODELS.map(m => (
                  <button key={m.id} onClick={() => setDraft(d => ({ ...d, model: m.id }))}
                    className={`flex-1 text-left rounded-xl border px-3 py-2 text-xs transition-colors ${draft.model === m.id ? "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200" : "border-[#ececf1] bg-[#f0f0f5] text-gray-400 hover:bg-white/10"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#ececf1] bg-[#f0f0f5] px-3 py-2.5">
              <div>
                <p className="text-sm text-white">Public link</p>
                <p className="text-xs text-gray-500">{draft.public ? "Anyone with the link can chat" : "Only you"}</p>
              </div>
              <button onClick={() => setDraft(d => ({ ...d, public: !d.public }))}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0 ${draft.public ? "bg-fuchsia-500" : "bg-white/10"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${draft.public ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
          </section>

          {/* Section 3: Knowledge base */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500/20 text-[10px] font-bold text-fuchsia-300">3</span>
              <h3 className="text-sm font-medium text-white">What does it know?</h3>
              <button onClick={addKnowledge} className="ml-auto text-xs text-fuchsia-400 hover:text-fuchsia-300">+ Add</button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Paste anything — your product catalog, pricing table, FAQ, return policy, company info.
              The agent reads this every time it answers and uses it to give accurate responses.
            </p>

            {knowledge.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#ececf1] p-6 text-center space-y-3">
                <p className="text-xs text-gray-600">No knowledge added yet.</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    { title: "Pricing", content: "Basic plan: $29/mo — includes X, Y, Z\nPro plan: $99/mo — includes everything in Basic plus A, B, C\nEnterprise: Custom pricing, contact sales" },
                    { title: "FAQ", content: "Q: How do I cancel?\nA: You can cancel anytime from your account settings.\n\nQ: Do you offer refunds?\nA: Yes, within 30 days of purchase." },
                    { title: "Products", content: "Product 1: [Description, price, features]\nProduct 2: [Description, price, features]" },
                    { title: "Company info", content: "Company name:\nFounded:\nWhat we do:\nContact: support@yourcompany.com" },
                  ].map(template => (
                    <button key={template.title} onClick={() => setKnowledge(prev => [...prev, { id: `k_${Math.random().toString(36).slice(2,8)}`, title: template.title, content: template.content }])}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#ececf1] text-gray-400 hover:border-fuchsia-400/30 hover:text-fuchsia-300 transition-colors">
                      + {template.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {knowledge.map((item, i) => (
                <div key={item.id} className="rounded-xl border border-[#ececf1] bg-white overflow-hidden">
                  <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                    <input value={item.title}
                      onChange={e => setKnowledge(prev => prev.map((k, ki) => ki === i ? { ...k, title: e.target.value } : k))}
                      className="flex-1 bg-transparent text-sm font-medium text-white focus:outline-none placeholder:text-gray-600"
                      placeholder="Document title (e.g. Pricing, FAQ, Products)" />
                    <button onClick={() => setKnowledge(prev => prev.filter((_, ki) => ki !== i))}
                      className="text-gray-600 hover:text-red-400 text-sm px-1">×</button>
                  </div>
                  <textarea value={item.content}
                    onChange={e => setKnowledge(prev => prev.map((k, ki) => ki === i ? { ...k, content: e.target.value } : k))}
                    rows={8} placeholder={`Paste anything here — product details, pricing, policies, FAQs, company info...\n\nNo special formatting needed. Just write it naturally.`}
                    className="w-full bg-transparent px-3 pb-3 text-xs text-gray-300 placeholder:text-gray-700 focus:outline-none resize-none leading-relaxed border-t border-white/5" />
                  <div className="px-3 pb-2 text-[10px] text-gray-700">{item.content.length} characters · ~{Math.ceil(item.content.length / 4)} tokens</div>
                </div>
              ))}
            </div>

            {knowledge.length > 0 && (
              <button onClick={addKnowledge} className="w-full rounded-xl border border-dashed border-[#ececf1] text-gray-600 py-3 text-xs hover:text-gray-400 hover:border-white/20 transition-colors">
                + Add another document
              </button>
            )}
          </section>

          <div className="pb-8">
            <button onClick={saveAll} disabled={saving}
              className="w-full rounded-xl bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}

      {/* Tools panel */}
      {panel === "tools" && (
        <div className="flex-1 overflow-y-auto p-5 max-w-2xl space-y-4">
          <div className="rounded-xl border border-[#ececf1] bg-white p-4 space-y-1.5">
            <p className="text-sm font-medium text-white">What are tools?</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Tools let your agent take real actions — call your APIs, read inventory systems, place orders, browse websites, send emails.
              The AI decides when to use each tool based on its description.
            </p>
          </div>

          {/* Built-in tools */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Built-in (always available)</p>
            <div className="space-y-1.5">
              {[
                { name: "fetch_url", desc: "Call any HTTP API or endpoint", color: "blue" },
                { name: "browse_web", desc: "Read any webpage's content", color: "cyan" },
              ].map(t => (
                <div key={t.name} className="flex items-center gap-2 rounded-lg border border-[#ececf1] bg-white px-3 py-2">
                  <span className="text-xs font-mono text-fuchsia-300">{t.name}</span>
                  <span className="text-xs text-gray-500 flex-1">{t.desc}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-green-500/30 text-green-400 bg-green-500/10">active</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom tools */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">Your tools</p>
              <button onClick={() => addTool()} className="text-xs text-fuchsia-400 hover:text-fuchsia-300">+ Add tool</button>
            </div>
            {tools.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#ececf1] p-6 text-center">
                <p className="text-xs text-gray-600 mb-3">No custom tools yet. Add one to let your agent take real actions.</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {TOOL_TEMPLATES.map(t => (
                    <button key={t.name} onClick={() => addTool(t)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#ececf1] text-gray-400 hover:border-fuchsia-400/30 hover:text-fuchsia-300 transition-colors">
                      + {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {tools.map(t => (
                <ToolEditor key={t.id} tool={t}
                  onChange={updated => setTools(prev => prev.map(x => x.id === t.id ? updated : x))}
                  onDelete={() => setTools(prev => prev.filter(x => x.id !== t.id))} />
              ))}
            </div>
            {tools.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {TOOL_TEMPLATES.filter(t => !tools.find(x => x.name === t.name)).map(t => (
                  <button key={t.name} onClick={() => addTool(t)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-[#ececf1] text-gray-500 hover:border-fuchsia-400/30 hover:text-fuchsia-300 transition-colors">
                    + {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Computer use info */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
            <p className="text-xs font-medium text-indigo-300">🖥️ Computer use (clicking, typing on websites)</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              To actually navigate websites and fill forms, you need a cloud browser service.
              The easiest option is <strong className="text-gray-300">Browserbase</strong> or <strong className="text-gray-300">Steel.dev</strong>.
            </p>
            <p className="text-xs text-gray-600">
              Add your Browserbase API key to the environment and the agent gains the ability to browse, click, and interact with any website.
              Coming soon as a built-in tool.
            </p>
          </div>
        </div>
      )}

      {/* Share panel */}
      {panel === "share" && (
        <div className="flex-1 overflow-y-auto p-5 max-w-lg space-y-5">
          <div>
            <p className="text-xs font-medium text-white mb-1.5">Public link</p>
            <div className="flex gap-2">
              <input readOnly value={publicUrl} className="flex-1 rounded-xl border border-[#ececf1] bg-[#f0f0f5] px-3 py-2 text-xs text-gray-300 focus:outline-none" />
              <button onClick={() => navigator.clipboard.writeText(publicUrl)}
                className="rounded-xl border border-[#ececf1] bg-[#f0f0f5] text-gray-300 px-3 py-2 text-xs hover:bg-white/10">Copy</button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-white mb-1.5">Embed on any website</p>
            <pre className="rounded-xl border border-[#ececf1] bg-[#f0f0f5] p-3 text-[10px] text-gray-400 whitespace-pre-wrap break-all">{embedCode}</pre>
            <button onClick={() => navigator.clipboard.writeText(embedCode)}
              className="mt-2 text-xs rounded-xl border border-[#ececf1] bg-[#f0f0f5] text-gray-300 px-3 py-1.5 hover:bg-white/10">Copy embed</button>
          </div>
          <div className="rounded-xl border border-[#ececf1] bg-white p-4">
            <p className="text-xs font-medium text-white mb-1">API</p>
            <p className="text-[10px] text-gray-500 mb-1.5">POST <code className="text-gray-400">/api/agents/{agent.id}/chat</code></p>
            <pre className="text-[10px] text-gray-500">{`{ "messages": [
  { "role": "user", "content": "Check inventory and reorder anything below 10 units" }
]}`}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
