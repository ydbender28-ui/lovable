"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { buildStandaloneHtml } from "@/lib/buildHtml";
import Logo from "@/components/Logo";
import IntegrationsPanel from "./IntegrationsPanel";

type Message = { id: string; role: "user" | "assistant"; content: string };
type ProjectFiles = Record<string, string>;
type EnvVars = Record<string, string>;
type PreviewMode = "desktop" | "tablet" | "mobile";

const API_DETECTORS = [
  { keywords: ["stripe", "payment", "checkout", "subscription", "billing", "accept card", "credit card"], name: "Stripe", key: "STRIPE_PUBLISHABLE_KEY", hint: "stripe.com → Developers → API Keys", placeholder: "pk_live_..." },
  { keywords: ["supabase", "postgres", "realtime database", "supabase auth"], name: "Supabase", key: "SUPABASE_URL", hint: "app.supabase.com → Project Settings → API", placeholder: "https://xyz.supabase.co" },
  { keywords: ["openai", "gpt", "chatgpt", "dall-e", "ai chat", "ai completion"], name: "OpenAI", key: "OPENAI_API_KEY", hint: "platform.openai.com → API Keys", placeholder: "sk-..." },
  { keywords: ["google maps", "maps api", "directions", "geocod", "show map", "embed map"], name: "Google Maps", key: "GOOGLE_MAPS_API_KEY", hint: "console.cloud.google.com → Maps JavaScript API", placeholder: "AIza..." },
  { keywords: ["mapbox", "mapbox map"], name: "Mapbox", key: "MAPBOX_TOKEN", hint: "account.mapbox.com → Access Tokens", placeholder: "pk.ey..." },
  { keywords: ["twilio", "sms", "text message", "send sms"], name: "Twilio", key: "TWILIO_ACCOUNT_SID", hint: "console.twilio.com → Account Info", placeholder: "AC..." },
  { keywords: ["firebase", "firestore"], name: "Firebase", key: "FIREBASE_API_KEY", hint: "Firebase Console → Project Settings → Your apps", placeholder: "AIza..." },
  { keywords: ["airtable", "airtable base", "airtable database"], name: "Airtable", key: "AIRTABLE_API_KEY", hint: "airtable.com → Account → API", placeholder: "pat..." },
  { keywords: ["cloudinary", "image upload", "upload image", "file upload"], name: "Cloudinary", key: "CLOUDINARY_CLOUD_NAME", hint: "cloudinary.com/console → Dashboard", placeholder: "my-cloud" },
  { keywords: ["resend", "send email", "email form", "contact form email"], name: "Resend", key: "RESEND_API_KEY", hint: "resend.com → API Keys", placeholder: "re_..." },
  { keywords: ["clerk", "user auth", "user login", "authentication"], name: "Clerk", key: "CLERK_PUBLISHABLE_KEY", hint: "dashboard.clerk.com → API Keys", placeholder: "pk_live_..." },
  { keywords: ["pusher", "realtime", "live update", "websocket"], name: "Pusher", key: "PUSHER_APP_KEY", hint: "dashboard.pusher.com → App → Keys", placeholder: "abc..." },
];

const QUICK_ACTIONS = [
  { label: "📱 Make responsive", prompt: "Make the entire layout fully responsive for mobile. Fix overflows, adjust font sizes, stack columns on mobile, ensure touch targets are at least 44px." },
  { label: "🌙 Dark mode", prompt: "Add a dark/light mode toggle button. Use CSS variables for colors and persist the preference in localStorage." },
  { label: "✨ Animations", prompt: "Add smooth micro-animations and transitions throughout — hover effects, entry animations, state transitions. Keep them fast (150-300ms) and polished." },
  { label: "🎨 Polish UI", prompt: "Significantly improve the visual design. Better spacing, consistent typography, refined shadows, modern color usage. Make it look like a premium product." },
  { label: "⚡ Loading states", prompt: "Add skeleton loading placeholders and loading spinners to all async operations. Add disabled states and loading indicators to buttons." },
  { label: "🔍 Add search", prompt: "Add real-time search/filter functionality to the main content area that works as the user types." },
  { label: "🔔 Notifications", prompt: "Add a toast notification system for user feedback. Show success, error, and info toasts with smooth slide-in animations." },
  { label: "♿ Accessibility", prompt: "Improve accessibility: add ARIA labels, keyboard navigation (Tab/Enter/Escape), visible focus rings, and screen reader support throughout." },
  { label: "📊 Add stats", prompt: "Add an analytics/stats section with key metrics, animated number counters, and trend indicators." },
  { label: "❌ Fix errors", prompt: "Review the code for runtime errors, missing null checks, and edge cases. Fix all issues found." },
  { label: "🌐 Add SEO", prompt: "Add SEO meta tags (title, description, og:image, twitter card) to index.html. Make the title and description match the app's purpose. Add a canonical URL, viewport meta, and favicon link." },
  { label: "⚡ Performance", prompt: "Optimize performance: lazy-load images with loading='lazy', debounce search inputs, memoize expensive list renders with useMemo, and minimize re-renders." },
  { label: "🔐 Auth gate", prompt: "Add a simple login gate: a login page with email/password form (use localStorage to persist session with a demo account: user@demo.com / demo123), redirect to main app on success, and a logout button in the header." },
];

function detectNeededApis(prompt: string, existing: EnvVars) {
  const t = prompt.toLowerCase();
  return API_DETECTORS.filter(api => api.keywords.some(kw => t.includes(kw)) && !existing[api.key]);
}


function getSmartSuggestions(files: ProjectFiles): string[] {
  const c = Object.values(files).join(" ").toLowerCase();
  const pool: [boolean, string][] = [
    [c.includes("table"), "Add column sorting, search filtering, and pagination to the table"],
    [c.includes("form"), "Add real-time input validation with inline error messages and success states"],
    [c.includes("chart") || c.includes("recharts"), "Make charts interactive with hover tooltips, zoom, and animated entry"],
    [c.includes("card"), "Add smooth hover lift effects and click animations to the cards"],
    [!c.includes("dark") && !c.includes("theme"), "Add a dark / light mode toggle with smooth transitions"],
    [!c.includes("responsive") && !c.includes("@media"), "Make the full layout responsive for all screen sizes"],
    [c.includes("button"), "Add loading spinners and success checkmarks to action buttons"],
    [c.includes("nav") || c.includes("sidebar"), "Make navigation sticky with scroll-aware highlight and mobile hamburger menu"],
    [c.includes("list") || c.includes("items"), "Add drag-and-drop reordering with visual drop indicators"],
    [c.includes("modal") || c.includes("dialog"), "Add keyboard navigation (Escape to close) and focus trapping to modals"],
    [true, "Add skeleton loading states for all dynamic content"],
    [true, "Polish with better typography, spacing rhythm, and consistent shadows"],
    [true, "Add confetti or success animations for key user actions"],
  ];
  return pool.filter(([show]) => show).slice(0, 3).map(([, t]) => t as string);
}

function IframePreview({ files, projectName, mode }: { files: ProjectFiles; projectName: string; mode: PreviewMode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

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
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const blob = new Blob([previewHtml], { type: "text/html" });
    blobUrlRef.current = URL.createObjectURL(blob);
    iframeRef.current.src = blobUrlRef.current;
    return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
  }, [previewHtml]);

  const isDevice = mode !== "desktop";
  const frameWidth = mode === "mobile" ? "390px" : mode === "tablet" ? "768px" : "100%";
  const frameHeight = mode === "mobile" ? "844px" : "100%";
  const isMobile = mode === "mobile";

  return (
    <div style={{
      flex: 1, minHeight: 0, display: "flex", justifyContent: "center", alignItems: "flex-start",
      background: isDevice ? "#080810" : "transparent",
      padding: isDevice ? "24px 16px" : "0",
      overflowY: isDevice ? "auto" : "hidden",
    }}>
      <div style={{
        width: frameWidth, height: frameHeight, flexShrink: 0, position: "relative",
        overflow: "hidden",
        borderRadius: isMobile ? "2.5rem" : isDevice ? "12px" : "0",
        border: isMobile ? "6px solid #374151" : isDevice ? "1px solid rgba(255,255,255,0.12)" : "none",
        boxShadow: isDevice ? "0 24px 60px rgba(0,0,0,0.6)" : "none",
      }}>
        {isMobile && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 110, height: 28, background: "#374151", borderRadius: "0 0 20px 20px", zIndex: 10 }} />}
        <iframe
          ref={iframeRef}
          style={{ width: "100%", height: "100%", border: "none", background: "#0a0a0f", display: "block" }}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}

function CodeViewer({ files }: { files: ProjectFiles }) {
  const [activeFile, setActiveFile] = useState(() => Object.keys(files)[0] ?? "");
  const [copied, setCopied] = useState(false);
  const fileKeys = Object.keys(files);

  useEffect(() => {
    if (!files[activeFile] && fileKeys.length > 0) setActiveFile(fileKeys[0]);
  }, [files, activeFile, fileKeys]);

  function copyFile() {
    navigator.clipboard.writeText(files[activeFile] ?? "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

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
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-[#0c0c12] shrink-0">
          <span className="text-[10px] text-gray-500 font-mono truncate">{activeFile}</span>
          <button onClick={copyFile} className="text-[11px] text-gray-500 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/10 shrink-0 ml-2">
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <pre className="flex-1 overflow-auto p-4 text-xs text-gray-300 font-mono leading-relaxed bg-[#0d0d14] whitespace-pre-wrap break-all">
          {files[activeFile] ?? ""}
        </pre>
      </div>
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
  const [autoFixCountdown, setAutoFixCountdown] = useState<number | null>(null);
  const autoFixTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFixCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [publishSlug, setPublishSlug] = useState<string | null>(initialPublishSlug ?? null);
  const [publishing, setPublishing] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [liveUpdated, setLiveUpdated] = useState(false);
  const [dnsInfo, setDnsInfo] = useState<{ domain: string; cname: string } | null>(null);
  const [envVars, setEnvVars] = useState<EnvVars>({});

  // New features
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [enhancing, setEnhancing] = useState(false);
  const [uploadImage, setUploadImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [previousFiles, setPreviousFiles] = useState<ProjectFiles | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versionList, setVersionList] = useState<Array<{ id: string; createdAt: string; modelUsed: string | null }>>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  type FlowState =
    | { type: "idle" }
    | { type: "clarify"; pendingPrompt: string; answers: Record<string, string> }
    | { type: "apikeys"; pendingPrompt: string; needed: typeof API_DETECTORS; keyValues: Record<string, string> };
  const [flow, setFlow] = useState<FlowState>({ type: "idle" });

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoFired = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, [messages, loading, flow, suggestions]);

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
      if (e.data?.type === "preview-error") {
        const err = e.data.error as string;
        setIframeError(err);
        // Auto-fix: start 4-second countdown then fix automatically
        if (autoFixTimerRef.current) clearTimeout(autoFixTimerRef.current);
        if (autoFixCountdownRef.current) clearInterval(autoFixCountdownRef.current);
        setAutoFixCountdown(4);
        autoFixCountdownRef.current = setInterval(() => {
          setAutoFixCountdown((n) => {
            if (n === null || n <= 1) {
              clearInterval(autoFixCountdownRef.current!);
              autoFixCountdownRef.current = null;
              return null;
            }
            return n - 1;
          });
        }, 1000);
        autoFixTimerRef.current = setTimeout(() => {
          setIframeError(null);
          setAutoFixCountdown(null);
          runGenerate(
            `There is a JS runtime error. Fix ONLY the broken code — do not change any functionality, layout, or features. Return every file in ===FILE: path=== format. Error: ${err}`,
            undefined,
            "claude-sonnet-4-6",
            true
          );
        }, 4000);
      }
      // Admin "Save to Site" button in generated apps sends TC_SAVE_STATE
      if (e.data?.type === "TC_SAVE_STATE" && e.data?.state) {
        handleAdminSave(e.data.state as string);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [files]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdminSave(serializedState: string) {
    // Embed the saved admin data into the source code so published site reflects changes
    const currentApp = files["src/App.tsx"] ?? "";
    if (!currentApp) return;

    // Replace or inject a TC_SAVED_DATA block near the top of App.tsx
    const dataBlock = `// TC_SAVED_DATA — auto-updated by admin panel\nconst TC_INITIAL_DATA = ${serializedState};\n`;
    let updatedApp: string;
    if (currentApp.includes("// TC_SAVED_DATA")) {
      updatedApp = currentApp.replace(/\/\/ TC_SAVED_DATA[\s\S]*?const TC_INITIAL_DATA = .*?;\n/, dataBlock);
    } else {
      // Inject after the first const/let/function line so it's accessible
      updatedApp = currentApp.replace(/^(import .+;\n)+/, (m) => m + "\n" + dataBlock);
    }

    // Also inject a hint into the HTML so window.TC_INITIAL_DATA is available
    const currentHtml = files["index.html"] ?? "";
    const dataScript = `<script>window.TC_INITIAL_DATA = ${serializedState};</script>`;
    let updatedHtml = currentHtml;
    if (currentHtml.includes("window.TC_INITIAL_DATA")) {
      updatedHtml = currentHtml.replace(/<script>window\.TC_INITIAL_DATA = .*?;<\/script>/, dataScript);
    } else {
      updatedHtml = currentHtml.replace("</body>", `  ${dataScript}\n</body>`);
    }

    const updatedFiles = { ...files, "src/App.tsx": updatedApp, "index.html": updatedHtml };
    setFiles(updatedFiles);

    // Save as a new version
    try {
      await fetch(`/api/projects/${projectId}/save-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: updatedFiles, summary: "Admin data saved to site" }),
      });
      // Auto-republish if already published
      if (publishSlug) {
        await fetch(`/api/projects/${projectId}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: publishSlug }),
        });
      }
      setMessages((prev) => [...prev, { id: `msg-admin-${Date.now()}`, role: "assistant", content: "✓ Admin changes saved to your site. The published version is now updated." }]);
    } catch {
      // silent
    }
  }

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== "visible" || !loading) return;
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

  // ⌘K focuses the prompt
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function saveEnvVars(vars: EnvVars) {
    setEnvVars(vars);
    await fetch(`/api/projects/${projectId}/envvars`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vars),
    });
  }

  async function handlePromptSubmit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // If user types a short fix command, inject full context so AI knows what to fix
    const isFix = /^fix(\s|$)/i.test(trimmed) || trimmed.toLowerCase() === "fix";
    if (isFix) {
      // Try to read the error from the iframe DOM directly
      let liveError = iframeError;
      if (!liveError) {
        try {
          const iframes = document.querySelectorAll("iframe");
          for (const f of iframes) {
            const errEl = f.contentDocument?.getElementById("__err");
            if (errEl && errEl.style.display !== "none" && errEl.textContent) {
              liveError = errEl.textContent;
              break;
            }
          }
        } catch { /* cross-origin, ignore */ }
      }
      const fixPrompt = liveError
        ? `There is a JS runtime error. Fix ONLY the broken code — do not change any functionality, layout, or features. Return every file in ===FILE: path=== format. Error: ${liveError}`
        : `Fix all JavaScript errors in the current code. Common issue: CSS property names like 'uppercase', 'lowercase', 'capitalize' used as bare JS identifiers — replace each with the correct inline style e.g. textTransform:'uppercase'. Return all files in the ===FILE: path=== format.`;
      setIframeError(null);
      runGenerate(fixPrompt, undefined, "claude-sonnet-4-6", true);
      return;
    }

    const needed = detectNeededApis(trimmed, envVars);
    if (needed.length > 0) {
      setFlow({ type: "apikeys", pendingPrompt: trimmed, needed, keyValues: {} });
      return;
    }
    if (messages.length === 0) {
      setLoadingStatus("Analyzing your request…");
      setLoading(true);
      try {
        const res = await fetch("/api/check-vague", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed }),
        });
        const { vague } = await res.json();
        if (vague) {
          setLoading(false);
          setFlow({ type: "clarify", pendingPrompt: trimmed, answers: {} });
          return;
        }
      } catch { /* ignore — just generate */ }
      setLoading(false);
    }
    runGenerate(trimmed);
  }

  async function runGenerate(text: string, extraEnv?: EnvVars, forceModel?: string, silent?: boolean) {
    setFlow({ type: "idle" });
    setSuggestions([]);
    setShowUndo(false);
    if (!silent) {
      const userMessage: Message = { id: `tmp-${Date.now()}`, role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
    }
    setLoading(true);
    setError(null);
    setIframeError(null);
    setLastPrompt(text);

    if (Object.keys(files).length > 0) setPreviousFiles({ ...files });

    const mergedEnv = extraEnv ? { ...envVars, ...extraEnv } : envVars;
    const imgPayload = uploadImage ? { imageBase64: uploadImage.base64, imageMimeType: uploadImage.mimeType } : {};
    setUploadImage(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, envVars: mergedEnv, forceModel, ...imgPayload }),
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
              const liveNote = payload.liveUpdated ? "\n\n✓ Live site updated automatically." : "";
              const summary = silent
                ? "✓ Error fixed automatically." + (payload.liveUpdated ? "\n\n✓ Live site updated." : "")
                : (payload.summary ?? "Done! Check the preview.") + meta + liveNote;
              setMessages((prev) => [...prev, {
                id: payload.tempMessageId ?? `msg-${Date.now()}`,
                role: "assistant",
                content: summary,
              }]);
              if (payload.liveUpdated) setLiveUpdated(true);
              setSuggestions(getSmartSuggestions(payload.files));
              setShowUndo(true);
              if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
              undoTimerRef.current = setTimeout(() => setShowUndo(false), 60000);
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

  async function handleEnhancePrompt() {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/enhance-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.enhanced) setPrompt(data.enhanced);
    } catch { /* ignore */ }
    setEnhancing(false);
  }

  function handleImagePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) readImageFile(file);
        break;
      }
    }
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readImageFile(file);
    e.target.value = "";
  }

  function readImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setUploadImage({ base64: result.split(",")[1], mimeType: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
  }

  async function handleLoadVersions() {
    if (loadingVersions || versionList.length > 0) return;
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`);
      const data = await res.json();
      setVersionList(data);
    } catch { /* ignore */ }
    setLoadingVersions(false);
  }

  async function handleRestoreVersion(versionId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}`);
      const data = await res.json();
      if (data.files) {
        setPreviousFiles({ ...files });
        setFiles(data.files);
        setShowUndo(true);
        setShowHistory(false);
        setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: "assistant", content: "Restored that version. You can continue editing from here, or undo to go back." }]);
      }
    } catch { /* ignore */ }
  }

  function handleUndo() {
    if (!previousFiles) return;
    setFiles(previousFiles);
    setPreviousFiles(null);
    setShowUndo(false);
    setSuggestions([]);
    setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: "assistant", content: "Undone — reverted to the previous version." }]);
  }

  async function handleSend() {
    if (!prompt.trim() || loading) return;
    const text = prompt;
    setPrompt("");
    handlePromptSubmit(text);
  }

  async function handlePublish(slug?: string, customDomain?: string, password?: string) {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, customDomain, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      setPublishSlug(data.url);
      setShowPublishDialog(false);
      if (data.customDomain && data.vercelCname) {
        setDnsInfo({ domain: data.customDomain, cname: data.vercelCname });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    await fetch(`/api/projects/${projectId}/publish`, { method: "DELETE" });
    setPublishSlug(null);
    setLiveUpdated(false);
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

  // ── Flow cards ────────────────────────────────────────────────────────────────
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

  // ── Chat panel ─────────────────────────────────────────────────────────────────
  const chatPanel = (
    <div className="flex flex-col h-full bg-[#0c0c12]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !loading && flow.type === "idle" && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-gray-300 font-medium mb-1">Start building</p>
            <p className="text-xs text-gray-500 leading-relaxed">Describe the app you want and I&apos;ll generate a live preview instantly. You can also paste or upload a screenshot to build from a design.</p>
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
              <div className="rounded-2xl rounded-br-sm bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap">{m.content}</div>
            ) : (
              <div className="rounded-2xl rounded-bl-sm bg-white/5 border border-white/10 text-gray-200 px-3.5 py-2.5 leading-relaxed">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-4 w-4 rounded bg-gradient-to-br from-fuchsia-500 to-indigo-500 shrink-0" />
                  <span className="text-xs font-medium text-fuchsia-300">AI</span>
                </div>
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            )}
          </div>
        ))}

        {/* Smart suggestions */}
        {suggestions.length > 0 && !loading && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-gray-600 px-0.5">What&apos;s next?</p>
            {suggestions.map((s) => (
              <button key={s} onClick={() => { setSuggestions([]); runGenerate(s); }}
                className="block w-full text-left text-xs rounded-xl border border-fuchsia-400/15 bg-fuchsia-500/5 text-fuchsia-300/80 px-3.5 py-2 hover:bg-fuchsia-500/10 hover:border-fuchsia-400/30 transition-colors">
                {s} →
              </button>
            ))}
          </div>
        )}

        {/* Undo */}
        {showUndo && previousFiles && !loading && (
          <button onClick={handleUndo}
            className="text-xs rounded-xl border border-orange-400/20 bg-orange-500/5 text-orange-300/80 px-3.5 py-2 hover:bg-orange-500/10 transition-colors w-fit">
            ↩ Undo last change
          </button>
        )}

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
            <p className="font-medium">Error detected</p>
            <p className="text-orange-400/80">Type <strong>fix</strong> in the chat to repair it.</p>
            <button onClick={() => { const e = iframeError; setIframeError(null); runGenerate(`There is a JS runtime error. Fix ONLY the broken code — do not change any functionality, layout, or features. Return every file in ===FILE: path=== format. Error: ${e}`, undefined, "claude-sonnet-4-6", true); }}
              className="rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-200 px-3 py-1.5 text-xs transition-colors font-medium">
              Fix error →
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

      {/* Quick actions */}
      {messages.length > 0 && !loading && (
        <div className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
          {QUICK_ACTIONS.map((a) => (
            <button key={a.label} onClick={() => { setSuggestions([]); runGenerate(a.prompt); }}
              className="shrink-0 text-[11px] rounded-full border border-white/10 bg-white/[0.03] text-gray-400 px-2.5 py-1 hover:border-fuchsia-400/30 hover:text-fuchsia-300 hover:bg-fuchsia-500/5 transition-colors whitespace-nowrap">
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Uploaded image preview */}
      {uploadImage && (
        <div className="px-3 pt-1 shrink-0">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:${uploadImage.mimeType};base64,${uploadImage.base64}`} alt="Upload" className="h-14 w-14 object-cover rounded-lg border border-white/10" />
            <button onClick={() => setUploadImage(null)} className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-400 leading-none">×</button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/10 p-3 shrink-0">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-fuchsia-400/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            onPaste={handleImagePaste}
            placeholder="Describe what to build or change… paste a screenshot too"
            rows={3}
            className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
          />
          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <div className="flex items-center gap-0.5">
              <button onClick={() => fileInputRef.current?.click()} title="Upload screenshot or image"
                className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-white/5 text-sm">
                📎
              </button>
              <button onClick={handleEnhancePrompt} disabled={!prompt.trim() || enhancing} title="AI improves your prompt">
                <span className={`text-sm p-1.5 rounded-lg block transition-colors ${!prompt.trim() || enhancing ? "text-gray-700" : "text-gray-500 hover:text-fuchsia-300 hover:bg-white/5"}`}>
                  {enhancing ? "⏳" : "✨"}
                </span>
              </button>
              {lastPrompt && !loading && (
                <button onClick={() => runGenerate(lastPrompt)} title="Regenerate last prompt"
                  className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-white/5 text-sm">
                  ↺
                </button>
              )}
              <span className="text-[10px] text-gray-700 pl-1 hidden sm:block">⌘K</span>
            </div>
            <button onClick={handleSend} disabled={loading || !prompt.trim()}
              className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
              {loading ? "Generating..." : "Send"}
            </button>
          </div>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
    </div>
  );

  // ── Preview panel ─────────────────────────────────────────────────────────────
  const previewPanel = (
    <div className="flex flex-col overflow-hidden" style={{ height: "100%" }}>
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 bg-[#0d0d14] shrink-0">
        {(["preview", "code"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>
            {tab === "preview" ? "Preview" : "Code"}
          </button>
        ))}

        {activeTab === "preview" && (
          <div className="flex items-center gap-0.5 ml-2 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            {([
              { mode: "desktop" as PreviewMode, icon: "🖥", label: "Desktop" },
              { mode: "tablet" as PreviewMode, icon: "📲", label: "Tablet (768px)" },
              { mode: "mobile" as PreviewMode, icon: "📱", label: "Mobile (390px)" },
            ]).map(({ mode, icon, label }) => (
              <button key={mode} onClick={() => setPreviewMode(mode)} title={label}
                className={`px-2 py-0.5 rounded-md text-sm transition-colors ${previewMode === mode ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                {icon}
              </button>
            ))}
          </div>
        )}

        {publishUrl && (
          <a href={publishUrl} target="_blank" rel="noreferrer"
            className="ml-auto text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors truncate">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />{publishDomain}
          </a>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
        {/* Floating error banner over preview */}
        {iframeError && !loading && activeTab === "preview" && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-xl border border-red-500/30 bg-[#1a0808]/95 backdrop-blur px-4 py-2.5 shadow-xl max-w-[90%]">
            <span className="text-red-400 text-sm shrink-0">⚠</span>
            <p className="text-xs text-red-300 flex-1 whitespace-nowrap">
              Error detected — auto-fixing in {autoFixCountdown ?? 0}s
            </p>
            <button
              onClick={() => {
                if (autoFixTimerRef.current) clearTimeout(autoFixTimerRef.current);
                if (autoFixCountdownRef.current) clearInterval(autoFixCountdownRef.current);
                setAutoFixCountdown(null);
                const e = iframeError; setIframeError(null);
                runGenerate(`There is a JS runtime error. Fix ONLY the broken code — do not change any functionality, layout, or features. Return every file in ===FILE: path=== format. Error: ${e}`, undefined, "claude-sonnet-4-6", true);
              }}
              className="shrink-0 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap"
            >
              Fix now →
            </button>
            <button onClick={() => {
              if (autoFixTimerRef.current) clearTimeout(autoFixTimerRef.current);
              if (autoFixCountdownRef.current) clearInterval(autoFixCountdownRef.current);
              setAutoFixCountdown(null); setIframeError(null);
            }} className="text-gray-600 hover:text-gray-400 text-base leading-none">×</button>
          </div>
        )}
        {hasFiles ? (
          activeTab === "preview"
            ? <IframePreview files={files} projectName={projectName} mode={previewMode} />
            : <CodeViewer files={files} />
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
    <div className="flex flex-col bg-[#0a0a0f]" style={{ height: "100dvh" }}>
      <header className="border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur px-4 py-2.5 flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="shrink-0"><Logo size="sm" /></Link>
          <span className="text-gray-700 hidden sm:inline">/</span>
          <h1 className="text-sm font-medium text-white truncate hidden sm:block">{projectName}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowIntegrations(true)}
            title="Integrations"
            className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-400 px-2.5 py-1.5 hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1.5">
            🔌 Integrations
          </button>
          <button
            onClick={() => { setShowHistory(true); handleLoadVersions(); }}
            title="Version history"
            className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-400 px-2.5 py-1.5 hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1">
            ⏱ History
          </button>

          {publishUrl ? (
            <div className="flex items-center gap-1.5">
              <button onClick={() => handlePublish(publishSlug ?? undefined)} disabled={!hasFiles || publishing}
                className="text-xs rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300 px-3 py-1.5 hover:bg-fuchsia-500/20 transition-colors disabled:opacity-40 flex items-center gap-1.5">
                {publishing ? <><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse" />Updating...</> : liveUpdated ? "Updated ✓" : "Update"}
              </button>
              <a href={publishUrl} target="_blank" rel="noreferrer"
                className="text-xs rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 px-3 py-1.5 hover:bg-green-500/20 transition-colors">Live ↗</a>
              <button onClick={() => navigator.clipboard.writeText(publishUrl ?? "")}
                className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-300 px-2 py-1.5 hover:bg-white/10 hidden sm:block">Copy</button>
              <button onClick={handleUnpublish} className="text-xs text-gray-500 hover:text-red-400 px-1 py-1.5 transition-colors">×</button>
            </div>
          ) : (
            <button onClick={() => setShowPublishDialog(true)} disabled={!hasFiles || publishing}
              className="text-xs rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300 px-3 py-1.5 hover:bg-fuchsia-500/20 transition-colors disabled:opacity-40 flex items-center gap-1.5">
              {publishing ? <><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse" />Publishing...</> : "Publish"}
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
      <div className="sm:hidden" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        <div style={{ flex: 1, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column" }}>{mobileTab === "chat" ? chatPanel : previewPanel}</div>
        <div className="shrink-0 border-t border-white/10 bg-[#0c0c12] flex">
          {(["chat", "preview"] as const).map((tab) => (
            <button key={tab} onClick={() => setMobileTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-0.5 ${mobileTab === tab ? "text-fuchsia-400 border-t-2 border-fuchsia-400 -mt-px" : "text-gray-500"}`}>
              {tab === "chat" ? (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>Chat</>
              ) : (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>Preview</>
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
          onPublish={(slug, customDomain, password) => handlePublish(slug, customDomain, password)}
          onClose={() => setShowPublishDialog(false)}
        />
      )}

      {showIntegrations && (
        <IntegrationsPanel
          envVars={envVars}
          onSaveEnv={async (vars) => { await saveEnvVars(vars); }}
          onAutoPrompt={(prompt, env) => { setShowIntegrations(false); runGenerate(prompt, env); }}
          onClose={() => setShowIntegrations(false)}
        />
      )}

      {/* DNS instructions after custom domain publish */}
      {dnsInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDnsInfo(null)}>
          <div className="rounded-2xl border border-white/10 bg-[#141418] p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-2xl mb-3">🎉</div>
            <h2 className="text-base font-semibold text-white mb-1">One last step</h2>
            <p className="text-xs text-gray-400 mb-4">
              Your app is published! To make it live at <strong className="text-white">{dnsInfo.domain}</strong>, log into wherever you bought that domain and add this DNS record:
            </p>

            <div className="rounded-xl bg-black/30 border border-white/10 p-4 space-y-2.5 font-mono text-xs mb-4">
              {dnsInfo.cname === "76.76.21.21" ? (
                <>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="text-white">A</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-fuchsia-300">@</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Value</span><span className="text-fuchsia-300">76.76.21.21</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="text-white">CNAME</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-fuchsia-300">{dnsInfo.domain.split(".").slice(0, -2).join(".") || "@"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Value</span><span className="text-fuchsia-300">{dnsInfo.cname}</span></div>
                </>
              )}
            </div>

            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-[11px] text-gray-500 space-y-1 mb-4">
              <p><strong className="text-gray-400">Where do I go?</strong> Login to GoDaddy, Namecheap, Cloudflare, or wherever you registered <strong className="text-gray-300">{dnsInfo.domain.split(".").slice(-2).join(".")}</strong> → find "DNS" or "DNS Records" → add the record above.</p>
              <p>Usually live within 5–10 minutes.</p>
            </div>

            <button onClick={() => setDnsInfo(null)} className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white py-2.5 text-sm font-medium hover:opacity-90 transition-opacity">
              Got it, I'll set it up →
            </button>
          </div>
        </div>
      )}

      {/* Version history slide-over */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowHistory(false)}>
          <div className="ml-auto h-full w-full max-w-xs bg-[#141418] border-l border-white/10 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <h3 className="text-sm font-semibold text-white">Version History</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingVersions ? (
                <div className="text-xs text-gray-500 text-center py-8">Loading versions…</div>
              ) : versionList.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-8">No saved versions yet.</div>
              ) : (
                versionList.map((v, i) => (
                  <div key={v.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full">Latest</span>}
                      <span className="text-[10px] text-gray-500 ml-auto">{new Date(v.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-[11px] text-gray-400">{v.modelUsed ?? "Unknown model"}</p>
                    {i > 0 && (
                      <button onClick={() => handleRestoreVersion(v.id)}
                        className="text-[11px] rounded-lg border border-white/10 bg-white/5 text-gray-300 px-2.5 py-1 hover:bg-white/10 transition-colors w-full">
                        Restore this version
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Publish dialog ─────────────────────────────────────────────────────────────
function PublishDialog({ projectId, projectName, publishing, publishError, onPublish, onClose }: {
  projectId: string; projectName: string; publishing: boolean;
  publishError: string | null; onPublish: (slug: string, customDomain?: string, password?: string) => void; onClose: () => void;
}) {
  function defaultSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  }
  const [slug, setSlug] = useState(defaultSlug(projectName));
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<"available" | "taken" | null>(null);
  const [customDomain, setCustomDomain] = useState("");
  const [password, setPassword] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
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
        <p className="text-xs text-gray-500 mb-5">Choose your subdomain on thatcode.xyz</p>

        <div className="flex items-center rounded-xl border border-white/10 bg-white/5 focus-within:border-fuchsia-400/40 transition-colors overflow-hidden">
          <span className="pl-3 pr-1 text-gray-500 text-sm shrink-0 select-none">thatcode.xyz/</span>
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

        {availability === "taken" && <p className="mt-1.5 text-xs text-red-400">That name is already taken. Try something else.</p>}
        {availability === "available" && <p className="mt-1.5 text-xs text-green-400">Available! Your app will be at <strong>{slug}.thatcode.xyz</strong></p>}
        {publishError && <p className="mt-1.5 text-xs text-red-400">{publishError}</p>}

        <button onClick={() => setShowAdvanced(v => !v)} className="mt-4 text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
          <span>{showAdvanced ? "▾" : "▸"}</span> Advanced options
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Custom domain <span className="text-gray-600">(optional)</span></label>
              <input
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value.trim().toLowerCase().replace(/^https?:\/\//, ""))}
                placeholder="myapp.com or app.mysite.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-400/40 transition-colors font-mono"
              />
              {customDomain && (
                <div className="mt-2 rounded-xl bg-white/[0.03] border border-white/10 p-3 space-y-2 text-[11px]">
                  <p className="text-gray-300 font-medium">After publishing, you'll need to do one quick step:</p>
                  <p className="text-gray-500">Log into wherever you bought <strong className="text-gray-300">{customDomain.split(".").slice(-2).join(".")}</strong> (GoDaddy, Namecheap, Cloudflare, etc.) and add this DNS record:</p>
                  <div className="rounded-lg bg-black/30 border border-white/10 p-2.5 space-y-1.5 font-mono">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Type</span>
                      <span className="text-white">CNAME</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Name</span>
                      <span className="text-fuchsia-300">{customDomain.split(".").slice(0, -2).join(".") || "@"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Value</span>
                      <span className="text-fuchsia-300">domains.thatcode.xyz</span>
                    </div>
                  </div>
                  <p className="text-gray-600">Usually takes 5–10 minutes to go live.</p>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Password protect (optional)</label>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank for public access"
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-400/40 transition-colors"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={() => onPublish(slug, customDomain || undefined, password || undefined)} disabled={!canPublish}
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
