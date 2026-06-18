"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { buildStandaloneHtml } from "@/lib/buildHtml";
import Logo from "@/components/Logo";

type Message = { id: string; role: "user" | "assistant"; content: string };
type ProjectFiles = Record<string, string>;
type EnvVars = Record<string, string>;

// Known APIs that need keys
const API_DETECTORS = [
  { keywords: ["stripe", "payment", "checkout", "subscription", "billing"], name: "Stripe", key: "STRIPE_PUBLISHABLE_KEY", hint: "Get from stripe.com/dashboard → Developers → API keys", placeholder: "pk_live_..." },
  { keywords: ["openai", "gpt", "chatgpt", "dall-e"], name: "OpenAI", key: "OPENAI_API_KEY", hint: "Get from platform.openai.com/api-keys", placeholder: "sk-..." },
  { keywords: ["google maps", "maps api", "directions", "geocod"], name: "Google Maps", key: "GOOGLE_MAPS_API_KEY", hint: "Get from console.cloud.google.com → Maps JavaScript API", placeholder: "AIza..." },
  { keywords: ["twilio", "sms", "text message"], name: "Twilio", key: "TWILIO_ACCOUNT_SID", hint: "Get from console.twilio.com", placeholder: "AC..." },
  { keywords: ["sendgrid", "email api"], name: "SendGrid", key: "SENDGRID_API_KEY", hint: "Get from app.sendgrid.com/settings/api_keys", placeholder: "SG..." },
  { keywords: ["firebase", "firestore", "realtime database"], name: "Firebase", key: "FIREBASE_API_KEY", hint: "Get from Firebase console → Project settings", placeholder: "AIza..." },
  { keywords: ["ups", "fedex", "shippo", "shipping rate"], name: "Shipping API", key: "SHIPPING_API_KEY", hint: "Your shipping provider API key", placeholder: "" },
  { keywords: ["mapbox"], name: "Mapbox", key: "MAPBOX_TOKEN", hint: "Get from account.mapbox.com/access-tokens", placeholder: "pk.ey..." },
];

function detectNeededApis(prompt: string, existing: EnvVars) {
  const t = prompt.toLowerCase();
  return API_DETECTORS.filter(api =>
    api.keywords.some(kw => t.includes(kw)) && !existing[api.key]
  );
}

function isVague(prompt: string) {
  const t = prompt.trim().toLowerCase();
  if (t.length > 80) return false;
  const vagueWords = ["app", "website", "site", "page", "thing", "something", "tool", "platform"];
  const hasVague = vagueWords.some(w => t.includes(w));
  const words = t.split(/\s+/).length;
  return words < 6 || (words < 10 && hasVague);
}

function IframePreview({ files, projectName }: { files: ProjectFiles; projectName: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files, projectName }),
    })
      .then((r) => r.text())
      .then(setPreviewHtml)
      .catch(() => {});
  }, [files, projectName]);

  useEffect(() => {
    if (!previewHtml || !iframeRef.current) return;
    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [previewHtml]);

  return <iframe ref={iframeRef} className="w-full h-full border-0 bg-[#0a0a0f]" sandbox="allow-scripts allow-same-origin" />;
}

function CodeViewer({ files }: { files: ProjectFiles }) {
  const [activeFile, setActiveFile] = useState(() => Object.keys(files)[0] ?? "");
  const fileKeys = Object.keys(files);
  useEffect(() => {
    if (!files[activeFile] && fileKeys.length > 0) setActiveFile(fileKeys[0]);
  }, [files]);
  return (
    <div className="h-full flex overflow-hidden">
      <div className="w-48 shrink-0 border-r border-white/10 bg-[#0c0c12] overflow-y-auto p-2 space-y-0.5">
        {fileKeys.map((f) => (
          <button key={f} onClick={() => setActiveFile(f)}
            className={`w-full text-left text-xs px-2 py-1.5 rounded truncate transition-colors ${activeFile === f ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
            {f.split("/").pop()}
          </button>
        ))}
      </div>
      <pre className="flex-1 overflow-auto p-4 text-xs text-gray-300 font-mono leading-relaxed bg-[#0d0d14] whitespace-pre-wrap break-all">
        {files[activeFile] ?? ""}
      </pre>
    </div>
  );
}

export default function ProjectWorkspace({
  projectId, projectName, initialMessages, initialFiles, initialPublishSlug, initialPrompt,
}: {
  projectId: string; projectName: string; initialMessages: Message[];
  initialFiles: ProjectFiles; initialPublishSlug?: string | null; initialPrompt?: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [files, setFiles] = useState<ProjectFiles>(initialFiles);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Thinking...");
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [publishSlug, setPublishSlug] = useState<string | null>(initialPublishSlug ?? null);
  const [publishing, setPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [envVars, setEnvVars] = useState<EnvVars>({});

  // Clarification / API key flow
  type FlowState =
    | { type: "idle" }
    | { type: "clarify"; pendingPrompt: string; answers: Record<string, string> }
    | { type: "apikeys"; pendingPrompt: string; needed: typeof API_DETECTORS; keyValues: Record<string, string> };
  const [flow, setFlow] = useState<FlowState>({ type: "idle" });

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoFired = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (initialPrompt && !autoFired.current && initialMessages.length === 0) {
      autoFired.current = true;
      handlePromptSubmit(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/envvars`)
      .then((r) => r.json())
      .then((d) => { if (typeof d === "object") setEnvVars(d); })
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, flow]);

  useEffect(() => { if (!loading) setLoadingStatus("Thinking..."); }, [loading]);

  useEffect(() => {
    if (loading) {
      if ("wakeLock" in navigator) {
        navigator.wakeLock.request("screen").then((lock) => { wakeLockRef.current = lock; }).catch(() => {});
      }
    } else {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, [loading]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "preview-error") setIframeError(e.data.error as string);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Mobile: when coming back from another app, check if generation finished in DB
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      if (!loading) return;
      // Poll for a new version — if generation completed server-side, pick it up
      fetch(`/api/projects/${projectId}/latest-version`)
        .then(r => r.json())
        .then(data => {
          if (data.files && data.summary) {
            setFiles(data.files);
            setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: "assistant", content: data.summary }]);
            setMobileTab("preview");
            setLoading(false);
          }
        })
        .catch(() => {});
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [loading, projectId]);

  async function saveEnvVars(vars: EnvVars) {
    setEnvVars(vars);
    await fetch(`/api/projects/${projectId}/envvars`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vars),
    });
  }

  // Main entry point — checks for vague prompt / missing API keys first
  function handlePromptSubmit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const needed = detectNeededApis(trimmed, envVars);
    if (needed.length > 0) {
      setFlow({ type: "apikeys", pendingPrompt: trimmed, needed, keyValues: {} });
      return;
    }

    if (isVague(trimmed) && messages.length === 0) {
      setFlow({ type: "clarify", pendingPrompt: trimmed, answers: {} });
      return;
    }

    runGenerate(trimmed);
  }

  async function runGenerate(text: string, extraEnv?: EnvVars) {
    setFlow({ type: "idle" });
    const userMessage: Message = { id: `tmp-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);
    setIframeError(null);
    setLastPrompt(text);

    const mergedEnv = extraEnv ? { ...envVars, ...extraEnv } : envVars;

    try {
      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, envVars: mergedEnv }),
      });
      if (!res.ok) throw new Error("Generation failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const eventLine = part.match(/^event: (\w+)/)?.[1];
          const dataLine = part.match(/^data: (.+)/m)?.[1];
          if (!eventLine || !dataLine) continue;
          try {
            const payload = JSON.parse(dataLine);
            if (eventLine === "status") setLoadingStatus(payload.text);
            else if (eventLine === "done") {
              setFiles(payload.files);
              const meta = payload.modelUsed
                ? `\n\n_${payload.modelUsed} · ${payload.complexity ?? ""} · $${(payload.estimatedCostUsd ?? 0).toFixed(4)}_`
                : "";
              setMessages((prev) => [...prev, { id: payload.tempMessageId ?? `msg-${Date.now()}`, role: "assistant", content: (payload.summary ?? "Done! Check the preview.") + meta }]);
              setMobileTab("preview");
            } else if (eventLine === "error") setError(payload.error ?? "Generation failed");
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!prompt.trim() || loading) return;
    const text = prompt;
    setPrompt("");
    handlePromptSubmit(text);
  }

  async function handlePublish(slug?: string) {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      setPublishSlug(data.url);
      setShowPublishDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    await fetch(`/api/projects/${projectId}/publish`, { method: "DELETE" });
    setPublishSlug(null);
  }

  function exportHtml() {
    const html = buildStandaloneHtml(files, projectName);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasFiles = Object.keys(files).length > 0;
  const publishUrl = publishSlug ?? null;
  const publishDomain = publishUrl ? publishUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;

  // ── Inline flow cards ─────────────────────────────────────────────────────
  function ClarifyCard() {
    const [style, setStyle] = useState("");
    const [type, setType] = useState("");
    const [extra, setExtra] = useState("");
    const styleOpts = ["Dark & minimal", "Light & clean", "Bold & colorful", "Professional"];
    const typeOpts = ["Dashboard", "Landing page", "E-commerce", "Tool / App", "Social / Community"];
    if (flow.type !== "clarify") return null;
    const f = flow;
    function submit(skip = false) {
      let full = f.pendingPrompt;
      if (!skip) {
        if (type) full += `. Type: ${type}`;
        if (style) full += `. Style: ${style}`;
        if (extra) full += `. Details: ${extra}`;
      }
      runGenerate(full);
    }
    return (
      <div className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/5 p-4 max-w-[92%] space-y-3">
        <p className="text-xs font-medium text-fuchsia-300">A few quick questions to build exactly what you want:</p>
        <div>
          <p className="text-[10px] text-gray-400 mb-1.5">What type of app?</p>
          <div className="flex flex-wrap gap-1.5">
            {typeOpts.map(o => (
              <button key={o} onClick={() => setType(o === type ? "" : o)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${type === o ? "border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-300" : "border-white/10 text-gray-400 hover:border-white/20"}`}>{o}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1.5">Style?</p>
          <div className="flex flex-wrap gap-1.5">
            {styleOpts.map(o => (
              <button key={o} onClick={() => setStyle(o === style ? "" : o)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${style === o ? "border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-300" : "border-white/10 text-gray-400 hover:border-white/20"}`}>{o}</button>
            ))}
          </div>
        </div>
        <input value={extra} onChange={e => setExtra(e.target.value)}
          placeholder="Any specific features? (optional)"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
        <div className="flex gap-2">
          <button onClick={() => submit()} className="rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300 px-3 py-1.5 text-xs hover:bg-fuchsia-500/30 transition-colors">Build it →</button>
          <button onClick={() => submit(true)} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 transition-colors">Skip, just build</button>
        </div>
      </div>
    );
  }

  function ApiKeyCard() {
    const [values, setValues] = useState<Record<string, string>>({});
    if (flow.type !== "apikeys") return null;
    const f = flow;
    async function submit(skip = false) {
      let newEnv = envVars;
      if (!skip && Object.keys(values).length > 0) {
        newEnv = { ...envVars, ...values };
        await saveEnvVars(newEnv);
      }
      runGenerate(f.pendingPrompt, newEnv);
    }
    return (
      <div className="rounded-xl border border-blue-400/20 bg-blue-500/5 p-4 max-w-[92%] space-y-3">
        <p className="text-xs font-medium text-blue-300">This app needs API keys. Add them now to make it work:</p>
        {flow.needed.map(api => (
          <div key={api.key}>
            <label className="text-[10px] text-gray-400 mb-1 block">{api.name} — <span className="text-gray-500">{api.hint}</span></label>
            <input
              value={values[api.key] ?? ""}
              onChange={e => setValues(v => ({ ...v, [api.key]: e.target.value }))}
              placeholder={api.placeholder || `Your ${api.name} key`}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-400/40 font-mono"
            />
          </div>
        ))}
        <div className="flex gap-2">
          <button onClick={() => submit()} className="rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1.5 text-xs hover:bg-blue-500/30 transition-colors">Save & Build →</button>
          <button onClick={() => submit(true)} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 transition-colors">Build without keys</button>
        </div>
      </div>
    );
  }

  // ── Shared chat panel ─────────────────────────────────────────────────────
  const chatPanel = (
    <div className="flex flex-col h-full bg-[#0c0c12]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !loading && flow.type === "idle" && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-gray-300 font-medium mb-1">Start building</p>
            <p className="text-xs text-gray-500">Describe the app you want and I will generate a live preview instantly.</p>
            <div className="mt-3 space-y-1">
              {["A SaaS dashboard with charts and analytics", "An e-commerce store with product catalog", "A landing page for a startup"].map((ex) => (
                <button key={ex} onClick={() => setPrompt(ex)}
                  className="block w-full text-left text-xs text-gray-500 hover:text-fuchsia-300 px-2 py-1 rounded hover:bg-white/5 transition-colors">{ex}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`text-sm max-w-[92%] ${m.role === "user" ? "ml-auto" : ""}`}>
            {m.role === "user" ? (
              <div className="rounded-2xl rounded-br-sm bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-3.5 py-2.5 leading-relaxed">{m.content}</div>
            ) : (
              <div className="rounded-2xl rounded-bl-sm bg-white/5 border border-white/10 text-gray-200 px-3.5 py-2.5 leading-relaxed">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-4 w-4 rounded bg-gradient-to-br from-fuchsia-500 to-indigo-500 shrink-0" />
                  <span className="text-xs font-medium text-fuchsia-300">AI</span>
                </div>
                {m.content}
              </div>
            )}
          </div>
        ))}

        {/* Clarification / API key flow cards */}
        <ClarifyCard />
        <ApiKeyCard />

        {loading && (
          <div className="rounded-2xl rounded-bl-sm bg-white/5 border border-white/10 px-3.5 py-2.5 max-w-[92%]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="h-4 w-4 rounded bg-gradient-to-br from-fuchsia-500 to-indigo-500 shrink-0" />
              <span className="text-xs font-medium text-fuchsia-300">AI</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
              </span>
              {loadingStatus}
            </div>
          </div>
        )}
        {iframeError && !loading && (
          <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs px-3.5 py-3 max-w-[92%] space-y-2">
            <p className="font-medium">App error detected</p>
            <p className="text-orange-400/80 line-clamp-2">{iframeError}</p>
            <button onClick={() => { const e = iframeError; setIframeError(null); runGenerate(`Fix this JavaScript error completely:\n\n${e}`); }}
              className="rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-200 px-3 py-1.5 text-xs transition-colors font-medium">
              Fix errors →
            </button>
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-3.5 py-3 max-w-[92%] space-y-2">
            <p>{error}</p>
            {lastPrompt && (
              <button onClick={() => { setError(null); runGenerate(lastPrompt); }}
                className="rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 px-3 py-1.5 text-xs transition-colors">
                Try again
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3 shrink-0">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-fuchsia-400/40 transition-colors">
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Describe what to build or change..."
            rows={3}
            className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none" />
          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <span className="text-[10px] text-gray-600">Enter to send</span>
            <button onClick={handleSend} disabled={loading || !prompt.trim()}
              className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
              {loading ? "Generating..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Shared preview panel ──────────────────────────────────────────────────
  const previewPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 bg-[#0d0d14] shrink-0">
        {(["preview", "code"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>
            {tab === "preview" ? "Preview" : "Code"}
          </button>
        ))}
        {publishUrl && (
          <a href={publishUrl} target="_blank" rel="noreferrer"
            className="ml-auto text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />{publishDomain}
          </a>
        )}
      </div>
      <div className="flex-1 overflow-hidden relative">
        {hasFiles ? (
          activeTab === "preview" ? <IframePreview files={files} projectName={projectName} /> : <CodeViewer files={files} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-600 text-sm">
            {loading ? "" : "Describe something in the chat to get started."}
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-[#0a0a0f]/70 backdrop-blur-sm flex items-center justify-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-4 flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-fuchsia-400 border-t-transparent animate-spin" />
              <span className="text-sm text-gray-200">{loadingStatus}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]">
      <header className="border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur px-4 py-2.5 flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="shrink-0"><Logo size="sm" /></Link>
          <span className="text-gray-700 hidden sm:inline">/</span>
          <h1 className="text-sm font-medium text-white truncate hidden sm:block">{projectName}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {publishUrl ? (
            <div className="flex items-center gap-1.5">
              <a href={publishUrl} target="_blank" rel="noreferrer"
                className="text-xs rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 px-3 py-1.5 hover:bg-green-500/20 transition-colors">Live ↗</a>
              <button onClick={() => navigator.clipboard.writeText(publishUrl ?? "")}
                className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-300 px-2 py-1.5 hover:bg-white/10 hidden sm:block">Copy</button>
              <button onClick={handleUnpublish} className="text-xs text-gray-500 hover:text-red-400 px-1 py-1.5 transition-colors">×</button>
            </div>
          ) : (
            <button onClick={() => setShowPublishDialog(true)} disabled={!hasFiles || publishing}
              className="text-xs rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300 px-3 py-1.5 hover:bg-fuchsia-500/20 transition-colors disabled:opacity-40 flex items-center gap-1.5">
              {publishing ? <><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse" /> Publishing...</> : "Publish"}
            </button>
          )}
          <button onClick={exportHtml} disabled={!hasFiles}
            className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-300 px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-40 hidden sm:block">
            HTML
          </button>
          <a href={hasFiles ? `/api/projects/${projectId}/export-app` : undefined}
            download
            className={`text-xs rounded-lg border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 px-3 py-1.5 hover:bg-indigo-500/20 transition-colors hidden sm:block ${!hasFiles ? "pointer-events-none opacity-40" : ""}`}>
            📱 Export App
          </a>
        </div>
      </header>

      {/* Desktop */}
      <div className="hidden sm:flex flex-1 overflow-hidden">
        <div className="w-[340px] flex flex-col border-r border-white/10 shrink-0">{chatPanel}</div>
        <div className="flex-1 overflow-hidden">{previewPanel}</div>
      </div>

      {/* Mobile */}
      <div className="flex sm:hidden flex-1 overflow-hidden flex-col">
        <div className="flex-1 overflow-hidden">{mobileTab === "chat" ? chatPanel : previewPanel}</div>
        <div className="shrink-0 border-t border-white/10 bg-[#0c0c12] flex">
          {(["chat", "preview"] as const).map((tab) => (
            <button key={tab} onClick={() => setMobileTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-0.5 ${mobileTab === tab ? "text-fuchsia-400 border-t-2 border-fuchsia-400 -mt-px" : "text-gray-500"}`}>
              {tab === "chat" ? (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Chat</>
              ) : (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>Preview</>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Publish dialog */}
      {showPublishDialog && (
        <PublishDialog
          projectId={projectId}
          projectName={projectName}
          publishing={publishing}
          publishError={error}
          onPublish={(slug) => handlePublish(slug)}
          onClose={() => setShowPublishDialog(false)}
        />
      )}
    </div>
  );
}

// ── Publish dialog ─────────────────────────────────────────────────────────────
function PublishDialog({ projectId, projectName, publishing, publishError, onPublish, onClose }: {
  projectId: string; projectName: string; publishing: boolean;
  publishError: string | null; onPublish: (slug: string) => void; onClose: () => void;
}) {
  function defaultSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  }
  const [slug, setSlug] = useState(defaultSlug(projectName));
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<"available" | "taken" | null>(null);
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function sanitize(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-").slice(0, 40);
  }

  function onChange(v: string) {
    const s = sanitize(v);
    setSlug(s);
    setAvailability(null);
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    if (s.length < 2) return;
    setChecking(true);
    checkTimeout.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/projects/${projectId}/publish/check-slug?slug=${s}`);
        const d = await r.json();
        setAvailability(d.available ? "available" : "taken");
      } catch { /* ignore */ }
      setChecking(false);
    }, 400);
  }

  const canPublish = slug.length >= 2 && availability !== "taken" && !publishing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl border border-white/10 bg-[#141418] p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-white mb-1">Publish your app</h2>
        <p className="text-xs text-gray-500 mb-5">Choose your subdomain on thatcode.dev</p>

        <div className="flex items-center rounded-xl border border-white/10 bg-white/5 focus-within:border-fuchsia-400/40 transition-colors overflow-hidden">
          <span className="pl-3 pr-1 text-gray-500 text-sm shrink-0 select-none">thatcode.dev/</span>
          <input
            value={slug}
            onChange={e => onChange(e.target.value)}
            placeholder="your-app-name"
            className="flex-1 bg-transparent py-2.5 pr-3 text-sm text-white focus:outline-none font-mono"
            autoFocus
          />
          <span className="pr-3 text-xs shrink-0">
            {checking && <span className="text-gray-500">…</span>}
            {!checking && availability === "available" && <span className="text-green-400">✓</span>}
            {!checking && availability === "taken" && <span className="text-red-400">✗</span>}
          </span>
        </div>

        {availability === "taken" && (
          <p className="mt-1.5 text-xs text-red-400">That name is already taken. Try something else.</p>
        )}
        {availability === "available" && (
          <p className="mt-1.5 text-xs text-green-400">Available! Your app will be at <strong>{slug}.thatcode.dev</strong></p>
        )}
        {publishError && <p className="mt-1.5 text-xs text-red-400">{publishError}</p>}

        <div className="mt-2 pt-3 text-xs text-gray-600 border-t border-white/5">
          <p className="font-medium text-gray-500 mb-1">Want a custom domain? (e.g. myapp.com)</p>
          <p>1. Add a CNAME record: <code className="bg-white/5 px-1 rounded">yourdomain.com → cname.thatcode.dev</code></p>
          <p className="mt-0.5">2. Come back here and enter it — we'll link it automatically.</p>
          <p className="mt-0.5 text-gray-700">Custom domain support coming soon.</p>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={() => onPublish(slug)} disabled={!canPublish}
            className="flex-1 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
            {publishing ? "Publishing…" : "Publish →"}
          </button>
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 text-gray-400 px-4 py-2.5 text-sm hover:bg-white/10 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
