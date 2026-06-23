"use client";

import { useEffect, useState, useRef } from "react";

const PROMPT = "Build me a SaaS analytics dashboard";

const CODE_LINES = [
  "import React, { useState } from 'react';",
  "const STATS = [",
  "  { label: 'Revenue', value: '$48,291', pct: '+12%' },",
  "  { label: 'Users', value: '12,847', pct: '+8%' },",
  "  { label: 'Conversion', value: '3.6%', pct: '+0.4%' },",
  "];",
  "export default function Dashboard() {",
  "  return (",
  "    <div style={{background:'#0f0f13',minHeight:'100vh'}}>",
  "      <nav style={{padding:'16px 28px',borderBottom:",
  "        '1px solid rgba(255,255,255,0.07)'}}>",
  "        <h1 style={{color:'#fff',fontSize:18}}>Analytics</h1>",
  "      </nav>",
  "      <main style={{padding:'32px 28px'}}>",
  "        {STATS.map(s => (",
  "          <div key={s.label} style={{background:",
  "            'rgba(255,255,255,0.04)',borderRadius:12,",
  "            padding:'20px 24px'}}>",
  "            <p style={{color:'#4ade80'}}>{s.pct}</p>",
  "          </div>",
  "        ))}",
  "      </main>",
  "    </div>",
  "  );",
  "}",
];

function useTyping(text: string, speed = 40, delay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(iv); setDone(true); }
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, speed, delay]);
  return { displayed, done };
}

export default function DemoModal({ onClose }: { onClose: () => void }) {
  const { displayed: typedPrompt, done: promptDone } = useTyping(PROMPT, 38, 400);
  const [visibleLines, setVisibleLines] = useState(0);
  const [codeDone, setCodeDone] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [codeCollapsed, setCodeCollapsed] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!promptDone) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (codeRef.current) codeRef.current.scrollTop = codeRef.current.scrollHeight;
      if (i >= CODE_LINES.length) {
        clearInterval(iv);
        setCodeDone(true);
        setTimeout(() => { setCodeCollapsed(true); }, 400);
        setTimeout(() => { setPreviewVisible(true); }, 700);
      }
    }, 55);
    return () => clearInterval(iv);
  }, [promptDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full overflow-hidden rounded-t-2xl sm:max-w-5xl sm:rounded-2xl"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.7)",
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "#eef0f6" }}>ThatCode in action</h2>
            <p className="text-xs" style={{ color: "#7a8099" }}>One prompt. A working app in seconds.</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-sm hover:bg-white/10 transition-colors" style={{ color: "#7a8099" }}>✕</button>
        </div>

        {/* Body */}
        <div className="flex flex-col overflow-y-auto sm:grid sm:grid-cols-2 sm:overflow-hidden" style={{ flex: 1, minHeight: 0 }}>

          {/* Left: chat + code */}
          <div className="flex flex-col shrink-0 sm:overflow-hidden" style={{ borderRight: "0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="sm:hidden" style={{ display: "none" }} /> {/* spacer */}

            {/* Chat panel */}
            <div className="p-4 pb-2 sm:p-5 sm:pb-0">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: "rgba(109,95,255,0.2)", color: "#a78bfa" }}>U</div>
                <span className="text-xs" style={{ color: "#7a8099" }}>You</span>
              </div>
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(109,95,255,0.14)", border: "1px solid rgba(109,95,255,0.22)", color: "#eef0f6" }}>
                {typedPrompt}
                {!promptDone && <span className="ml-0.5 inline-block h-3.5 w-0.5 align-middle" style={{ background: "#a78bfa", animation: "pulse 0.8s infinite" }} />}
              </div>
            </div>

            {/* Streaming code — collapses when done */}
            {promptDone && (
              <div
                className="overflow-hidden transition-all duration-500 px-4 sm:px-5"
                style={{
                  maxHeight: codeCollapsed ? 36 : 260,
                  paddingTop: 12,
                  paddingBottom: codeCollapsed ? 8 : 12,
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px]" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>⚡</div>
                  <span className="text-xs" style={{ color: "#7a8099" }}>ThatCode</span>
                  {!codeDone ? (
                    <span className="text-[10px] rounded-full px-2 py-0.5" style={{ background: "rgba(109,95,255,0.15)", color: "#a78bfa" }}>writing…</span>
                  ) : (
                    <span className="text-[10px] rounded-full px-2 py-0.5" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>✓ Done</span>
                  )}
                </div>
                {!codeCollapsed && (
                  <div ref={codeRef} className="rounded-xl p-3 text-[11px] font-mono leading-relaxed overflow-y-auto" style={{ background: "#0d0e12", border: "1px solid rgba(255,255,255,0.07)", maxHeight: 200 }}>
                    {CODE_LINES.slice(0, visibleLines).map((line, i) => (
                      <div key={i} style={{ color: line.startsWith("import") || line.startsWith("export") ? "#c084fc" : line.startsWith("  ") ? "#93c5fd" : "#e2e8f0" }}>
                        {line || " "}
                      </div>
                    ))}
                    {visibleLines < CODE_LINES.length && <span className="inline-block h-3 w-1.5" style={{ background: "#a78bfa", animation: "pulse 0.6s infinite" }} />}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: preview */}
          <div className="relative flex flex-col shrink-0 sm:shrink" style={{ background: "#0d0e12", minHeight: 220 }}>
            <div className="flex items-center gap-2 px-4 py-2.5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "#ff5f57" }} />
                <span className="h-2 w-2 rounded-full" style={{ background: "#febc2e" }} />
                <span className="h-2 w-2 rounded-full" style={{ background: "#28c840" }} />
              </div>
              <div className="ml-1 flex h-5 flex-1 items-center gap-1.5 rounded px-2 text-[10px]" style={{ background: "rgba(255,255,255,0.04)", color: "#7a8099" }}>
                <span style={{ color: "#22c55e", fontSize: 7 }}>●</span> myapp.thatcode.dev
              </div>
            </div>

            <div className="flex-1 transition-all duration-700" style={{ opacity: previewVisible ? 1 : 0, transform: previewVisible ? "translateY(0)" : "translateY(8px)", overflowY: "auto" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Analytics</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Overview","Reports","Settings"].map(l => <span key={l} style={{ color: "#6b7280", fontSize: 10 }}>{l}</span>)}
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
                  {[{ l:"Revenue",v:"$48,291",p:"+12%" },{ l:"Users",v:"12,847",p:"+8%" },{ l:"Conv.",v:"3.6%",p:"+0.4%" }].map(s => (
                    <div key={s.l} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "10px 12px" }}>
                      <p style={{ color: "#6b7280", fontSize: 9, marginBottom: 3 }}>{s.l}</p>
                      <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{s.v}</p>
                      <p style={{ color: "#4ade80", fontSize: 9, marginTop: 3 }}>{s.p}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 12 }}>
                  <p style={{ color: "#9ca3af", fontSize: 10, marginBottom: 10 }}>Monthly Revenue</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56 }}>
                    {[40,55,35,70,60,80,65,90,75,85,92,88].map((h, i) => (
                      <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: i === 11 ? "linear-gradient(180deg,#818cf8,#6d5fff)" : "rgba(109,95,255,0.25)" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {!previewVisible && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div style={{ width: 24, height: 24, border: "2px solid rgba(109,95,255,0.3)", borderTopColor: "#6d5fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <p className="text-xs" style={{ color: "#7a8099" }}>Rendering…</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs hidden sm:block" style={{ color: "#7a8099" }}>Real apps, not templates.</p>
          <a href="/signup" className="w-full sm:w-auto text-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px" style={{ background: "linear-gradient(135deg,#6d5fff,#5b4ee0)", boxShadow: "0 4px 18px rgba(109,95,255,0.35)" }}>
            Start building free →
          </a>
        </div>
      </div>
    </div>
  );
}
