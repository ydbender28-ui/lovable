"use client";

import { useEffect, useState, useRef } from "react";

const PROMPT = "Build me a SaaS analytics dashboard";

const CODE_LINES = [
  "import React, { useState } from 'react';",
  "",
  "const STATS = [",
  "  { label: 'Revenue', value: '$48,291', pct: '+12%' },",
  "  { label: 'Active Users', value: '12,847', pct: '+8%' },",
  "  { label: 'Conversion', value: '3.6%', pct: '+0.4%' },",
  "];",
  "",
  "export default function Dashboard() {",
  "  return (",
  "    <div style={{background:'#0f0f13',minHeight:'100vh',",
  "      fontFamily:'Inter,sans-serif'}}>",
  "      <nav style={{padding:'16px 28px',borderBottom:",
  "        '1px solid rgba(255,255,255,0.07)',display:'flex',",
  "        alignItems:'center',justifyContent:'space-between'}}>",
  "        <h1 style={{color:'#fff',fontSize:18,fontWeight:700}}>",
  "          Analytics</h1>",
  "      </nav>",
  "      <main style={{padding:'32px 28px'}}>",
  "        <div style={{display:'grid',gridTemplateColumns:",
  "          'repeat(3,1fr)',gap:16,marginBottom:28}}>",
  "          {STATS.map(s => (",
  "            <div key={s.label} style={{background:",
  "              'rgba(255,255,255,0.04)',borderRadius:12,",
  "              padding:'20px 24px',border:",
  "              '1px solid rgba(255,255,255,0.07)'}}>",
  "              <p style={{color:'#888',fontSize:13}}>{s.label}</p>",
  "              <p style={{color:'#fff',fontSize:28,fontWeight:700,",
  "                marginTop:6}}>{s.value}</p>",
  "              <p style={{color:'#4ade80',fontSize:13,",
  "                marginTop:4}}>{s.pct}</p>",
  "            </div>",
  "          ))}",
  "        </div>",
  "      </main>",
  "    </div>",
  "  );",
  "}",
];

function useTyping(text: string, speed = 40, delay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
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
  const [previewVisible, setPreviewVisible] = useState(false);
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
        setTimeout(() => setPreviewVisible(true), 300);
      }
    }, 60);
    return () => clearInterval(iv);
  }, [promptDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl"
        style={{
          background: "#111318",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: "#eef0f6" }}>
              ThatCode in action
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: "#7a8099" }}>
              One prompt. A working app in under 30 seconds.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors hover:bg-white/10"
            style={{ color: "#7a8099" }}
          >
            ✕
          </button>
        </div>

        {/* Body: split */}
        <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
          {/* Left: chat + code */}
          <div
            className="flex flex-col"
            style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Prompt bubble */}
            <div className="p-5 pb-0">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: "rgba(109,95,255,0.2)", color: "#a78bfa" }}
                >
                  U
                </div>
                <span className="text-xs" style={{ color: "#7a8099" }}>You</span>
              </div>
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(109,95,255,0.14)", border: "1px solid rgba(109,95,255,0.22)", color: "#eef0f6" }}
              >
                {typedPrompt}
                {!promptDone && (
                  <span
                    className="ml-0.5 inline-block h-3.5 w-0.5 align-middle"
                    style={{ background: "#a78bfa", animation: "pulse 0.8s infinite" }}
                  />
                )}
              </div>
            </div>

            {/* Streaming code */}
            {promptDone && (
              <div className="flex-1 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px]"
                    style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}
                  >
                    ⚡
                  </div>
                  <span className="text-xs" style={{ color: "#7a8099" }}>ThatCode</span>
                  {visibleLines < CODE_LINES.length && (
                    <span
                      className="text-[10px] rounded-full px-2 py-0.5"
                      style={{ background: "rgba(109,95,255,0.15)", color: "#a78bfa" }}
                    >
                      writing…
                    </span>
                  )}
                </div>
                <div
                  ref={codeRef}
                  className="overflow-hidden rounded-xl p-4 text-[11px] font-mono leading-relaxed"
                  style={{ background: "#0d0e12", border: "1px solid rgba(255,255,255,0.07)", maxHeight: 260, overflowY: "auto" }}
                >
                  {CODE_LINES.slice(0, visibleLines).map((line, i) => (
                    <div key={i} style={{ color: line.startsWith("//") ? "#6b7280" : line.startsWith("import") || line.startsWith("export") ? "#c084fc" : line.startsWith("  ") ? "#93c5fd" : "#e2e8f0" }}>
                      {line || " "}
                    </div>
                  ))}
                  {visibleLines < CODE_LINES.length && (
                    <span
                      className="inline-block h-3 w-1.5"
                      style={{ background: "#a78bfa", animation: "pulse 0.6s infinite" }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: preview */}
          <div className="relative flex flex-col" style={{ background: "#0d0e12" }}>
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#febc2e" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28c840" }} />
              </div>
              <div
                className="ml-1 flex h-6 flex-1 items-center gap-1.5 rounded px-2 text-[10px]"
                style={{ background: "rgba(255,255,255,0.04)", color: "#7a8099" }}
              >
                <span style={{ color: "#22c55e", fontSize: 8 }}>●</span>
                myapp.thatcode.dev
              </div>
            </div>

            <div
              className="flex-1 p-0 transition-all duration-700"
              style={{ opacity: previewVisible ? 1 : 0, transform: previewVisible ? "translateY(0)" : "translateY(8px)" }}
            >
              {/* Mini dashboard preview */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Analytics</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Overview", "Reports", "Settings"].map(l => (
                    <span key={l} style={{ color: "#6b7280", fontSize: 11 }}>{l}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: "20px" }}>
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { l: "Revenue", v: "$48,291", p: "+12%", c: "#4ade80" },
                    { l: "Users", v: "12,847", p: "+8%", c: "#4ade80" },
                    { l: "Conversion", v: "3.6%", p: "+0.4%", c: "#4ade80" },
                  ].map(s => (
                    <div key={s.l} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px" }}>
                      <p style={{ color: "#6b7280", fontSize: 10, marginBottom: 4 }}>{s.l}</p>
                      <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{s.v}</p>
                      <p style={{ color: s.c, fontSize: 10, marginTop: 4 }}>{s.p}</p>
                    </div>
                  ))}
                </div>
                {/* Chart bars */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "16px" }}>
                  <p style={{ color: "#9ca3af", fontSize: 11, marginBottom: 12 }}>Monthly Revenue</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70 }}>
                    {[40, 55, 35, 70, 60, 80, 65, 90, 75, 85, 92, 88].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: `${h}%`,
                          borderRadius: 3,
                          background: i === 11 ? "linear-gradient(180deg,#818cf8,#6d5fff)" : "rgba(109,95,255,0.25)",
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => (
                      <span key={m} style={{ color: "#4b5563", fontSize: 8 }}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {!previewVisible && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div
                  className="h-8 w-8 rounded-full border-2 border-t-transparent"
                  style={{ border: "2px solid rgba(109,95,255,0.3)", borderTopColor: "#6d5fff", animation: "spin 0.8s linear infinite" }}
                />
                <p className="text-xs" style={{ color: "#7a8099" }}>Rendering preview…</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-xs" style={{ color: "#7a8099" }}>
            This is what ThatCode builds — real apps, not templates.
          </p>
          <a
            href="/signup"
            className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: "linear-gradient(135deg,#6d5fff,#5b4ee0)", boxShadow: "0 4px 18px rgba(109,95,255,0.35)" }}
          >
            Start building free →
          </a>
        </div>
      </div>
    </div>
  );
}
