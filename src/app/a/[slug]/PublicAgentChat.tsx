"use client";

import { useState, useRef, useEffect } from "react";

type Agent = { id: string; name: string; description: string | null; avatar: string };
type Message = { role: "user" | "assistant"; content: string };

export default function PublicAgentChat({ agent }: { agent: Agent }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [responding, setResponding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, responding]);

  async function send() {
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
      if (!res.body) throw new Error();
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
            const { text: t } = JSON.parse(dataLine);
            if (t) { reply += t; setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: reply }]); }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: "Something went wrong." }]);
    } finally {
      setResponding(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]">
      <div className="border-b border-white/10 px-4 py-3 flex items-center gap-3 bg-[#0c0c12]">
        <div className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg">{agent.avatar}</div>
        <div>
          <p className="text-sm font-medium text-white">{agent.name}</p>
          {agent.description && <p className="text-xs text-gray-500">{agent.description}</p>}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-500">Online</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="text-5xl">{agent.avatar}</div>
            <p className="text-base font-semibold text-white">{agent.name}</p>
            {agent.description && <p className="text-sm text-gray-500 max-w-xs">{agent.description}</p>}
            <p className="text-xs text-gray-600">Send a message to start</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm shrink-0 mt-0.5">{agent.avatar}</div>
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

      <div className="border-t border-white/10 p-3 bg-[#0c0c12]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-fuchsia-400/40 transition-colors flex items-end gap-2 px-3 py-2">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Message ${agent.name}…`} rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none max-h-32" />
          <button onClick={send} disabled={responding || !input.trim()}
            className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-40 shrink-0">
            {responding ? "…" : "↑"}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-700 mt-2">Powered by ThatCode</p>
      </div>
    </div>
  );
}
