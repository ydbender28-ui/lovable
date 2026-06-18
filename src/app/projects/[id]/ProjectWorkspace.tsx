"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { buildStandaloneHtml } from "@/lib/buildHtml";

type Message = { id: string; role: "user" | "assistant"; content: string };
type ProjectFiles = Record<string, string>;
type EnvVars = Record<string, string>;


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
  projectId,
  projectName,
  initialMessages,
  initialFiles,
  initialPublishSlug,
  initialPrompt,
}: {
  projectId: string;
  projectName: string;
  initialMessages: Message[];
  initialFiles: ProjectFiles;
  initialPublishSlug?: string | null;
  initialPrompt?: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [files, setFiles] = useState<ProjectFiles>(initialFiles);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Thinking...");
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [publishSlug, setPublishSlug] = useState<string | null>(initialPublishSlug ?? null);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState("");
  const [showEnvPanel, setShowEnvPanel] = useState(false);
  const [envVars, setEnvVars] = useState<EnvVars>({});
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoFired = useRef(false);

  // Auto-run the initial prompt once on mount for brand-new projects
  useEffect(() => {
    if (initialPrompt && !autoFired.current && initialMessages.length === 0) {
      autoFired.current = true;
      runGenerate(initialPrompt);
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
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) setLoadingStatus("Thinking...");
  }, [loading]);

  async function runGenerate(text: string) {
    const userMessage: Message = { id: `tmp-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);
    setLastPrompt(text);
    setModelUsed(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
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
            if (eventLine === "status") {
              setLoadingStatus(payload.text);
            } else if (eventLine === "done") {
              setFiles(payload.files);
              if (payload.modelUsed) setModelUsed(payload.modelUsed);
              setMessages((prev) => [...prev, { id: payload.message.id, role: "assistant", content: payload.message.content }]);
            } else if (eventLine === "error") {
              setError(payload.error ?? "Generation failed");
            }
          } catch { /* ignore parse errors */ }
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
    await runGenerate(text);
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishStatus("Publishing...");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      setPublishSlug(data.url);
      setPublishStatus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
      setPublishStatus("");
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    await fetch(`/api/projects/${projectId}/publish`, { method: "DELETE" });
    setPublishSlug(null);
  }

  async function saveEnvVar() {
    if (!newKey.trim()) return;
    const updated = { ...envVars, [newKey.trim()]: newVal };
    setEnvVars(updated);
    setNewKey("");
    setNewVal("");
    await fetch(`/api/projects/${projectId}/envvars`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  }

  async function removeEnvVar(key: string) {
    const updated = { ...envVars };
    delete updated[key];
    setEnvVars(updated);
    await fetch(`/api/projects/${projectId}/envvars`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
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

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]">
      <header className="border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur px-4 py-2.5 flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors shrink-0">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-500" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-sm font-medium text-white truncate">{projectName}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowEnvPanel((v) => !v)}
            className={`text-xs rounded-lg px-3 py-1.5 border transition-colors ${showEnvPanel ? "border-fuchsia-400/50 bg-fuchsia-500/10 text-fuchsia-300" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"}`}
          >
            {"{}"} APIs
            {Object.keys(envVars).length > 0 && (
              <span className="ml-1.5 rounded-full bg-fuchsia-500/30 text-fuchsia-300 px-1.5 text-[10px]">{Object.keys(envVars).length}</span>
            )}
          </button>

          {publishUrl ? (
            <div className="flex items-center gap-1.5">
              <a href={publishUrl} target="_blank" rel="noreferrer"
                className="text-xs rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 px-3 py-1.5 hover:bg-green-500/20 transition-colors">
                Live
              </a>
              <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">{publishDomain}</span>
              <button onClick={() => navigator.clipboard.writeText(publishUrl ?? "")}
                className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-300 px-2 py-1.5 hover:bg-white/10">
                Copy
              </button>
              <button onClick={handleUnpublish} className="text-xs text-gray-500 hover:text-red-400 px-1 py-1.5 transition-colors">
                x
              </button>
            </div>
          ) : (
            <button
              onClick={handlePublish}
              disabled={!hasFiles || publishing}
              className="text-xs rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300 px-3 py-1.5 hover:bg-fuchsia-500/20 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              {publishing ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
                  {publishStatus || "Publishing..."}
                </>
              ) : "Publish"}
            </button>
          )}

          <button
            onClick={exportHtml}
            disabled={!hasFiles}
            className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-300 px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            Export HTML
          </button>
        </div>
      </header>

      {showEnvPanel && (
        <div className="border-b border-white/10 bg-[#0d0d14] px-4 py-3">
          <p className="text-xs text-gray-400 mb-3">
            API keys and env vars injected into generated code as constants. Never exposed to end users via publish.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(envVars).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
                <span className="text-fuchsia-300 font-mono">{k}</span>
                <span className="text-gray-500">=</span>
                <span className="text-gray-400 font-mono max-w-[120px] truncate">{v}</span>
                <button onClick={() => removeEnvVar(k)} className="text-gray-600 hover:text-red-400 ml-1 transition-colors">x</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="KEY (e.g. OPENAI_API_KEY)"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40 font-mono w-48"
            />
            <input
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              placeholder="value"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40 font-mono flex-1"
            />
            <button
              onClick={saveEnvVar}
              disabled={!newKey.trim()}
              className="rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300 px-3 py-1.5 text-xs hover:bg-fuchsia-500/30 transition-colors disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[340px] flex flex-col border-r border-white/10 bg-[#0c0c12] shrink-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-gray-300 font-medium mb-1">Start building</p>
                <p className="text-xs text-gray-500">Describe the app you want and I will generate a live preview instantly.</p>
                <div className="mt-3 space-y-1">
                  {["A SaaS dashboard with charts", "An e-commerce store", "A landing page for a startup"].map((ex) => (
                    <button key={ex} onClick={() => setPrompt(ex)}
                      className="block w-full text-left text-xs text-gray-500 hover:text-fuchsia-300 px-2 py-1 rounded hover:bg-white/5 transition-colors">
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`text-sm max-w-[92%] ${m.role === "user" ? "ml-auto" : ""}`}>
                {m.role === "user" ? (
                  <div className="rounded-2xl rounded-br-sm bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-3.5 py-2.5 leading-relaxed">
                    {m.content}
                  </div>
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
            {loading && (
              <div className="rounded-2xl rounded-bl-sm bg-white/5 border border-white/10 px-3.5 py-2.5 max-w-[92%]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-4 w-4 rounded bg-gradient-to-br from-fuchsia-500 to-indigo-500 shrink-0" />
                  <span className="text-xs font-medium text-fuchsia-300">AI</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse"
                        style={{ animationDelay: `${i * 200}ms` }} />
                    ))}
                  </span>
                  {loadingStatus}
                </div>
              </div>
            )}
            {!loading && modelUsed && (
              <div className="text-[10px] text-gray-600 px-1">via {modelUsed}</div>
            )}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-3.5 py-3 max-w-[92%] space-y-2">
                <p>{error}</p>
                {lastPrompt && (
                  <button
                    onClick={() => { setError(null); runGenerate(lastPrompt); }}
                    className="rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 px-3 py-1.5 text-xs transition-colors"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-fuchsia-400/40 transition-colors">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Describe what to build or change..."
                rows={3}
                className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
              />
              <div className="flex items-center justify-between px-2.5 pb-2.5">
                <span className="text-[10px] text-gray-600">Enter to send</span>
                <button
                  onClick={handleSend}
                  disabled={loading || !prompt.trim()}
                  className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {loading ? "Generating..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 bg-[#0d0d14] shrink-0">
            {(["preview", "code"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "preview" ? "Preview" : "Code"}
              </button>
            ))}
            {publishUrl && (
              <a href={publishUrl} target="_blank" rel="noreferrer"
                className="ml-auto text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                {publishDomain}
              </a>
            )}
          </div>

          <div className="flex-1 overflow-hidden relative">
            {hasFiles ? (
              activeTab === "preview" ? (
                <IframePreview files={files} projectName={projectName} />
              ) : (
                <CodeViewer files={files} />
              )
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
      </div>
    </div>
  );
}
