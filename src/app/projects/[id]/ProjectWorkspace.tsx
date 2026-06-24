"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { buildStandaloneHtml } from "@/lib/buildHtml";
import Logo from "@/components/Logo";
import IntegrationsPanel from "./IntegrationsPanel";
import type { SandpackErr } from "@/components/SandpackPreview";

const SandpackPreview = dynamic(() => import("@/components/SandpackPreview"), {
  ssr: false,
  loading: () => <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#71717f", fontSize: 13 }}>Loading preview…</div>,
});

type Message = { id: string; role: "user" | "assistant"; content: string };
type ProjectFiles = Record<string, string>;
type EnvVars = Record<string, string>;
type PreviewMode = "desktop" | "tablet" | "mobile";

const API_DETECTORS = [
  { keywords: ["stripe", "payment", "checkout", "subscription", "billing", "accept card", "credit card"], name: "Stripe", key: "STRIPE_PUBLISHABLE_KEY", hint: "stripe.com → Developers → API Keys", placeholder: "pk_live_...", description: "needed to process real payments and card charges" },
  { keywords: ["supabase", "postgres", "realtime database", "supabase auth"], name: "Supabase", key: "SUPABASE_URL", hint: "app.supabase.com → Project Settings → API", placeholder: "https://xyz.supabase.co", description: "needed to connect to your Postgres database and auth" },
  { keywords: ["openai", "gpt", "chatgpt", "dall-e", "ai chat", "ai completion"], name: "OpenAI", key: "OPENAI_API_KEY", hint: "platform.openai.com → API Keys", placeholder: "sk-...", description: "needed to call GPT-4 and other OpenAI models" },
  { keywords: ["google maps", "maps api", "directions", "geocod", "show map", "embed map"], name: "Google Maps", key: "GOOGLE_MAPS_API_KEY", hint: "console.cloud.google.com → Maps JavaScript API", placeholder: "AIza...", description: "needed to show interactive maps and get directions" },
  { keywords: ["mapbox", "mapbox map"], name: "Mapbox", key: "MAPBOX_TOKEN", hint: "account.mapbox.com → Access Tokens", placeholder: "pk.ey...", description: "needed to render Mapbox maps in your app" },
  { keywords: ["twilio", "sms", "text message", "send sms"], name: "Twilio", key: "TWILIO_ACCOUNT_SID", hint: "console.twilio.com → Account Info", placeholder: "AC...", description: "needed to send SMS and WhatsApp messages" },
  { keywords: ["firebase", "firestore"], name: "Firebase", key: "FIREBASE_API_KEY", hint: "Firebase Console → Project Settings → Your apps", placeholder: "AIza...", description: "needed to connect to Firebase / Firestore" },
  { keywords: ["airtable", "airtable base", "airtable database"], name: "Airtable", key: "AIRTABLE_API_KEY", hint: "airtable.com → Account → API", placeholder: "pat...", description: "needed to read and write your Airtable base" },
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

// Inject visual edit as a React component that mounts click handlers
function injectVisualEditHelper(files: ProjectFiles): ProjectFiles {
  const helper = `import { useEffect } from 'react';
export default function VisualEdit() {
  useEffect(() => {
    var lastH = null;
    function handler(e) {
      e.preventDefault(); e.stopPropagation();
      var t = e.target;
      for (var i = 0; i < 4 && t; i++) {
        var txt = t.innerText?.trim();
        if (txt && txt.length > 0 && txt.length < 200) {
          if (lastH) { lastH.style.outline = ''; }
          try { window.top.postMessage({ type: 'TC_TEXT_CLICK', text: txt }, '*'); } catch(e) {}
          try { window.parent.postMessage({ type: 'TC_TEXT_CLICK', text: txt }, '*'); } catch(e) {}
          t.style.outline = '2px solid #6a1ff7';
          lastH = t;
          return;
        }
        t = t.parentElement;
      }
    }
    function hover(e) { e.target.style.outline = '1px dashed rgba(106,31,247,0.3)'; }
    function unhover(e) { if (e.target !== lastH) e.target.style.outline = ''; }
    document.addEventListener('click', handler, true);
    document.addEventListener('mouseover', hover, true);
    document.addEventListener('mouseout', unhover, true);
    document.body.style.cursor = 'crosshair';
    return () => {
      document.removeEventListener('click', handler, true);
      document.removeEventListener('mouseover', hover, true);
      document.removeEventListener('mouseout', unhover, true);
      document.body.style.cursor = '';
    };
  }, []);
  return null;
}`;

  const appCode = files["/App.js"] ?? "";
  // Add import + render the VisualEdit component
  const modified = `import VisualEdit from './VisualEdit';\n` + appCode.replace(
    /return\s*\(/,
    `return (<><VisualEdit />`
  ).replace(
    /\);\s*}\s*$/,
    `)</> ); }`
  );

  return { ...files, "/VisualEdit.js": helper, "/App.js": modified };
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("# ")) elements.push(<h1 key={i} style={{ fontSize: 22, fontWeight: 700, color: "#17171c", marginBottom: 8, marginTop: 16 }}>{line.slice(2)}</h1>);
    else if (line.startsWith("## ")) elements.push(<h2 key={i} style={{ fontSize: 17, fontWeight: 600, color: "#2a2a3a", marginBottom: 6, marginTop: 14 }}>{line.slice(3)}</h2>);
    else if (line.startsWith("### ")) elements.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 600, color: "#3a3a4a", marginBottom: 4, marginTop: 12 }}>{line.slice(4)}</h3>);
    else if (line.startsWith("- ") || line.startsWith("* ")) elements.push(<li key={i} style={{ fontSize: 13, color: "#71717f", marginLeft: 16, marginBottom: 2 }}>{line.slice(2)}</li>);
    else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      elements.push(<pre key={i} style={{ background: "#f5f5f8", border: "1px solid #ececf1", borderRadius: 6, padding: "10px 14px", fontSize: 12, color: "#16a34a", overflowX: "auto", marginTop: 8, marginBottom: 8 }}>{codeLines.join("\n")}</pre>);
    } else if (line.trim() === "") elements.push(<div key={i} style={{ height: 8 }} />);
    else elements.push(<p key={i} style={{ fontSize: 13, color: "#71717f", lineHeight: 1.6, marginBottom: 4 }}>{line}</p>);
    i++;
  }
  return <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>{elements}</div>;
}

function CodeViewer({ files, devMode, onSaveFiles, onLineRef }: {
  files: ProjectFiles; devMode?: boolean;
  onSaveFiles?: (files: ProjectFiles) => void;
  onLineRef?: (ref: string) => void;
}) {
  const [activeFile, setActiveFile] = useState(() => Object.keys(files)[0] ?? "");
  const [copied, setCopied] = useState(false);
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [mdPreview, setMdPreview] = useState(false);
  const fileKeys = Object.keys(files);
  const isMd = activeFile.endsWith(".md");

  useEffect(() => {
    if (!files[activeFile] && fileKeys.length > 0) setActiveFile(fileKeys[0]);
    setEditedContent(null);
  }, [files, activeFile, fileKeys]);

  function copyFile() {
    navigator.clipboard.writeText(editedContent ?? files[activeFile] ?? "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function saveEdits() {
    if (editedContent === null || !onSaveFiles) return;
    onSaveFiles({ ...files, [activeFile]: editedContent });
    setEditedContent(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const currentContent = editedContent ?? (files[activeFile] ?? "");
  const isDirty = editedContent !== null && editedContent !== files[activeFile];
  const lines = currentContent.split("\n");

  return (
    <div className="h-full flex overflow-hidden">
      <div className="w-48 shrink-0 border-r border-[#ececf1] bg-white overflow-y-auto p-2 space-y-0.5">
        {fileKeys.map((f) => (
          <button key={f} onClick={() => { setActiveFile(f); setEditedContent(null); setMdPreview(false); }}
            className={`w-full text-left text-xs px-2 py-1.5 rounded truncate transition-colors ${activeFile === f ? "bg-[#eef2ff] text-[#6a1ff7]" : "text-[#9090a0] hover:text-[#17171c] hover:bg-[#f0f0f5]"}`}>
            {f.split("/").pop()}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#ececf1] bg-white shrink-0">
          <span className="text-[10px] text-[#9090a0] font-mono truncate">{activeFile}</span>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {isMd && (
              <button onClick={() => setMdPreview(v => !v)} className={`text-[11px] px-2 py-0.5 rounded transition-colors ${mdPreview ? "bg-purple-500/20 text-purple-300" : "text-[#9090a0] hover:text-white hover:bg-white/10"}`}>
                {mdPreview ? "Source" : "Preview"}
              </button>
            )}
            {devMode && isDirty && (
              <button onClick={saveEdits} className="text-[11px] bg-fuchsia-500/20 border border-[#6a1ff7]/30 text-[#6a1ff7] px-2 py-0.5 rounded hover:bg-fuchsia-500/30 transition-colors">
                Save
              </button>
            )}
            {saved && <span className="text-[11px] text-green-600">✓ Saved</span>}
            <button onClick={copyFile} className="text-[11px] text-[#9090a0] hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/10">
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>
        {isMd && mdPreview ? (
          <SimpleMarkdown content={currentContent} />
        ) : devMode ? (
          <textarea
            value={currentContent}
            onChange={e => setEditedContent(e.target.value)}
            spellCheck={false}
            className="flex-1 overflow-auto p-4 text-xs text-[#3a3a4a] font-mono leading-relaxed bg-[#fbfbfc] resize-none focus:outline-none w-full"
          />
        ) : (
          <div className="flex-1 overflow-auto bg-[#fbfbfc]">
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 400 }}>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="group hover:bg-[#fbfbfc]">
                    <td
                      onClick={() => onLineRef?.(`${activeFile}:${idx + 1}`)}
                      className="select-none text-right pr-3 pl-3 text-[10px] text-gray-700 group-hover:text-[#5a10e7] cursor-pointer w-10 shrink-0 align-top pt-0.5"
                      style={{ userSelect: "none", verticalAlign: "top" }}
                    >
                      {idx + 1}
                    </td>
                    <td className="pl-1 pr-4 text-xs text-[#3a3a4a] font-mono leading-relaxed whitespace-pre-wrap break-all align-top">
                      {line || " "}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectWorkspace({
  projectId, projectName, initialMessages, initialFiles, initialPublishSlug, initialPrompt, initialCredits,
  userPlan, initialIsPrivate,
}: {
  projectId: string; projectName: string; initialMessages: Message[];
  initialFiles: ProjectFiles; initialPublishSlug?: string | null; initialPrompt?: string;
  initialCredits?: number | null; userPlan?: string; initialIsPrivate?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [files, setFiles] = useState<ProjectFiles>(initialFiles);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Thinking...");
  const streamAccum = useRef("");
  const streamUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preStreamFiles = useRef<ProjectFiles | null>(null);

  // Try to extract partial file content from streaming JSON and update preview live
  function tryUpdatePreviewFromStream(raw: string) {
    // Extract content between "content":" and the next unescaped quote
    const filePattern = /"path"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"/g;
    const partialFiles: ProjectFiles = {};
    let match;
    while ((match = filePattern.exec(raw)) !== null) {
      const path = match[1];
      const startIdx = match.index + match[0].length;
      // Find content: take everything from here, unescape JSON strings
      let content = "";
      let i = startIdx;
      while (i < raw.length) {
        if (raw[i] === "\\" && i + 1 < raw.length) {
          const next = raw[i + 1];
          if (next === "n") content += "\n";
          else if (next === "t") content += "\t";
          else if (next === '"') content += '"';
          else if (next === "\\") content += "\\";
          else content += next;
          i += 2;
        } else if (raw[i] === '"') {
          break; // End of content string
        } else {
          content += raw[i];
          i++;
        }
      }
      if (content.length > 50) partialFiles[path] = content;
    }

    if (Object.keys(partialFiles).length > 0 && partialFiles["/App.js"]) {
      // Add a closing to make partial JSX somewhat valid
      let appCode = partialFiles["/App.js"];
      if (!appCode.includes("export default")) {
        appCode += "\n}\nexport default function App() { return <div>Building...</div>; }";
      }
      partialFiles["/App.js"] = appCode;
      // Merge with any existing styles
      if (!partialFiles["/styles.css"]) {
        partialFiles["/styles.css"] = preStreamFiles.current?.["/styles.css"] ?? "body { font-family: system-ui; }";
      }
      setFiles(partialFiles);
    }
  }
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const handleSandpackError = useCallback((err: SandpackErr | null) => {
    const msg = err?.message ?? null;
    if (msg && !loading) {
      // Silent auto-fix — no UI shown, just fix it immediately
      if (autoFixTimerRef.current) clearTimeout(autoFixTimerRef.current);
      autoFixTimerRef.current = setTimeout(() => {
        const code = Object.entries(files).map(([p, c]) => `--- ${p} ---\n${c}`).join("\n\n");
        runGenerate(
          `FIX THIS ERROR. Fix ONLY the specific bug causing the error. Do NOT remove, simplify, or rewrite any features, components, or functionality. Keep ALL existing code — cart, search, admin, buttons, everything. Only change the minimum lines needed to fix the error.\n\nError: ${msg}\n\nCode:\n${code}`,
          undefined,
          "claude-sonnet-4-6",
          true
        );
      }, 1500);
    } else if (!msg) {
      if (autoFixTimerRef.current) clearTimeout(autoFixTimerRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, files]);
  const [autoFixCountdown, setAutoFixCountdown] = useState<number | null>(null);
  const autoFixTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFixCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "console">("preview");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [publishSlug, setPublishSlug] = useState<string | null>(initialPublishSlug ?? null);
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate ?? false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const isPaidPlan = ["pro", "team", "owner"].includes(userPlan ?? "");
  const [publishing, setPublishing] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [liveUpdated, setLiveUpdated] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "info" } | null>(null);
  const showToast = (msg: string, type: "success" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };
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
  const [versionList, setVersionList] = useState<Array<{ id: string; createdAt: string; modelUsed: string | null; bookmarked?: boolean; bookmarkNote?: string | null }>>([]);
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [queuedPrompt, setQueuedPrompt] = useState<string | null>(null);
  const [publishedFilesHash, setPublishedFilesHash] = useState<string | null>(null);
  const [refUrl, setRefUrl] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [lineRef, setLineRef] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<string | null>(null);

  // User testing
  type UserTestResult = { overallScore: number; testers: Array<{ persona: string; goal: string; steps: string[]; issues: string[]; verdict: string }>; criticalIssues: string[]; quickWins: string[] };
  const [showUserTest, setShowUserTest] = useState(false);
  const [userTestLoading, setUserTestLoading] = useState(false);
  const [userTestResult, setUserTestResult] = useState<UserTestResult | null>(null);

  // Monetize
  const [showMonetize, setShowMonetize] = useState(false);
  const [monetizeDesc, setMonetizeDesc] = useState("");
  const [monetizeLoading, setMonetizeLoading] = useState(false);
  const [monetizePlan, setMonetizePlan] = useState<{ summary: string; buildPrompt: string } | null>(null);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chat mode (plan without generating)
  const [chatMode, setChatMode] = useState(false);
  const [chatStreaming, setChatStreaming] = useState(false);
  const [chatStreamContent, setChatStreamContent] = useState("");

  // Knowledge panel
  const [showKnowledge, setShowKnowledge] = useState(false);
  type KnowledgeItem = { id: string; title: string; content: string };
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [knowledgeDraft, setKnowledgeDraft] = useState<KnowledgeItem | null>(null);

  // Visual edit mode
  const [visualEditMode, setVisualEditMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Figma import
  const [showFigma, setShowFigma] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaToken, setFigmaToken] = useState("");
  const [figmaLoading, setFigmaLoading] = useState(false);
  const [figmaError, setFigmaError] = useState<string | null>(null);

  // Supabase built-in backend
  const [showSupabase, setShowSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ enabled: boolean; url?: string; anonKey?: string } | null>(null);
  const [supabaseProvisioning, setSupabaseProvisioning] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Image generation
  const [showImageGen, setShowImageGen] = useState(false);
  const [imageGenPrompt, setImageGenPrompt] = useState("");
  const [imageGenLoading, setImageGenLoading] = useState(false);
  const [imageGenResult, setImageGenResult] = useState<string | null>(null);
  const [imageGenError, setImageGenError] = useState<string | null>(null);

  // GitHub sync
  const [showGithub, setShowGithub] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showFeaturesMenu, setShowFeaturesMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubPrivate, setGithubPrivate] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubResult, setGithubResult] = useState<{ repoUrl?: string; error?: string } | null>(null);

  type DesignDirection = { name: string; description: string; bg: string; accent: string; text: string; style: string };
  type ArchitectPlan = { title: string; overview: string; components: string[]; dataModels: string[]; features: string[]; considerations: string[] };
  type ProactiveSuggestion = { title: string; description: string; prompt: string };
  type FlowState =
    | { type: "idle" }
    | { type: "clarify"; pendingPrompt: string; answers: Record<string, string> }
    | { type: "apikeys"; pendingPrompt: string; needed: typeof API_DETECTORS; keyValues: Record<string, string> }
    | { type: "designpick"; pendingPrompt: string; directions: DesignDirection[] }
    | { type: "architect"; pendingPrompt: string; plan: ArchitectPlan }
    | { type: "colorpick"; pendingPrompt: string };
  const [flow, setFlow] = useState<FlowState>({ type: "idle" });
  const [architectMode, setArchitectMode] = useState(false);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [proactiveAppType, setProactiveAppType] = useState<string | null>(null);
  const [proactiveLoading, setProactiveLoading] = useState(false);

  // Voice input
  const [voiceActive, setVoiceActive] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  // Analytics
  const [showAnalytics, setShowAnalytics] = useState(false);
  type AnalyticsData = { pageviews: number; clicks: number; rageclicks: number; formSubmits: number; daily: Array<{ date: string; pageviews: number; clicks: number; rageclicks: number }>; topRageClicks: Array<{ el: string; count: number }> };
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Compliance
  const [showCompliance, setShowCompliance] = useState(false);
  type ComplianceData = { appType: string; applicableLaws: string[]; issues: string[]; buildPrompt: string };
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  // URL clone
  const [showCloneUrl, setShowCloneUrl] = useState(false);
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloneLoading, setCloneLoading] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  // App merge
  const [showMerge, setShowMerge] = useState(false);
  const [mergeProjectId, setMergeProjectId] = useState("");
  const [mergeGoal, setMergeGoal] = useState("");
  const [mergeLoading, setMergeLoading] = useState(false);

  // Smart routing chip — appears immediately on generation start
  type RouteInfo = { intent: string; taskType: string; creditsNeeded?: number; creditsRemaining?: number };
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(initialCredits ?? null);

  // Self-verify (auto user test + fix after generation)
  const [selfVerify, setSelfVerify] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Load test
  const [showLoadTest, setShowLoadTest] = useState(false);
  type LoadTestData = { appType: string; simulatedUsers: number; bottlenecks: Array<{ severity: string; location: string; issue: string; fix: string }>; estimatedCrashPoint: string; buildPrompt: string };
  const [loadTestData, setLoadTestData] = useState<LoadTestData | null>(null);
  const [loadTestLoading, setLoadTestLoading] = useState(false);

  // Red team
  const [showRedTeam, setShowRedTeam] = useState(false);
  type RedTeamData = { securityScore: number; exploits: Array<{ severity: string; type: string; location: string; description: string; fix: string }>; passed: string[]; buildPrompt: string };
  const [redTeamData, setRedTeamData] = useState<RedTeamData | null>(null);
  const [redTeamLoading, setRedTeamLoading] = useState(false);

  // Revenue model
  const [showRevenue, setShowRevenue] = useState(false);
  type RevenueData = { appCategory: string; strategies: Array<{ name: string; model: string; suggestedPrice: string; estimatedMRR: string; fit: number }>; recommended: string; launchPrice: string; willingness_to_pay_reasoning: string; buildPrompt: string };
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  // Brand voice
  const [showBrandVoice, setShowBrandVoice] = useState(false);
  const [brandTone, setBrandTone] = useState("");
  const [brandValues, setBrandValues] = useState("");
  const [brandPersonality, setBrandPersonality] = useState("");
  const [brandExamples, setBrandExamples] = useState("");
  const [brandLoading, setBrandLoading] = useState(false);

  // Sunset analysis
  const [showSunset, setShowSunset] = useState(false);
  type SunsetData = { recommendation: string; reason: string; unusedFeatures: string[]; cleanupActions: string[]; archivePrompt: string; daysSinceUpdate: number };
  const [sunsetData, setSunsetData] = useState<SunsetData | null>(null);
  const [sunsetLoading, setSunsetLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoFired = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function hashFiles(f: ProjectFiles) {
    const s = JSON.stringify(f);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return String(h);
  }

  // Set initial published hash if project is already published
  useEffect(() => {
    if (initialPublishSlug && Object.keys(initialFiles).length > 0) {
      setPublishedFilesHash(hashFiles(initialFiles));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-device sync — poll for newer versions every 10s when idle and tab is visible
  const lastKnownVersionAt = useRef<string | null>(null);
  const justSaved = useRef(false);
  useEffect(() => {
    const poll = async () => {
      if (loading || document.hidden) return;
      try {
        const res = await fetch(`/api/projects/${projectId}/latest-version`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.updatedAt || !data.files) return;
        if (lastKnownVersionAt.current === null) {
          // seed on first poll — don't apply, just remember
          lastKnownVersionAt.current = data.updatedAt;
          return;
        }
        if (data.updatedAt !== lastKnownVersionAt.current) {
          lastKnownVersionAt.current = data.updatedAt;
          if (justSaved.current) {
            justSaved.current = false;
            return;
          }
          setFiles(data.files);
          if (data.summary) {
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.content === data.summary) return prev;
              return [...prev, { id: `sync-${data.updatedAt}`, role: "assistant", content: "↻ Synced from another device." }];
            });
          }
        }
      } catch { /* network error — silent */ }
    };
    poll(); // immediate first run to seed lastKnownVersionAt
    const interval = setInterval(poll, 10_000);
    const onVisible = () => { if (!document.hidden) poll(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, loading]);

  // Fire queued prompt once loading finishes
  useEffect(() => {
    if (!loading && queuedPrompt) {
      const p = queuedPrompt;
      setQueuedPrompt(null);
      runGenerate(p);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // When tab becomes visible again, check if generation completed while away
  useEffect(() => {
    function onVisible() {
      if (document.hidden || !loading) return;
      // Check if a new version appeared while we were away
      fetch(`/api/projects/${projectId}/latest-version`).then(r => r.json()).then(data => {
        if (data.files && data.updatedAt !== lastKnownVersionAt.current) {
          lastKnownVersionAt.current = data.updatedAt;
          setFiles(data.files);
          setLoading(false);
          if (data.summary) {
            setMessages(prev => [...prev, { id: `done-${Date.now()}`, role: "assistant", content: data.summary }]);
          }
        }
      }).catch(() => {});
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, projectId]);

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
    fetch(`/api/projects/${projectId}/knowledge`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setKnowledge(d); })
      .catch(() => {});
    loadSupabaseStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleFigmaImport() {
    if (!figmaUrl.trim() || !figmaToken.trim() || figmaLoading) return;
    setFigmaLoading(true);
    setFigmaError(null);
    try {
      const res = await fetch("/api/figma-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ figmaUrl: figmaUrl.trim(), figmaToken: figmaToken.trim() }),
      });
      const data = await res.json();
      if (data.error) { setFigmaError(data.error); return; }
      setShowFigma(false);
      runGenerate(data.prompt);
    } catch {
      setFigmaError("Failed to import from Figma");
    } finally {
      setFigmaLoading(false);
    }
  }

  async function loadSupabaseStatus() {
    const res = await fetch(`/api/projects/${projectId}/supabase`).catch(() => null);
    if (res?.ok) setSupabaseStatus(await res.json());
  }

  async function handleEnableSupabase() {
    setSupabaseProvisioning(true);
    setSupabaseError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/supabase`, { method: "POST" });
      const data = await res.json();
      if (data.error) { setSupabaseError(data.error); return; }
      setSupabaseStatus({ enabled: true, url: data.url, anonKey: data.anonKey });
      // Inject Supabase credentials into the project env vars
      await fetch(`/api/projects/${projectId}/envvars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ SUPABASE_URL: data.url, SUPABASE_ANON_KEY: data.anonKey }),
      });
      setEnvVars(prev => ({ ...prev, SUPABASE_URL: data.url, SUPABASE_ANON_KEY: data.anonKey }));
    } catch (e) {
      setSupabaseError(e instanceof Error ? e.message : "Failed to enable database");
    } finally {
      setSupabaseProvisioning(false);
    }
  }

  async function handleGenerateImage() {
    if (!imageGenPrompt.trim() || imageGenLoading) return;
    setImageGenLoading(true);
    setImageGenResult(null);
    setImageGenError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imageGenPrompt }),
      });
      const data = await res.json();
      if (data.url) setImageGenResult(data.url);
      else setImageGenError(data.error ?? "Generation failed");
    } catch {
      setImageGenError("Something went wrong");
    } finally {
      setImageGenLoading(false);
    }
  }

  async function handleGithubExport() {
    if (!githubToken.trim() || !githubRepo.trim()) return;
    setGithubLoading(true);
    setGithubResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/github-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: githubToken.trim(), repoName: githubRepo.trim(), isPrivate: githubPrivate }),
      });
      const data = await res.json();
      setGithubResult(data);
    } catch {
      setGithubResult({ error: "Failed to export" });
    } finally {
      setGithubLoading(false);
    }
  }

  async function saveKnowledge(items: KnowledgeItem[]) {
    setKnowledge(items);
    await fetch(`/api/projects/${projectId}/knowledge`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
  }

  async function handleChatSend() {
    if (!prompt.trim() || chatStreaming) return;
    const text = prompt.trim();
    setPrompt("");
    const userMsg: Message = { id: `chat-${Date.now()}`, role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setChatStreaming(true);
    setChatStreamContent("");
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages.slice(-10) }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setChatStreamContent(full);
      }
      setMessages(prev => [...prev, { id: `chat-ai-${Date.now()}`, role: "assistant", content: full }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: `chat-err-${Date.now()}`, role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setChatStreaming(false);
      setChatStreamContent("");
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
    return () => clearTimeout(t);
  }, [messages, loading, flow, suggestions, chatStreaming, chatStreamContent]);

  useEffect(() => { if (!loading) setLoadingStatus("Thinking..."); }, [loading]);

  // Warn before navigating away during generation
  useEffect(() => {
    if (!loading) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loading]);

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
            `There is a JS runtime error. Fix ONLY the broken code — do not change any functionality, layout, or features. Error: ${err}`,
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
      // Visual edit click
      if (e.data?.type === "TC_VISUAL_CLICK") {
        const { desc } = e.data as { desc: string };
        setVisualEditMode(false);
        // Send postMessage to disable in iframe
        const iframes = document.querySelectorAll("iframe");
        iframes.forEach(f => { try { f.contentWindow?.postMessage({ type: "TC_VISUAL_EDIT", enabled: false }, "*"); } catch { /**/ } });
        setPrompt(`Edit the ${desc} — `);
        setMobileTab("chat");
        // Focus textarea
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [files]); // eslint-disable-line react-hooks/exhaustive-deps

  const [editingText, setEditingText] = useState<{ oldText: string; newText: string } | null>(null);

  function toggleVisualEdit() {
    setVisualEditMode(v => !v);
    setEditingText(null);
  }

  // Listen for text clicks from the Sandpack preview
  useEffect(() => {
    if (!visualEditMode) return;
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "TC_TEXT_CLICK" && e.data.text) {
        setEditingText({ oldText: e.data.text, newText: e.data.text });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [visualEditMode]);

  function applyTextEdit() {
    if (!editingText || editingText.oldText === editingText.newText) { setEditingText(null); return; }
    const oldText = editingText.oldText;
    const newText = editingText.newText;
    const escaped = oldText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Search all files for the text
    const newFiles = { ...files };
    let found = false;
    for (const [path, content] of Object.entries(newFiles)) {
      // Try exact match first
      if (content.includes(oldText)) {
        newFiles[path] = content.replace(new RegExp(escaped, "g"), newText);
        found = true;
      }
      // Try matching inside JSX strings: "text" or 'text' or {`text`}
      if (!found) {
        const quotedPatterns = [`"${escaped}"`, `'${escaped}'`, `\`${escaped}\``];
        for (const qp of quotedPatterns) {
          if (content.includes(oldText)) {
            newFiles[path] = content.split(oldText).join(newText);
            found = true;
            break;
          }
        }
      }
    }

    if (found) {
      setFiles(newFiles);
      justSaved.current = true;
      fetch(`/api/projects/${projectId}/save-version`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: newFiles, summary: `Changed "${oldText.slice(0, 30)}" to "${newText.slice(0, 30)}"` }),
      }).catch(() => {});
    }
    setEditingText(null);
  }

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

  function toggleVoice() {
    if (voiceActive) {
      recognitionRef.current?.stop();
      setVoiceActive(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Your browser doesn't support voice input. Try Chrome."); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let final = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim = e.results[i][0].transcript;
      }
      setPrompt(final + interim);
    };
    rec.onend = () => setVoiceActive(false);
    rec.start();
    recognitionRef.current = rec;
    setVoiceActive(true);
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/analytics`);
      if (res.ok) setAnalyticsData(await res.json());
    } catch { /**/ }
    setAnalyticsLoading(false);
  }

  async function runCompliance() {
    setComplianceLoading(true);
    setComplianceData(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/compliance`, { method: "POST" });
      if (res.ok) setComplianceData(await res.json());
    } catch { /**/ }
    setComplianceLoading(false);
  }

  async function handleCloneUrl() {
    if (!cloneUrl.trim() || cloneLoading) return;
    setCloneLoading(true);
    setCloneError(null);
    try {
      const res = await fetch("/api/clone-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cloneUrl.trim() }),
      });
      const data = await res.json();
      if (data.error) { setCloneError(data.error); return; }
      setShowCloneUrl(false);
      setCloneUrl("");
      runGenerate(data.buildPrompt);
    } catch {
      setCloneError("Failed to analyze URL");
    } finally {
      setCloneLoading(false);
    }
  }

  async function handleMerge() {
    if (!mergeProjectId.trim() || mergeLoading) return;
    setMergeLoading(true);
    try {
      const res = await fetch("/api/projects/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectAId: projectId, projectBId: mergeProjectId.trim(), mergeGoal }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setShowMerge(false);
      setMergeProjectId("");
      setMergeGoal("");
      runGenerate(data.buildPrompt);
    } catch {
      alert("Merge failed");
    } finally {
      setMergeLoading(false);
    }
  }

  async function runLoadTest() {
    setLoadTestLoading(true);
    setLoadTestData(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/load-test`, { method: "POST" });
      if (res.ok) setLoadTestData(await res.json());
    } catch { /**/ }
    setLoadTestLoading(false);
  }

  async function runRedTeam() {
    setRedTeamLoading(true);
    setRedTeamData(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/red-team`, { method: "POST" });
      if (res.ok) setRedTeamData(await res.json());
    } catch { /**/ }
    setRedTeamLoading(false);
  }

  async function runRevenueModel() {
    setRevenueLoading(true);
    setRevenueData(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/revenue-model`, { method: "POST" });
      if (res.ok) setRevenueData(await res.json());
    } catch { /**/ }
    setRevenueLoading(false);
  }

  async function saveBrandVoice() {
    if (!brandTone.trim()) return;
    setBrandLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/brand-voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: brandTone, values: brandValues, personality: brandPersonality, examples: brandExamples }),
      });
      const data = await res.json();
      if (data.rewritePrompt) {
        setShowBrandVoice(false);
        runGenerate(data.rewritePrompt + " Apply the brand voice to ALL user-facing strings in the app.");
      }
    } catch { /**/ }
    setBrandLoading(false);
  }

  async function runSunset() {
    setSunsetLoading(true);
    setSunsetData(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/sunset`, { method: "POST" });
      if (res.ok) setSunsetData(await res.json());
    } catch { /**/ }
    setSunsetLoading(false);
  }

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
      const codeContext = Object.entries(files).map(([p, c]) => `--- ${p} ---\n${c}`).join("\n\n");
      const fixPrompt = liveError
        ? `FIX THIS ERROR. Fix ONLY the specific bug. Do NOT remove, simplify, or rewrite any features. Keep ALL existing code intact — only change the minimum lines needed.\n\nError: ${liveError}\n\nBroken code:\n${codeContext}`
        : `FIX ALL ERRORS. The code below has JavaScript errors. Fix them without changing design, layout, content, or features.\n\nCode:\n${codeContext}`;
      setIframeError(null);
      runGenerate(fixPrompt, undefined, "claude-sonnet-4-6", true);
      return;
    }

    // API key detection — only when editing, and only show once per session
    if (flow.type === "idle") {
      const needed = detectNeededApis(trimmed, envVars);
      if (needed.length > 0 && messages.length > 0) {
        setMessages(prev => {
          const alreadyShown = prev.some(m => m.role === "user" && m.content === trimmed);
          if (alreadyShown) return prev;
          return [...prev, { id: `tmp-${Date.now()}`, role: "user", content: trimmed }];
        });
        setFlow({ type: "apikeys", pendingPrompt: trimmed, needed, keyValues: {} });
        return;
      }
    }

    if (messages.length === 0) {
      // Show the user message immediately so the UI feels responsive
      const earlyMsg: Message = { id: `tmp-${Date.now()}`, role: "user", content: trimmed };
      setMessages([earlyMsg]);
      setLoading(true);
      setLoadingStatus("Analyzing your request…");

      // Architect mode — only extra call (user opted in)
      if (architectMode) {
        setLoading(true);
        setLoadingStatus("Creating implementation plan…");
        try {
          const res = await fetch(`/api/projects/${projectId}/architect`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: trimmed }),
          });
          const plan = await res.json();
          if (plan.title && !plan.error) {
            setLoading(false);
            setFlow({ type: "architect", pendingPrompt: trimmed, plan });
            return;
          }
        } catch { /* fall through */ }
        setLoading(false);
      }
    }

    // ── Fast path: instant text/color replacements without AI ──
    const isEdit = Object.keys(files).length > 0;
    if (isEdit) {
      // "change/rename X to Y", "change the name to Y", "rename company to Y"
      const renameMatch = trimmed.match(
        /^(?:change|rename|update|set)\s+(?:the\s+)?(?:company\s+)?(?:name|title|heading|brand|text)\s+(?:from\s+.+?\s+)?to\s+["']?(.+?)["']?\s*$/i
      );
      // Detect color/theme change requests → show palette picker
      const isColorChange = /\b(change|make|set|switch|update)\b.*\b(color|background|theme|dark|light|blue|red|green|purple|pink|orange|teal|warm|cool|palette|scheme)\b/i.test(trimmed);

      if (renameMatch) {
        const newName = renameMatch[1].trim();
        const appCode = files["src/App.tsx"] || "";
        // Find the most prominent brand/title string — usually the first h1 or brand name in the nav
        const brandRegex = /(<(?:h1|h2|a|span|div)[^>]*>)([^<]{2,40})(<\/(?:h1|h2|a|span|div)>)/;
        const match = appCode.match(brandRegex);
        if (match) {
          const oldName = match[2].trim();
          const updated = { ...files, "src/App.tsx": appCode.replace(new RegExp(oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), newName) };
          setMessages(prev => {
            const alreadyShown = prev.some(m => m.role === "user" && m.content === trimmed);
            if (alreadyShown) return prev;
            return [...prev, { id: `tmp-${Date.now()}`, role: "user", content: trimmed }];
          });
          setFiles(updated);
          setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: "assistant", content: `Renamed "${oldName}" to "${newName}" across the app.` }]);
          justSaved.current = true;
          fetch(`/api/projects/${projectId}/save-version`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ files: updated, summary: `Renamed to ${newName}` }),
          }).catch(() => {});
          return;
        }
      }

      if (isColorChange) {
        setMessages(prev => {
          const alreadyShown = prev.some(m => m.role === "user" && m.content === trimmed);
          if (alreadyShown) return prev;
          return [...prev, { id: `tmp-${Date.now()}`, role: "user", content: trimmed }];
        });
        setFlow({ type: "colorpick", pendingPrompt: trimmed });
        return;
      }
    }

    runGenerate(trimmed);
  }

  async function runGenerate(text: string, extraEnv?: EnvVars, forceModel?: string, silent?: boolean) {
    setFlow({ type: "idle" });
    setSuggestions([]);
    setShowUndo(false);
    setRouteInfo(null);

    // Inject URL reference if set
    let fullText = text;
    if (refUrl.trim()) {
      fullText += `\n\nReference this URL as a design/content reference: ${refUrl.trim()}`;
      setRefUrl("");
    }
    // Inject line reference if set
    if (lineRef) {
      fullText += `\n\n(referring to ${lineRef})`;
      setLineRef(null);
    }
    // Inject CSV data if uploaded
    if (csvData) {
      fullText += `\n\nUSER'S REAL DATA (CSV format, use this exact data in the app — not placeholder/fake data):\n\`\`\`csv\n${csvData}\n\`\`\`\nBuild the app around this real data. Infer the schema from the CSV headers and populate the app with the actual values shown.`;
      setCsvData(null);
    }

    // PWA detection
    const tl = text.toLowerCase();
    if (/\b(pwa|installable|install(able)? app|offline|service.?worker|push notification|add to home)/i.test(tl)) {
      fullText += "\n\nIMPORTANT: Make this app a PWA. Add a manifest.json file with name, icons, theme_color, display:standalone, start_url. Add a service worker (sw.js) that caches app shell. Add <link rel='manifest' href='/manifest.json'> and service worker registration to index.html.";
    }

    if (!silent) {
      setMessages((prev) => {
        const alreadyShown = prev.some(m => m.role === "user" && m.content === text);
        if (alreadyShown) return prev;
        return [...prev, { id: `tmp-${Date.now()}`, role: "user", content: text }];
      });
    }
    setLoading(true);
    streamAccum.current = "";
    preStreamFiles.current = { ...files };
    setError(null);
    setIframeError(null);
    setLastPrompt(text);

    if (Object.keys(files).length > 0) setPreviousFiles({ ...files });

    const mergedEnv = extraEnv ? { ...envVars, ...extraEnv } : envVars;
    const imgPayload = uploadImage ? { imageBase64: uploadImage.base64, imageMimeType: uploadImage.mimeType } : {};
    setUploadImage(null);

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullText, envVars: mergedEnv, forceModel, ...imgPayload }),
        signal: controller.signal,
      });
      if (res.status === 402) {
        const body = await res.json().catch(() => ({}));
        const needed = body.creditsNeeded ?? 1;
        const remaining = body.creditsRemaining ?? 0;
        setUserCredits(remaining);
        setMessages(prev => [...prev, {
          id: `msg-nocredits-${Date.now()}`,
          role: "assistant",
          content: `You're out of credits. This action needs ${needed} credit${needed !== 1 ? "s" : ""} but you have ${remaining}. Upgrade your plan to get more.`,
        }]);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Generation failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const readTimeout = 120000; // 2 min max per chunk
      while (true) {
        const readPromise = reader.read();
        const timeoutPromise = new Promise<{done: true, value: undefined}>((resolve) =>
          setTimeout(() => resolve({ done: true, value: undefined }), readTimeout)
        );
        const { done, value } = await Promise.race([readPromise, timeoutPromise]);
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
            if (eventLine === "route") {
                setRouteInfo(payload as RouteInfo);
              }
            else if (eventLine === "token") {
              streamAccum.current += (payload.t ?? "");
              // Debounce preview updates — every 500ms try to render partial result
              if (!streamUpdateTimer.current) {
                streamUpdateTimer.current = setTimeout(() => {
                  streamUpdateTimer.current = null;
                  tryUpdatePreviewFromStream(streamAccum.current);
                }, 500);
              }
            }
            else if (eventLine === "status") setLoadingStatus(payload.text);
            else if (eventLine === "done") {
              streamAccum.current = "";
              if (streamUpdateTimer.current) { clearTimeout(streamUpdateTimer.current); streamUpdateTimer.current = null; }
              setFiles(payload.files);
              justSaved.current = true;
              // Auto preview switching based on prompt keywords
              const pl = text.toLowerCase();
              if (/mobile app|phone app|ios app|android app|smartphone/.test(pl)) setPreviewMode("mobile");
              else if (/tablet|ipad/.test(pl)) setPreviewMode("tablet");
              else if (/dashboard|admin panel|analytics|desktop/.test(pl)) setPreviewMode("desktop");
              const creditNote = "";
              if (payload.creditsRemaining != null) setUserCredits(payload.creditsRemaining);
              const liveNote = payload.liveUpdated ? "\n\n✓ Live site updated automatically." : "";
              const summary = silent
                ? "✓ Error fixed automatically." + (payload.liveUpdated ? "\n\n✓ Live site updated." : "")
                : (payload.summary ?? "Done! Check the preview.") + creditNote + liveNote;
              setMessages((prev) => {
                const msgs: typeof prev = [...prev, {
                  id: payload.tempMessageId ?? `msg-${Date.now()}`,
                  role: "assistant",
                  content: summary,
                }];
                // Admin password detection removed — was hijacking subsequent prompts
                return msgs;
              });
              if (payload.liveUpdated) setLiveUpdated(true);
              setSuggestions(getSmartSuggestions(payload.files));
              setShowUndo(true);
              // Self-verify: auto user-test and fix if score is too low
              if (selfVerify && !silent) {
                setVerifying(true);
                fetch(`/api/projects/${projectId}/user-test`, { method: "POST" })
                  .then(r => r.json())
                  .then(result => {
                    setVerifying(false);
                    if (result.overallScore < 65 && result.criticalIssues?.length) {
                      const fixMsg = `Fix these UX issues found by automated testing (score: ${result.overallScore}/100):\n${result.criticalIssues.slice(0, 3).map((i: string) => `- ${i}`).join("\n")}\n\nAlso address: ${result.quickWins?.slice(0, 2).join(", ")}`;
                      runGenerate(fixMsg, undefined, undefined, true);
                    }
                  })
                  .catch(() => setVerifying(false));
              }
              // Load proactive suggestions silently — no loading state shown
              setProactiveSuggestions([]);
              fetch(`/api/projects/${projectId}/proactive-plan`, { method: "POST" })
                .then(r => r.json())
                .then(d => { if (d.suggestions?.length) { setProactiveSuggestions(d.suggestions); setProactiveAppType(d.appType ?? null); } })
                .catch(() => {});
              if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
              undoTimerRef.current = setTimeout(() => setShowUndo(false), 60000);
              setMobileTab("preview");
            } else if (eventLine === "error") setError(payload.error ?? "Generation failed");
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setMessages(prev => [...prev, { id: `msg-stop-${Date.now()}`, role: "assistant", content: "Generation stopped." }]);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  function stopGenerating() {
    abortRef.current?.abort();
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

  async function handleLoadVersions(force = false) {
    if (loadingVersions || (versionList.length > 0 && !force)) return;
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`);
      const data = await res.json();
      setVersionList(data);
    } catch { /* ignore */ }
    setLoadingVersions(false);
  }

  async function toggleBookmark(versionId: string, bookmarked: boolean) {
    await fetch(`/api/projects/${projectId}/versions/${versionId}/bookmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookmarked: !bookmarked }),
    });
    setVersionList(prev => prev.map(v => v.id === versionId ? { ...v, bookmarked: !bookmarked } : v));
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
    if (!prompt.trim()) return;
    const text = prompt.trim();
    setPrompt("");

    // Detect publish intent
    if (/^(publish|deploy|go live|make it live|launch)\s*[.!]?$/i.test(text)) {
      setShowPublishDialog(true);
      return;
    }

    // Queue if already loading
    if (loading) {
      setQueuedPrompt(text);
      setMessages(prev => [...prev, { id: `q-${Date.now()}`, role: "user", content: text }]);
      return;
    }
    handlePromptSubmit(text);
  }

  async function handleTogglePrivacy() {
    if (!isPaidPlan) return;
    setPrivacyLoading(true);
    const next = !isPrivate;
    const res = await fetch(`/api/projects/${projectId}/privacy`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPrivate: next }),
    });
    if (res.ok) setIsPrivate(next);
    setPrivacyLoading(false);
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
      setPublishedFilesHash(hashFiles(files));
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

  async function handleCreateShareLink() {
    setShareLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/share`, { method: "POST" });
      const data = await res.json();
      if (data.token) {
        const url = `${window.location.origin}/share/${data.token}`;
        setShareLink(url);
        navigator.clipboard.writeText(url).catch(() => {});
      }
    } catch { /* ignore */ }
    setShareLoading(false);
  }

  async function handleUserTest() {
    setUserTestLoading(true);
    setUserTestResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/user-test`, { method: "POST" });
      const data = await res.json();
      if (!data.error) setUserTestResult(data);
    } catch { /* ignore */ }
    setUserTestLoading(false);
  }

  async function handleMonetize() {
    if (!monetizeDesc.trim() || monetizeLoading) return;
    setMonetizeLoading(true);
    setMonetizePlan(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/monetize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: monetizeDesc }),
      });
      const data = await res.json();
      if (data.buildPrompt) setMonetizePlan(data);
    } catch { /* ignore */ }
    setMonetizeLoading(false);
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const rows = text.split("\n").slice(0, 20).join("\n"); // first 20 rows
      setCsvData(rows);
    };
    reader.readAsText(file);
    e.target.value = "";
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
  function DesignPickCard() {
    if (flow.type !== "designpick") return null;
    const f = flow;
    return (
      <div className="rounded-xl border border-[#ececf1] bg-white p-4 space-y-3">
        <p className="text-xs font-medium text-[#17171c]">Choose a design direction</p>
        <div className="space-y-2">
          {f.directions.map((d, i) => (
            <button key={i} onClick={() => {
              setFlow({ type: "idle" });
              runGenerate(`${f.pendingPrompt}\n\nDesign direction: ${d.name} — ${d.description}. Use this color palette: background ${d.bg}, accent ${d.accent}, text ${d.text}. Style: ${d.style}.`);
            }}
              className="w-full text-left rounded-xl border border-[#ececf1] hover:border-[#6a1ff7]/30 bg-[#fbfbfc] hover:bg-[#f0f0ff] p-3 transition-all group">
              <div className="flex items-start gap-3">
                <div className="flex gap-1 shrink-0 mt-0.5">
                  {[d.bg, d.accent, d.text].map((c, j) => (
                    <div key={j} className="h-4 w-4 rounded-full border border-[#ececf1]" style={{ background: c }} />
                  ))}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#17171c] group-hover:text-[#5a10e7]">{d.name}</p>
                  <p className="text-[10px] text-[#9090a0] mt-0.5">{d.style}</p>
                  <p className="text-[10px] text-[#71717f] mt-0.5">{d.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => { setFlow({ type: "idle" }); runGenerate(f.pendingPrompt); }}
          className="text-xs text-[#9090a0] hover:text-[#17171c] transition-colors">
          Skip — let AI choose →
        </button>
      </div>
    );
  }

  const COLOR_PALETTES = [
    { name: "Ocean Blue", bg: "#EFF6FF", card: "#FFFFFF", accent: "#2563EB", text: "#1E293B", muted: "#64748B", swatch: ["#EFF6FF", "#2563EB", "#1E293B"] },
    { name: "Midnight Dark", bg: "#0A0A0A", card: "#141414", accent: "#FAFAFA", text: "#F5F5F5", muted: "#737373", swatch: ["#0A0A0A", "#FAFAFA", "#737373"] },
    { name: "Forest Green", bg: "#F0FDF4", card: "#FFFFFF", accent: "#16A34A", text: "#14532D", muted: "#6B7280", swatch: ["#F0FDF4", "#16A34A", "#14532D"] },
    { name: "Warm Ember", bg: "#FEF7F0", card: "#FFFFFF", accent: "#C2410C", text: "#1C1109", muted: "#78716C", swatch: ["#FEF7F0", "#C2410C", "#1C1109"] },
    { name: "Royal Purple", bg: "#FAF5FF", card: "#FFFFFF", accent: "#7C3AED", text: "#1E1B4B", muted: "#6B7280", swatch: ["#FAF5FF", "#7C3AED", "#1E1B4B"] },
    { name: "Soft Rose", bg: "#FFF1F2", card: "#FFFFFF", accent: "#E11D48", text: "#1C1917", muted: "#9CA3AF", swatch: ["#FFF1F2", "#E11D48", "#1C1917"] },
  ];

  const [customColors, setCustomColors] = useState({ bg: "#F6F6F8", card: "#FFFFFF", accent: "#6A1FF7", text: "#17171C", muted: "#71717F" });

  function ColorPickCard() {
    if (flow.type !== "colorpick") return null;
    const f = flow;
    const applyPalette = (name: string, bg: string, card: string, accent: string, text: string, muted: string) => {
      setFlow({ type: "idle" });
      // Show clean message to user, send detailed instructions to AI
      const userMsg = `Apply ${name} palette`;
      const aiInstruction = `Change the color scheme. Apply this EXACT color palette to EVERY element in the app. Do not skip any element.\nBackground: ${bg}\nCard/surface: ${card}\nAccent/buttons: ${accent}\nText: ${text}\nMuted/secondary text: ${muted}\nBorders: use a slightly darker shade of the background.\nChange ALL background, card, text, button, border, and accent colors. Scan every single style prop.`;
      setMessages(prev => [...prev, { id: `tmp-${Date.now()}`, role: "user", content: userMsg }]);
      runGenerate(aiInstruction, undefined, undefined, true);
    };
    return (
      <div className="rounded-xl border border-[#ececf1] bg-white p-4 space-y-3">
        <p className="text-xs font-medium text-[#17171c]">Choose a color palette</p>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_PALETTES.map((p) => (
            <button key={p.name} onClick={() => applyPalette(p.name, p.bg, p.card, p.accent, p.text, p.muted)}
              className="text-left rounded-lg border border-[#ececf1] hover:border-[#6a1ff7]/30 bg-[#fbfbfc] hover:bg-[#f0f0ff] p-2.5 transition-all">
              <div className="flex gap-1 mb-1.5">
                {p.swatch.map((c, j) => (
                  <div key={j} className="h-5 w-5 rounded-full border border-[#ececf1]" style={{ background: c }} />
                ))}
              </div>
              <p className="text-[11px] font-medium text-[#17171c]">{p.name}</p>
            </button>
          ))}
        </div>
        <div className="border-t border-[#ececf1] pt-3 space-y-2">
          <p className="text-[11px] font-medium text-[#17171c]">Custom palette</p>
          <div className="grid grid-cols-5 gap-1.5">
            {([
              ["bg", "BG"],
              ["card", "Card"],
              ["accent", "Accent"],
              ["text", "Text"],
              ["muted", "Muted"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex flex-col items-center gap-1">
                <div className="relative h-7 w-7 rounded-full border border-[#ececf1] overflow-hidden cursor-pointer" style={{ background: customColors[key] }}>
                  <input type="color" value={customColors[key]}
                    onChange={e => setCustomColors(prev => ({ ...prev, [key]: e.target.value }))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
                <span className="text-[9px] text-[#9090a0]">{label}</span>
              </label>
            ))}
          </div>
          <button onClick={() => applyPalette("Custom", customColors.bg, customColors.card, customColors.accent, customColors.text, customColors.muted)}
            className="w-full rounded-lg bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white text-xs font-medium py-1.5 hover:opacity-90 transition-opacity">
            Apply custom colors
          </button>
        </div>
        <button onClick={() => { setFlow({ type: "idle" }); runGenerate(f.pendingPrompt); }}
          className="text-xs text-[#9090a0] hover:text-[#17171c] transition-colors">
          Skip — let AI decide →
        </button>
      </div>
    );
  }

  function ArchitectCard() {
    if (flow.type !== "architect") return null;
    const { plan, pendingPrompt } = flow;
    return (
      <div className="rounded-xl border border-purple-400/20 bg-purple-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🏗️</span>
          <p className="text-sm font-medium text-[#17171c]">{plan.title}</p>
        </div>
        <p className="text-xs text-[#71717f] leading-relaxed">{plan.overview}</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Components", items: plan.components },
            { label: "Data models", items: plan.dataModels },
            { label: "Features", items: plan.features },
            { label: "Considerations", items: plan.considerations },
          ].filter(s => s.items?.length > 0).map(section => (
            <div key={section.label} className="rounded-lg bg-white border border-[#ececf1] p-2.5 space-y-1">
              <p className="text-[10px] font-semibold text-[#9090a0] uppercase tracking-wide">{section.label}</p>
              {section.items.map((item, i) => (
                <p key={i} className="text-[11px] text-[#3a3a4a]">· {item}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => { setFlow({ type: "idle" }); runGenerate(pendingPrompt); }}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white text-xs font-semibold py-2 hover:opacity-90 transition-opacity">
            Build this plan →
          </button>
          <button onClick={() => setFlow({ type: "idle" })}
            className="text-xs text-[#9090a0] hover:text-[#17171c] px-2 transition-colors">
            Edit prompt
          </button>
        </div>
      </div>
    );
  }

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
      <div className="rounded-xl border border-[#6a1ff7]/20 bg-[#f0f0ff] p-4 max-w-[92%] space-y-3">
        <p className="text-xs font-medium text-[#6a1ff7]">A few quick questions to build exactly what you want:</p>
        <div>
          <p className="text-[10px] text-[#71717f] mb-1.5">What type of app?</p>
          <div className="flex flex-wrap gap-1.5">
            {typeOpts.map(o => (
              <button key={o} onClick={() => setType(o === type ? "" : o)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${type === o ? "border-fuchsia-400 bg-fuchsia-500/20 text-[#6a1ff7]" : "border-[#ececf1] text-[#71717f] hover:border-white/20"}`}>{o}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-[#71717f] mb-1.5">Style?</p>
          <div className="flex flex-wrap gap-1.5">
            {styleOpts.map(o => (
              <button key={o} onClick={() => setStyle(o === style ? "" : o)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${style === o ? "border-fuchsia-400 bg-fuchsia-500/20 text-[#6a1ff7]" : "border-[#ececf1] text-[#71717f] hover:border-white/20"}`}>{o}</button>
            ))}
          </div>
        </div>
        <input value={extra} onChange={e => setExtra(e.target.value)}
          placeholder="Any specific features? (optional)"
          className="w-full rounded-lg border border-[#ececf1] bg-[#f0f0f5] px-3 py-1.5 text-xs text-[#17171c] placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40" />
        <div className="flex gap-2">
          <button onClick={() => submit()} className="rounded-lg bg-fuchsia-500/20 border border-[#6a1ff7]/30 text-[#6a1ff7] px-3 py-1.5 text-xs hover:bg-fuchsia-500/30 transition-colors">Build it →</button>
          <button onClick={() => submit(true)} className="text-xs text-[#9090a0] hover:text-[#17171c] px-2 py-1.5 transition-colors">Skip, just build</button>
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
        <div>
          <p className="text-xs font-medium text-blue-300 mb-0.5">Optional: add API keys before building</p>
          <p className="text-[10px] text-[#9090a0] leading-relaxed">Your prompt uses {flow.needed.map(a => a.name).join(" and ")}. Add your key{flow.needed.length > 1 ? "s" : ""} now so the feature works in the live app — or skip and build first.</p>
        </div>
        {flow.needed.map(api => (
          <div key={api.key}>
            <label className="text-[10px] text-[#71717f] mb-1 block">
              <span className="font-medium text-[#3a3a4a]">{api.name}</span>
              {(api as { description?: string }).description && <span className="text-[#9090a0]"> — {(api as { description?: string }).description}</span>}
            </label>
            <label className="text-[10px] text-[#9090a0] mb-1 block">{api.hint}</label>
            <input
              value={values[api.key] ?? ""}
              onChange={e => setValues(v => ({ ...v, [api.key]: e.target.value }))}
              placeholder={api.placeholder || `Your ${api.name} key`}
              className="w-full rounded-lg border border-[#ececf1] bg-[#f0f0f5] px-3 py-1.5 text-xs text-[#17171c] placeholder:text-[#9090a0] focus:outline-none focus:border-blue-400/40 font-mono"
            />
          </div>
        ))}
        <div className="flex gap-2">
          <button onClick={() => submit()} className="rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1.5 text-xs hover:bg-blue-500/30 transition-colors">Save & Build →</button>
          <button onClick={() => submit(true)} className="text-xs text-[#9090a0] hover:text-[#17171c] px-2 py-1.5 transition-colors">Skip, build without keys</button>
        </div>
      </div>
    );
  }

  // ── Knowledge panel ────────────────────────────────────────────────────────────
  const knowledgePanel = showKnowledge && (
    <div className="absolute inset-0 z-20 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#ececf1] shrink-0">
        <span className="text-sm font-medium text-[#17171c]">📚 Custom Knowledge</span>
        <button onClick={() => setShowKnowledge(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-xs text-[#9090a0]">Add context the AI should always remember — brand colors, tech stack preferences, coding conventions, business rules.</p>
        {knowledge.map(k => (
          <div key={k.id} className="rounded-xl border border-[#ececf1] bg-white p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#17171c]">{k.title}</span>
              <div className="flex gap-2">
                <button onClick={() => setKnowledgeDraft(k)} className="text-xs text-[#9090a0] hover:text-[#5a10e7]">Edit</button>
                <button onClick={() => saveKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-xs text-[#9090a0] hover:text-red-400">Delete</button>
              </div>
            </div>
            <p className="text-xs text-[#71717f] line-clamp-2">{k.content}</p>
          </div>
        ))}
        {knowledgeDraft ? (
          <div className="rounded-xl border border-[#6a1ff7]/30 bg-[#f0f0ff] p-3 space-y-2">
            <input
              value={knowledgeDraft.title}
              onChange={e => setKnowledgeDraft({ ...knowledgeDraft, title: e.target.value })}
              placeholder="Title (e.g. Brand Colors, Tech Stack)"
              className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-1.5 text-xs text-[#17171c] placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40"
            />
            <textarea
              value={knowledgeDraft.content}
              onChange={e => setKnowledgeDraft({ ...knowledgeDraft, content: e.target.value })}
              placeholder="Describe the convention, rule, or context..."
              rows={4}
              className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-1.5 text-xs text-[#17171c] placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => {
                const existing = knowledge.find(x => x.id === knowledgeDraft.id);
                const updated = existing
                  ? knowledge.map(x => x.id === knowledgeDraft.id ? knowledgeDraft : x)
                  : [...knowledge, knowledgeDraft];
                saveKnowledge(updated);
                setKnowledgeDraft(null);
              }} className="text-xs bg-fuchsia-500/20 border border-[#6a1ff7]/30 text-[#6a1ff7] px-3 py-1.5 rounded-lg hover:bg-fuchsia-500/30 transition-colors">Save</button>
              <button onClick={() => setKnowledgeDraft(null)} className="text-xs text-[#9090a0] hover:text-[#17171c] px-2 py-1.5 transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setKnowledgeDraft({ id: `k-${Date.now()}`, title: "", content: "" })}
            className="w-full text-xs rounded-xl border border-dashed border-[#ececf1] text-[#9090a0] hover:border-[#6a1ff7]/30 hover:text-[#5a10e7] py-3 transition-colors">
            + Add knowledge
          </button>
        )}
      </div>
    </div>
  );

  // ── Chat panel ─────────────────────────────────────────────────────────────────
  const chatPanel = (
    <div className="flex flex-col h-full bg-[#f6f6f8] relative">
      {knowledgePanel}
      {/* Mode toggle + features */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5 shrink-0 border-b border-white/[0.05]">
        <div className="flex rounded-lg border border-[#ececf1] bg-white p-0.5 text-[11px]">
          <button onClick={() => setChatMode(false)}
            className={`px-3 py-1 rounded-md transition-colors ${!chatMode ? "bg-[#eef2ff] text-[#6a1ff7] font-medium" : "text-[#9090a0] hover:text-[#17171c]"}`}>
            Build
          </button>
          <button onClick={() => setChatMode(true)}
            className={`px-3 py-1 rounded-md transition-colors ${chatMode ? "bg-[#eef2ff] text-[#6a1ff7] font-medium" : "text-[#9090a0] hover:text-[#17171c]"}`}>
            Chat
          </button>
        </div>
        {/* Active mode badges */}
        {architectMode && (
          <button onClick={() => setArchitectMode(false)} className="text-[10px] border border-purple-400/40 bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
            🏗️ Architect <span className="opacity-60">×</span>
          </button>
        )}
        {selfVerify && (
          <button onClick={() => setSelfVerify(false)} className="text-[10px] border border-green-400/40 bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
            🔬 Verify <span className="opacity-60">×</span>
          </button>
        )}
        <div className="ml-auto relative">
          <button onClick={() => setShowFeaturesMenu(v => !v)}
            className="text-xs rounded-lg border border-[#ececf1] bg-white text-[#71717f] hover:bg-white/[0.07] hover:text-white px-2.5 py-1 transition-colors flex items-center gap-1.5">
            <span className="text-base leading-none font-light">+</span> Features
          </button>
          {showFeaturesMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFeaturesMenu(false)} />
              <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-[#ececf1] bg-white shadow-2xl z-50 py-1.5 overflow-hidden">
                <p className="text-[10px] text-[#9090a0] font-medium px-3 pt-1 pb-1.5 uppercase tracking-wider">AI Tools</p>
                {([
                  { icon: "📋", label: "Plan mode", desc: "Think & plan before coding", action: () => { setArchitectMode(v => !v); setShowFeaturesMenu(false); }, active: architectMode },
                  { icon: "🔬", label: "Self-verify", desc: "Auto-test after build", action: () => { setSelfVerify(v => !v); setShowFeaturesMenu(false); }, active: selfVerify },
                  { icon: "📊", label: "Analytics", desc: "Pageviews & rage-clicks", action: () => { setShowAnalytics(true); loadAnalytics(); setShowFeaturesMenu(false); } },
                  { icon: "⚖️", label: "Compliance", desc: "GDPR, HIPAA, CCPA", action: () => { setShowCompliance(true); runCompliance(); setShowFeaturesMenu(false); } },
                  { icon: "🔍", label: "Clone from URL", desc: "Build inspired by a site", action: () => { setShowCloneUrl(true); setCloneError(null); setShowFeaturesMenu(false); } },
                  { icon: "⚡", label: "Merge project", desc: "Combine two projects", action: () => { setShowMerge(true); setShowFeaturesMenu(false); } },
                  { icon: "🏋️", label: "Load test", desc: "Find bottlenecks", action: () => { setShowLoadTest(true); runLoadTest(); setShowFeaturesMenu(false); } },
                  { icon: "🔴", label: "Red team", desc: "AI security hacker", action: () => { setShowRedTeam(true); runRedTeam(); setShowFeaturesMenu(false); } },
                  { icon: "💰", label: "Revenue model", desc: "Monetization strategy", action: () => { setShowRevenue(true); runRevenueModel(); setShowFeaturesMenu(false); } },
                  { icon: "🎭", label: "Brand voice", desc: "Consistent copy tone", action: () => { setShowBrandVoice(true); setShowFeaturesMenu(false); } },
                  { icon: "🌅", label: "Sunset analysis", desc: "App lifecycle review", action: () => { setShowSunset(true); runSunset(); setShowFeaturesMenu(false); } },
                  { icon: "📚", label: `Knowledge${knowledge.length > 0 ? ` (${knowledge.length})` : ""}`, desc: "Custom context for AI", action: () => { setShowKnowledge(true); setShowFeaturesMenu(false); } },
                ] as { icon: string; label: string; desc: string; action: () => void; active?: boolean }[]).map(({ icon, label, desc, action, active }) => (
                  <button key={label} onClick={action}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors hover:bg-white/[0.04] ${active ? "bg-white" : ""}`}>
                    <span className="text-base w-5 text-center shrink-0">{icon}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-medium ${active ? "text-[#6a1ff7]" : "text-[#17171c]"}`}>{label}</p>
                      <p className="text-[10px] text-[#9090a0] truncate">{desc}</p>
                    </div>
                    {active && <span className="ml-auto text-[9px] text-[#6a1ff7] bg-[#eef2ff] border border-[#6a1ff7]/20 rounded-full px-1.5 py-0.5">ON</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {chatMode && (
        <div className="px-3 pb-1 shrink-0">
          <p className="text-[10px] text-[#9090a0]">Chat mode — discuss your app without generating code</p>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !loading && flow.type === "idle" && !initialPrompt && (
          <div className="rounded-xl border border-[#ececf1] bg-white p-4">
            <p className="text-sm text-[#17171c] font-medium mb-1">Start building</p>
            <p className="text-xs text-[#71717f] leading-relaxed">Describe the app you want and I&apos;ll generate a live preview instantly. You can also paste or upload a screenshot to build from a design.</p>
            <div className="mt-3 space-y-1">
              {["A SaaS dashboard with charts and analytics", "An e-commerce store with product catalog", "A landing page for a startup"].map((ex) => (
                <button key={ex} onClick={() => setPrompt(ex)}
                  className="block w-full text-left text-xs text-[#9090a0] hover:text-[#5a10e7] px-2 py-1 rounded hover:bg-[#f0f0f5] transition-colors">{ex}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`text-sm max-w-[92%] ${m.role === "user" ? "ml-auto" : ""}`}>
            {m.role === "user" ? (
              <div className="rounded-2xl rounded-br-sm bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap">{m.content}</div>
            ) : (
              <div className="rounded-2xl rounded-bl-sm bg-white border border-[#ececf1] text-[#17171c] px-3.5 py-2.5 leading-relaxed">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-4 w-4 rounded bg-gradient-to-br from-[#6a1ff7] to-[#0a8ff0] shrink-0" />
                  <span className="text-xs font-medium text-[#6a1ff7]">AI</span>
                </div>
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            )}
          </div>
        ))}

        {/* Smart suggestions */}
        {suggestions.length > 0 && !loading && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-[#9090a0] px-0.5">What&apos;s next?</p>
            {suggestions.map((s) => (
              <button key={s} onClick={() => { setSuggestions([]); runGenerate(s); }}
                className="block w-full text-left text-xs rounded-xl border border-fuchsia-400/15 bg-[#f0f0ff] text-[#6a1ff7]/80 px-3.5 py-2 hover:bg-[#eef2ff] hover:border-[#6a1ff7]/30 transition-colors">
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

        <DesignPickCard />
        <ColorPickCard />
        <ArchitectCard />
        <ClarifyCard />
        <ApiKeyCard />

        {/* Proactive AI suggestions */}
        {proactiveSuggestions.length > 0 && !loading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-purple-400 font-medium">🧠 What you&apos;ll need next</span>
              {proactiveAppType && <span className="text-[10px] text-[#9090a0]">· {proactiveAppType}</span>}
            </div>
            {proactiveSuggestions.map((s, i) => (
              <button key={i} onClick={() => { setProactiveSuggestions([]); runGenerate(s.prompt); }}
                className="w-full text-left rounded-xl border border-purple-400/15 bg-purple-500/5 hover:border-purple-400/30 hover:bg-purple-500/10 p-3 transition-colors">
                <p className="text-xs font-medium text-purple-200">{s.title}</p>
                <p className="text-[10px] text-[#9090a0] mt-0.5">{s.description}</p>
              </button>
            ))}
          </div>
        )}
        {verifying && (
          <div className="flex items-center gap-2 text-[10px] text-green-500/80">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Running automated UX verification…
          </div>
        )}

        {chatStreaming && (
          <div className="rounded-2xl rounded-bl-sm bg-[#f0f0f5] border border-[#ececf1] px-3.5 py-2.5 max-w-[92%]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="h-4 w-4 rounded bg-gradient-to-br from-[#6a1ff7] to-[#0a8ff0] shrink-0" />
              <span className="text-xs font-medium text-[#6a1ff7]">AI</span>
            </div>
            <span className="text-xs text-[#17171c] whitespace-pre-wrap">{chatStreamContent || "..."}</span>
          </div>
        )}
        {loading && (
          <div className="space-y-2 max-w-[92%]">
            {routeInfo && (
              <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl border border-[#ececf1] bg-[#fbfbfc]">
                <span className="text-xs text-[#71717f]">{routeInfo.intent}</span>
              </div>
            )}
            <div className="rounded-2xl rounded-bl-sm bg-white border border-[#ececf1] px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="h-4 w-4 rounded bg-gradient-to-br from-[#6a1ff7] to-[#0a8ff0] shrink-0" />
                <span className="text-xs font-medium text-[#6a1ff7]">AI</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#71717f]">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#6a1ff7] animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                  ))}
                </span>
                {loadingStatus}
              </div>
            </div>
          </div>
        )}
        {/* Errors are auto-fixed silently — no error UI shown to user */}
      </div>

      {/* Quick actions */}
      {messages.length > 0 && !loading && (
        <div className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
          {QUICK_ACTIONS.map((a) => (
            <button key={a.label} onClick={() => { setSuggestions([]); runGenerate(a.prompt); }}
              className="shrink-0 text-[11px] rounded-full border border-[#ececf1] bg-white text-[#71717f] px-2.5 py-1 hover:border-[#6a1ff7]/30 hover:text-[#5a10e7] hover:bg-[#f0f0ff] transition-colors whitespace-nowrap">
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Queue indicator */}
      {loading && queuedPrompt && (
        <div className="px-3 pt-1 shrink-0">
          <div className="text-[10px] text-amber-400/80 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Queued: {queuedPrompt.slice(0, 60)}{queuedPrompt.length > 60 ? "…" : ""}
          </div>
        </div>
      )}

      {/* URL reference */}
      {refUrl && (
        <div className="px-3 pt-1 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-400/20 rounded-lg px-2.5 py-1">
            <span>🔗 {refUrl}</span>
            <button onClick={() => setRefUrl("")} className="text-[#9090a0] hover:text-[#71717f] ml-auto">×</button>
          </div>
        </div>
      )}

      {/* Line reference */}
      {lineRef && (
        <div className="px-3 pt-1 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-purple-400 bg-purple-500/10 border border-purple-400/20 rounded-lg px-2.5 py-1">
            <span>📍 {lineRef}</span>
            <button onClick={() => setLineRef(null)} className="text-[#9090a0] hover:text-[#71717f] ml-auto">×</button>
          </div>
        </div>
      )}

      {/* CSV data indicator */}
      {csvData && (
        <div className="px-3 pt-1 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-green-600 bg-green-500/10 border border-green-400/20 rounded-lg px-2.5 py-1">
            <span>📊 CSV data ready ({csvData.split("\n").length} rows)</span>
            <button onClick={() => setCsvData(null)} className="text-[#9090a0] hover:text-[#71717f] ml-auto">×</button>
          </div>
        </div>
      )}

      {/* Uploaded image preview */}
      {uploadImage && (
        <div className="px-3 pt-1 shrink-0">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:${uploadImage.mimeType};base64,${uploadImage.base64}`} alt="Upload" className="h-14 w-14 object-cover rounded-lg border border-[#ececf1]" />
            <button onClick={() => setUploadImage(null)} className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-400 leading-none">×</button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[#ececf1] p-3 shrink-0">
        <div className="rounded-xl border border-[#ececf1] bg-white focus-within:border-[#6a1ff7]/50 transition-colors shadow-sm">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chatMode ? handleChatSend() : handleSend(); } }}
            onPaste={handleImagePaste}
            placeholder="Describe what to build or change… paste a screenshot too"
            rows={3}
            className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-[#17171c] placeholder:text-[#9090a0] focus:outline-none"
          />
          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <div className="flex items-center gap-1 relative">
              {/* + Attach/actions popover */}
              <button onClick={() => setShowAttachMenu(v => !v)}
                title="Attach or use tools"
                className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#ececf1] bg-white text-[#71717f] hover:bg-white/[0.07] hover:text-white transition-colors text-base font-light leading-none">
                +
              </button>
              {showAttachMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                  <div className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border border-[#ececf1] bg-white shadow-2xl z-50 py-1.5 overflow-hidden">
                    <p className="text-[10px] text-[#9090a0] font-medium px-3 pt-1 pb-1.5 uppercase tracking-wider">Attach</p>
                    {([
                      { icon: "📎", label: "Image / screenshot", desc: "Upload a photo or design", action: () => { fileInputRef.current?.click(); setShowAttachMenu(false); } },
                      { icon: "📊", label: "CSV data", desc: "Build around real data", action: () => { csvInputRef.current?.click(); setShowAttachMenu(false); } },
                      { icon: "🔗", label: "Reference URL", desc: "Use a site as inspiration", action: async () => { setShowAttachMenu(false); const text = await navigator.clipboard.readText().catch(() => ""); if (text.startsWith("http")) setRefUrl(text); else { const u = window.prompt("Paste a URL:"); if (u?.startsWith("http")) setRefUrl(u); } } },
                      { icon: "🖼️", label: "Figma import", desc: "Import from Figma", action: () => { setShowFigma(true); setFigmaError(null); setShowAttachMenu(false); } },
                    ] as { icon: string; label: string; desc: string; action: () => void }[]).map(({ icon, label, desc, action }) => (
                      <button key={label} onClick={action} className="w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors hover:bg-white/[0.04]">
                        <span className="text-base w-5 text-center shrink-0">{icon}</span>
                        <div>
                          <p className="text-xs font-medium text-[#17171c]">{label}</p>
                          <p className="text-[10px] text-[#9090a0]">{desc}</p>
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-white/[0.05] mt-1 pt-1">
                      <p className="text-[10px] text-[#9090a0] font-medium px-3 pb-1.5 uppercase tracking-wider">Actions</p>
                      {([
                        { icon: "🎨", label: "Generate image", desc: "AI-generated art or assets", action: () => { setShowImageGen(true); setImageGenResult(null); setImageGenError(null); setShowAttachMenu(false); } },
                        { icon: "✨", label: "Enhance prompt", desc: "AI rewrites your prompt", action: () => { handleEnhancePrompt(); setShowAttachMenu(false); }, disabled: !prompt.trim() || enhancing },
                        { icon: voiceActive ? "🔴" : "🎤", label: voiceActive ? "Stop voice" : "Voice input", desc: "Speak your prompt", action: () => { toggleVoice(); setShowAttachMenu(false); } },
                        ...(lastPrompt && !loading ? [{ icon: "↺", label: "Retry last prompt", desc: "Re-run previous generation", action: () => { runGenerate(lastPrompt); setShowAttachMenu(false); } }] : []),
                      ] as { icon: string; label: string; desc: string; action: () => void; disabled?: boolean }[]).map(({ icon, label, desc, action, disabled }) => (
                        <button key={label} onClick={disabled ? undefined : action} disabled={disabled}
                          className="w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors hover:bg-white/[0.04] disabled:opacity-40">
                          <span className="text-base w-5 text-center shrink-0">{icon}</span>
                          <div>
                            <p className="text-xs font-medium text-[#17171c]">{label}</p>
                            <p className="text-[10px] text-[#9090a0]">{desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {userCredits !== null && (
                userCredits <= 10 ? (
                  <a href="/dashboard" className="text-[10px] font-medium text-amber-400 hover:text-amber-300 transition-colors tabular-nums">
                    {userCredits <= 0 ? "No credits · Buy more" : `${userCredits.toFixed(1)} credits · Buy more`}
                  </a>
                ) : (
                  <span className="text-[10px] font-medium text-[#9090a0] tabular-nums">
                    {userCredits.toFixed(1)} credits
                  </span>
                )
              )}
              {loading && !chatMode ? (
                <button onClick={stopGenerating}
                  className="rounded-lg bg-red-500/80 hover:bg-red-500 text-white px-4 py-1.5 text-sm font-medium transition-colors">
                  Stop
                </button>
              ) : (
                <button onClick={chatMode ? handleChatSend : handleSend} disabled={(chatMode ? chatStreaming : false) || !prompt.trim()}
                  className="rounded-lg bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
                  {chatMode ? (chatStreaming ? "Thinking..." : "Send") : "Send"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
      <input ref={csvInputRef} type="file" accept=".csv,.tsv,text/csv" onChange={handleCsvFile} className="hidden" />
    </div>
  );

  // ── Preview panel ─────────────────────────────────────────────────────────────
  const previewPanel = (
    <div className="flex flex-col overflow-hidden" style={{ height: "100%" }}>
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#ececf1] bg-[#fbfbfc] shrink-0">
        {(["preview", "code", "console"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? "bg-[#eef2ff] text-[#6a1ff7]" : "text-[#9090a0] hover:text-[#17171c]"}`}>
            {tab === "preview" ? "Preview" : tab === "code" ? "Code" : "Console"}
          </button>
        ))}
        {activeTab === "code" && (
          <button onClick={() => setDevModeEnabled(v => !v)} title="Dev Mode — edit code directly"
            className={`ml-1 text-xs rounded-lg border px-2.5 py-1 transition-colors ${devModeEnabled ? "border-amber-400/40 bg-amber-500/10 text-amber-300" : "border-[#ececf1] bg-white text-[#9090a0] hover:text-[#17171c]"}`}>
            {devModeEnabled ? "✏️ Editing" : "✏️ Dev Mode"}
          </button>
        )}

        {activeTab === "preview" && (
          <div className="flex items-center gap-0.5 ml-2 rounded-lg border border-[#ececf1] bg-white p-0.5">
            {([
              { mode: "desktop" as PreviewMode, icon: "🖥", label: "Desktop" },
              { mode: "tablet" as PreviewMode, icon: "📲", label: "Tablet (768px)" },
              { mode: "mobile" as PreviewMode, icon: "📱", label: "Mobile (390px)" },
            ]).map(({ mode, icon, label }) => (
              <button key={mode} onClick={() => setPreviewMode(mode)} title={label}
                className={`px-2 py-0.5 rounded-md text-sm transition-colors ${previewMode === mode ? "bg-[#eef2ff] text-[#6a1ff7]" : "text-[#9090a0] hover:text-[#17171c]"}`}>
                {icon}
              </button>
            ))}
          </div>
        )}

        {hasFiles && activeTab === "preview" && (
          <button onClick={toggleVisualEdit} title="Click any element to edit it"
            className={`ml-2 text-xs rounded-lg border px-2.5 py-1 transition-colors flex items-center gap-1.5 ${visualEditMode ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-[#6a1ff7]" : "border-[#ececf1] bg-white text-[#9090a0] hover:text-[#17171c]"}`}>
            <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086zM11.189 6.25 9.75 4.81l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.249.249 0 0 0 .108-.064l6.286-6.286z"/></svg>
            {visualEditMode ? "Click element…" : "Visual Edit"}
          </button>
        )}
        {publishUrl && (
          <a href={publishUrl} target="_blank" rel="noreferrer"
            className="ml-auto text-xs text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors truncate font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />{publishDomain}
          </a>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
        {/* Floating inline text editor */}
        {editingText && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 rounded-xl border border-[#6a1ff7]/30 bg-white shadow-xl px-4 py-3 w-[90%] max-w-md space-y-2">
            <p className="text-xs text-[#71717f]">Edit text</p>
            <input
              autoFocus
              value={editingText.newText}
              onChange={e => setEditingText(prev => prev ? { ...prev, newText: e.target.value } : null)}
              onKeyDown={e => { if (e.key === "Enter") applyTextEdit(); if (e.key === "Escape") setEditingText(null); }}
              className="w-full rounded-lg border border-[#ececf1] bg-[#fbfbfc] px-3 py-2 text-sm text-[#17171c] focus:outline-none focus:border-[#6a1ff7]/50"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingText(null)} className="text-xs text-[#9090a0] hover:text-[#17171c] px-3 py-1">Cancel</button>
              <button onClick={applyTextEdit} className="text-xs rounded-lg bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white px-4 py-1.5 font-medium hover:opacity-90">Save</button>
            </div>
          </div>
        )}
        {/* Errors are auto-fixed silently — no banner shown */}
        {hasFiles ? (
          <div style={{ flex: 1, minHeight: 0, height: "100%" }}>
            <SandpackPreview files={visualEditMode ? injectVisualEditHelper(files) : files} onError={handleSandpackError} view={activeTab} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[#9090a0] text-sm">
            {loading ? "" : "Describe something in the chat to get started."}
          </div>
        )}
        {loading && (
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur border-t border-[#ececf1]">
            <span className="h-2 w-2 rounded-full bg-[#6a1ff7] animate-pulse" />
            <span className="text-xs text-[#71717f]">{loadingStatus}</span>
            <span className="text-xs text-[#9090a0] ml-auto font-mono">{streamAccum.current.length > 0 ? `${streamAccum.current.length.toLocaleString()} chars` : ""}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-white" style={{ height: "100dvh" }}>
      <header className="border-b border-gray-100 bg-white px-3 py-2 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard" className="shrink-0" onClick={e => { if (loading && !confirm("Generation is in progress. Leave anyway?")) e.preventDefault(); }}><Logo size="sm" /></Link>
          <span className="text-gray-700 hidden sm:inline">/</span>
          <h1 className="text-sm font-medium text-[#17171c] truncate hidden sm:block max-w-[160px]">{projectName}</h1>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Always-visible core actions */}
          <button onClick={() => { setShowHistory(true); handleLoadVersions(true); }} title="Version history"
            className="text-xs rounded-lg border border-[#ececf1] bg-[#f0f0f5] text-[#71717f] px-2 py-1.5 hover:bg-white/10 transition-colors flex items-center gap-1">
            ⏱
          </button>
          {hasFiles && (
            <button onClick={() => { setShowShareModal(true); setShareLink(null); }} title="Share"
              className="text-xs rounded-lg border border-[#ececf1] bg-[#f0f0f5] text-[#71717f] px-2 py-1.5 hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1">
              🔗
            </button>
          )}
          {/* More dropdown */}
          {hasFiles && (
            <div className="relative">
              <button onClick={() => setShowMoreMenu(v => !v)}
                className="text-xs rounded-lg border border-[#ececf1] bg-[#f0f0f5] text-[#71717f] px-2.5 py-1.5 hover:bg-white/10 transition-colors flex items-center gap-1">
                ··· More
              </button>
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-[#ececf1] bg-white shadow-2xl z-50 py-1.5 overflow-hidden">
                  {([
                    { icon: "🗄️", label: supabaseStatus?.enabled ? "Database ✓" : "Database", action: () => { setShowSupabase(true); loadSupabaseStatus(); } },
                    { icon: "🔌", label: "Integrations", action: () => setShowIntegrations(true) },
                    { icon: "🧪", label: "Test UX", action: () => { setShowUserTest(true); setUserTestResult(null); } },
                    { icon: "💰", label: "Monetize", action: () => { setShowMonetize(true); setMonetizePlan(null); } },
                    { icon: "📤", label: "Export HTML", action: () => { const a = document.createElement("a"); a.href = `/api/projects/${projectId}/export`; a.download = ""; a.click(); } },
                    { icon: "📱", label: "Export App", action: () => { const a = document.createElement("a"); a.href = `/api/projects/${projectId}/export-app`; a.download = ""; a.click(); showToast("Downloading app package", "info"); } },
                    { icon: "⬆️", label: "GitHub", action: () => { setShowGithub(true); setGithubResult(null); } },
                  ] as { icon: string; label: string; action: () => void }[]).map(({ icon, label, action }) => (
                    <button key={label} onClick={action}
                      className="w-full text-left px-3 py-2 text-xs text-[#3a3a4a] hover:bg-[#f0f0f5] flex items-center gap-2 transition-colors">
                      <span>{icon}</span>{label}
                    </button>
                  ))}
                </div>
                </>
              )}
            </div>
          )}
          {/* Privacy toggle */}
          <button
            onClick={isPaidPlan ? handleTogglePrivacy : () => window.location.href = "/pricing"}
            disabled={privacyLoading}
            title={isPaidPlan ? (isPrivate ? "Private — only you can see this" : "Public — anyone with the link can see this") : "Upgrade to make projects private"}
            className={`text-xs rounded-lg border px-2.5 py-1.5 transition-colors flex items-center gap-1.5 ${
              !isPaidPlan
                ? "border-[#6a1ff7]/20 bg-[#f0f0ff] text-[#6a1ff7]/70 hover:bg-[#eef2ff] hover:text-[#5a10e7] cursor-pointer"
                : isPrivate
                  ? "border-amber-400/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                  : "border-[#ececf1] bg-[#f0f0f5] text-[#71717f] hover:bg-white/10"
            }`}
          >
            {isPrivate ? "🔒" : "🌐"}
            <span className="hidden sm:inline">{isPrivate ? "Private" : "Public"}</span>
          </button>
          {publishUrl ? (
            <div className="flex items-center gap-1.5">
              <button onClick={() => handlePublish(publishSlug ?? undefined)} disabled={!hasFiles || publishing}
                className="text-xs rounded-lg border border-[#6a1ff7]/30 bg-[#eef2ff] text-[#6a1ff7] px-3 py-1.5 hover:bg-fuchsia-500/20 transition-colors disabled:opacity-40 flex items-center gap-1.5">
                {publishing ? <><span className="h-1.5 w-1.5 rounded-full bg-[#6a1ff7] animate-pulse" />Updating...</>
                  : publishedFilesHash && hashFiles(files) !== publishedFilesHash
                    ? <><span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />Update</>
                    : liveUpdated ? "Updated ✓" : "Update"}
              </button>
              <a href={publishUrl} target="_blank" rel="noreferrer"
                className="text-xs rounded-lg border border-green-500/30 bg-green-500/10 text-green-600 px-3 py-1.5 hover:bg-green-500/20 transition-colors">Live ↗</a>
              <button onClick={() => navigator.clipboard.writeText(publishUrl ?? "")}
                className="text-xs rounded-lg border border-[#ececf1] bg-[#f0f0f5] text-[#3a3a4a] px-2 py-1.5 hover:bg-white/10 hidden sm:block">Copy</button>
              <button onClick={handleUnpublish} className="text-xs text-[#9090a0] hover:text-red-400 px-1 py-1.5 transition-colors">×</button>
            </div>
          ) : (
            <button onClick={() => setShowPublishDialog(true)} disabled={!hasFiles || publishing}
              className="text-xs rounded-lg border border-[#6a1ff7]/30 bg-[#eef2ff] text-[#6a1ff7] px-3 py-1.5 hover:bg-fuchsia-500/20 transition-colors disabled:opacity-40 flex items-center gap-1.5 relative">
              {publishing ? <><span className="h-1.5 w-1.5 rounded-full bg-[#6a1ff7] animate-pulse" />Publishing...</> : <>Publish {hasFiles && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />}</>}
            </button>
          )}
          <Link href="/settings" title="Settings"
            onClick={e => { if (loading && !confirm("Generation is in progress. Leave anyway?")) e.preventDefault(); }}
            className="text-xs rounded-lg border border-[#ececf1] bg-[#f0f0f5] text-[#71717f] px-2 py-1.5 hover:bg-white/10 transition-colors hidden sm:flex items-center">
            ⚙️
          </Link>
        </div>
      </header>

      {/* Desktop */}
      <div className="hidden sm:flex flex-1 overflow-hidden">
        <div className="w-[340px] flex flex-col border-r border-[#ececf1] shrink-0">{chatPanel}</div>
        <div className="flex-1 overflow-hidden">{previewPanel}</div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden flex flex-col overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column" }}>{mobileTab === "chat" ? chatPanel : previewPanel}</div>
        <div className="shrink-0 border-t border-[#ececf1] bg-white flex">
          {(["chat", "preview"] as const).map((tab) => (
            <button key={tab} onClick={() => setMobileTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-0.5 ${mobileTab === tab ? "text-[#6a1ff7] border-t-2 border-fuchsia-400 -mt-px" : "text-[#9090a0]"}`}>
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
      {dnsInfo && <DnsVerifyModal dnsInfo={dnsInfo} onClose={() => setDnsInfo(null)} />}

      {/* User testing modal */}
      {showUserTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowUserTest(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">🧪 Synthetic User Testing</h2>
              <button onClick={() => setShowUserTest(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-[#9090a0]">AI simulates real users clicking through your app and reports back issues — before any real user sees it.</p>
            {!userTestResult && (
              <button onClick={handleUserTest} disabled={userTestLoading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
                {userTestLoading ? "Testing… (15-20s)" : "Run User Test →"}
              </button>
            )}
            {userTestResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl font-bold ${userTestResult.overallScore >= 80 ? "text-green-600" : userTestResult.overallScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
                    {userTestResult.overallScore}/100
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#17171c]">Usability Score</p>
                    <p className="text-xs text-[#9090a0]">{userTestResult.testers.filter(t => t.verdict === "passed").length}/{userTestResult.testers.length} testers completed their goal</p>
                  </div>
                </div>
                {userTestResult.criticalIssues.length > 0 && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-red-400">Critical issues</p>
                    {userTestResult.criticalIssues.map((issue, i) => (
                      <p key={i} className="text-xs text-red-300/80">· {issue}</p>
                    ))}
                  </div>
                )}
                {userTestResult.quickWins.length > 0 && (
                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-green-600">Quick wins</p>
                    {userTestResult.quickWins.map((win, i) => (
                      <p key={i} className="text-xs text-green-600/80">· {win}</p>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  {userTestResult.testers.map((t, i) => (
                    <div key={i} className={`rounded-xl border p-3 space-y-2 ${t.verdict === "passed" ? "border-green-500/20 bg-green-500/5" : t.verdict === "confused" ? "border-amber-500/20 bg-amber-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-[#17171c]">{t.persona}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${t.verdict === "passed" ? "bg-green-500/20 text-green-600" : t.verdict === "confused" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>
                          {t.verdict}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#9090a0]">Goal: {t.goal}</p>
                      {t.issues.map((issue, j) => (
                        <p key={j} className="text-[10px] text-red-300/80">⚠ {issue}</p>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const fixes = [...(userTestResult.criticalIssues ?? []), ...(userTestResult.quickWins ?? [])].slice(0, 5).join("; ");
                    setShowUserTest(false);
                    runGenerate(`Fix these user testing issues: ${fixes}. Do not change the design or layout — only fix the reported UX problems.`);
                  }}
                    className="flex-1 text-xs rounded-xl bg-fuchsia-500/20 border border-[#6a1ff7]/30 text-[#6a1ff7] py-2 hover:bg-fuchsia-500/30 transition-colors">
                    Fix all issues →
                  </button>
                  <button onClick={handleUserTest} disabled={userTestLoading}
                    className="text-xs rounded-xl border border-[#ececf1] bg-[#f0f0f5] text-[#71717f] px-3 py-2 hover:bg-white/10 transition-colors">
                    Re-test
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monetize modal */}
      {showMonetize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowMonetize(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">💰 One-Prompt Monetization</h2>
              <button onClick={() => setShowMonetize(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-[#9090a0]">Describe your pricing model and we&apos;ll wire up Stripe — pricing page, checkout, trials, webhooks — all from one sentence.</p>
            <textarea
              value={monetizeDesc}
              onChange={e => setMonetizeDesc(e.target.value)}
              placeholder='e.g. "Charge $19/month, 14-day free trial. Team plan $49/month for up to 5 users. Annual gets 20% off."'
              rows={3}
              className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40 resize-none"
            />
            {monetizePlan ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3">
                  <p className="text-xs text-green-600">✓ {monetizePlan.summary}</p>
                </div>
                <button onClick={() => { setShowMonetize(false); runGenerate(monetizePlan.buildPrompt); }}
                  className="w-full text-sm rounded-xl bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white font-semibold py-2.5 hover:opacity-90 transition-opacity">
                  Add to my app →
                </button>
              </div>
            ) : (
              <button onClick={handleMonetize} disabled={monetizeLoading || !monetizeDesc.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
                {monetizeLoading ? "Planning monetization…" : "Generate billing setup →"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">🔗 Share Preview</h2>
              <button onClick={() => setShowShareModal(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-[#9090a0]">Create a public view-only link to your current build. Valid for 7 days, no login required.</p>
            {shareLink ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-[#f0f0f5] border border-[#ececf1] px-3 py-2 text-xs text-green-600 font-mono break-all">{shareLink}</div>
                <p className="text-[10px] text-green-500">✓ Copied to clipboard</p>
                <button onClick={() => navigator.clipboard.writeText(shareLink)} className="w-full text-xs rounded-xl border border-[#ececf1] bg-[#f0f0f5] text-[#3a3a4a] py-2 hover:bg-white/10 transition-colors">
                  Copy again
                </button>
              </div>
            ) : (
              <button onClick={handleCreateShareLink} disabled={shareLoading}
                className="w-full rounded-xl bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
                {shareLoading ? "Creating link…" : "Create share link →"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Figma import modal */}
      {showFigma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowFigma(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">Import from Figma</h2>
              <button onClick={() => setShowFigma(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-[#9090a0]">Paste a Figma file link and your personal access token to build from your design.</p>
            <div className="space-y-2">
              <input value={figmaUrl} onChange={e => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/file/..."
                className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40" />
              <input type="password" value={figmaToken} onChange={e => setFigmaToken(e.target.value)}
                placeholder="Figma personal access token (figd_...)"
                className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40 font-mono" />
              <p className="text-[10px] text-[#9090a0]">Get your token: figma.com → Account → Personal access tokens</p>
            </div>
            {figmaError && <p className="text-xs text-red-400">{figmaError}</p>}
            <button onClick={handleFigmaImport} disabled={figmaLoading || !figmaUrl.trim() || !figmaToken.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
              {figmaLoading ? "Reading design…" : "Import & Build →"}
            </button>
          </div>
        </div>
      )}

      {/* Supabase database modal */}
      {showSupabase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSupabase(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">🗄️ Built-in Database</h2>
              <button onClick={() => setShowSupabase(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            {supabaseStatus?.enabled ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 text-sm">
                  ✓ Database is active
                </div>
                <p className="text-xs text-[#9090a0]">Your app has a real Postgres database with authentication. Credentials are already injected into your project — just ask the AI to use Supabase for data storage.</p>
                <div className="rounded-xl bg-white border border-[#ececf1] p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#9090a0]">URL</span>
                    <button onClick={() => navigator.clipboard.writeText(supabaseStatus.url ?? "")} className="text-[10px] text-[#9090a0] hover:text-[#17171c]">Copy</button>
                  </div>
                  <p className="text-xs text-[#3a3a4a] font-mono truncate">{supabaseStatus.url}</p>
                </div>
                <button onClick={() => runGenerate("Add Supabase database integration. The SUPABASE_URL and SUPABASE_ANON_KEY are already available in window.ENV. Use the Supabase JS client (import from CDN: https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm) to replace localStorage with real database storage for all data. Add Supabase auth if the app has user accounts.")}
                  className="w-full text-xs rounded-xl bg-fuchsia-500/20 border border-[#6a1ff7]/30 text-[#6a1ff7] py-2.5 hover:bg-fuchsia-500/30 transition-colors">
                  Connect database to app →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#71717f] leading-relaxed">Enable a real Postgres database with authentication for your app. No setup required — we provision it automatically.</p>
                <div className="space-y-2 text-xs text-[#9090a0]">
                  <div className="flex items-center gap-2">✓ <span>Real Postgres database</span></div>
                  <div className="flex items-center gap-2">✓ <span>Built-in user authentication</span></div>
                  <div className="flex items-center gap-2">✓ <span>File storage</span></div>
                  <div className="flex items-center gap-2">✓ <span>Realtime subscriptions</span></div>
                </div>
                {supabaseError && <p className="text-xs text-red-400">{supabaseError}</p>}
                <button onClick={handleEnableSupabase} disabled={supabaseProvisioning}
                  className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
                  {supabaseProvisioning ? "Provisioning… (1-2 min)" : "Enable Database →"}
                </button>
                <p className="text-[10px] text-[#9090a0] text-center">Free tier • No credit card required</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image generation modal */}
      {showImageGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowImageGen(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">🎨 Generate Image</h2>
              <button onClick={() => setShowImageGen(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-[#9090a0]">Describe the image you need. It will be generated and added to your app.</p>
            <textarea
              value={imageGenPrompt}
              onChange={e => setImageGenPrompt(e.target.value)}
              placeholder="A minimalist product photo of wireless headphones on a white background..."
              rows={3}
              className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40 resize-none"
            />
            {imageGenResult && (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageGenResult} alt="Generated" className="w-full rounded-xl border border-[#ececf1]" />
                <button onClick={() => {
                  runGenerate(`Add this image to the app. Use this URL as an <img> src: ${imageGenResult}`);
                  setShowImageGen(false);
                }}
                  className="w-full text-xs rounded-xl bg-fuchsia-500/20 border border-[#6a1ff7]/30 text-[#6a1ff7] py-2 hover:bg-fuchsia-500/30 transition-colors">
                  Add to app →
                </button>
                <button onClick={() => { navigator.clipboard.writeText(imageGenResult); }}
                  className="w-full text-xs rounded-xl border border-[#ececf1] text-[#71717f] py-2 hover:bg-[#f0f0f5] transition-colors">
                  Copy URL
                </button>
              </div>
            )}
            {imageGenError && <p className="text-xs text-red-400">{imageGenError}</p>}
            <button onClick={handleGenerateImage} disabled={imageGenLoading || !imageGenPrompt.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
              {imageGenLoading ? "Generating… (10-20s)" : "Generate →"}
            </button>
          </div>
        </div>
      )}

      {/* GitHub export modal */}
      {showGithub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowGithub(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c] flex items-center gap-2">
                <svg viewBox="0 0 16 16" className="h-4 w-4 fill-white"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
                Export to GitHub
              </h2>
              <button onClick={() => setShowGithub(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            {githubResult?.repoUrl ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 text-sm">
                  ✓ Exported successfully!
                </div>
                <a href={githubResult.repoUrl} target="_blank" rel="noreferrer"
                  className="block text-center text-sm text-[#6a1ff7] hover:text-[#5a10e7] border border-[#6a1ff7]/30 rounded-xl py-2.5 hover:bg-[#f0f0ff] transition-colors">
                  View on GitHub ↗
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#9090a0]">Create a GitHub Personal Access Token with <code className="text-[#71717f]">repo</code> scope at github.com/settings/tokens</p>
                <div className="space-y-2">
                  <input type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)}
                    placeholder="GitHub token (ghp_...)"
                    className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40 font-mono" />
                  <input value={githubRepo} onChange={e => setGithubRepo(e.target.value)}
                    placeholder="Repository name (e.g. my-app)"
                    className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40" />
                  <label className="flex items-center gap-2 text-xs text-[#71717f] cursor-pointer">
                    <input type="checkbox" checked={githubPrivate} onChange={e => setGithubPrivate(e.target.checked)} className="rounded" />
                    Private repository
                  </label>
                </div>
                {githubResult?.error && <p className="text-xs text-red-400">{githubResult.error}</p>}
                <button onClick={handleGithubExport} disabled={githubLoading || !githubToken.trim() || !githubRepo.trim()}
                  className="w-full rounded-xl bg-white text-black text-sm font-semibold py-2.5 hover:bg-gray-100 transition-colors disabled:opacity-40">
                  {githubLoading ? "Exporting..." : "Export to GitHub →"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Version history slide-over */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowHistory(false)}>
          <div className="ml-auto h-full w-full max-w-xs bg-white border-l border-[#ececf1] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#ececf1] shrink-0">
              <h3 className="text-sm font-semibold text-[#17171c]">Version History</h3>
              <button onClick={() => setShowHistory(false)} className="text-[#9090a0] hover:text-white transition-colors text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingVersions ? (
                <div className="text-xs text-[#9090a0] text-center py-8">Loading versions…</div>
              ) : versionList.length === 0 ? (
                <div className="text-xs text-[#9090a0] text-center py-8">No saved versions yet.</div>
              ) : (
                versionList.map((v, i) => (
                  <div key={v.id} className={`rounded-xl border p-3 space-y-2 ${v.bookmarked ? "border-amber-400/30 bg-amber-500/5" : "border-[#ececf1] bg-white"}`}>
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-[10px] bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded-full">Latest</span>}
                      <button onClick={() => toggleBookmark(v.id, !!v.bookmarked)} title={v.bookmarked ? "Remove bookmark" : "Bookmark"}
                        className={`text-sm leading-none transition-colors ${v.bookmarked ? "text-amber-400" : "text-[#9090a0] hover:text-amber-300"}`}>
                        {v.bookmarked ? "★" : "☆"}
                      </button>
                      <span className="text-[10px] text-[#9090a0] ml-auto">{new Date(v.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-[11px] text-[#71717f]">{v.modelUsed ?? "Unknown model"}</p>
                    {v.bookmarkNote && <p className="text-[10px] text-amber-300/70 italic">{v.bookmarkNote}</p>}
                    {i > 0 && (
                      <div className="space-y-1">
                        <button onClick={async () => {
                          const res = await fetch(`/api/projects/${projectId}/versions/${v.id}/explain`, { method: "POST" });
                          const data = await res.json();
                          if (data.explanation) alert(data.explanation);
                        }}
                          className="text-[11px] rounded-lg border border-[#ececf1] bg-[#f0f0f5] text-[#9090a0] px-2.5 py-1 hover:bg-white/10 transition-colors w-full">
                          What changed?
                        </button>
                        <button onClick={() => handleRestoreVersion(v.id)}
                          className="text-[11px] rounded-lg border border-[#ececf1] bg-[#f0f0f5] text-[#3a3a4a] px-2.5 py-1 hover:bg-white/10 transition-colors w-full">
                          Restore this version
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Analytics modal */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowAnalytics(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">📊 Analytics (last 7 days)</h2>
              <button onClick={() => setShowAnalytics(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            {analyticsLoading && <p className="text-xs text-[#9090a0]">Loading…</p>}
            {analyticsData && !analyticsLoading && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Pageviews", value: analyticsData.pageviews, color: "text-blue-300" },
                    { label: "Clicks", value: analyticsData.clicks, color: "text-green-600" },
                    { label: "Rage-clicks", value: analyticsData.rageclicks, color: "text-red-300" },
                    { label: "Form Submits", value: analyticsData.formSubmits, color: "text-purple-300" },
                  ].map(s => (
                    <div key={s.label} className="bg-[#f0f0f5] rounded-xl p-3 text-center">
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-[#9090a0] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                {analyticsData.topRageClicks.length > 0 && (
                  <div>
                    <p className="text-xs text-red-400 font-medium mb-2">🔥 Rage-click hotspots</p>
                    {analyticsData.topRageClicks.map(r => (
                      <div key={r.el} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                        <span className="text-[#71717f] truncate">{r.el}</span>
                        <span className="text-red-300 font-medium ml-2">{r.count}×</span>
                      </div>
                    ))}
                    <button onClick={() => {
                      const prompt = `Fix these UX frustration points — users are rage-clicking (3+ fast clicks) on these elements:\n${analyticsData!.topRageClicks.map(r => `- "${r.el}" (${r.count} rage-clicks)`).join("\n")}\nMake these elements more responsive, add loading states, fix broken interactions.`;
                      setShowAnalytics(false);
                      runGenerate(prompt);
                    }} className="mt-3 w-full rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs py-2 hover:bg-red-500/30 transition-colors">
                      Fix rage-click issues →
                    </button>
                  </div>
                )}
                {analyticsData.pageviews === 0 && (
                  <p className="text-xs text-[#9090a0]">No data yet. Publish your app to start tracking visitors.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance modal */}
      {showCompliance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCompliance(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">⚖️ Legal Compliance Check</h2>
              <button onClick={() => setShowCompliance(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            {complianceLoading && <p className="text-xs text-[#9090a0]">Analyzing your app for compliance requirements…</p>}
            {complianceData && !complianceLoading && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {complianceData.applicableLaws.map(law => (
                    <span key={law} className="text-xs rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-300 px-2.5 py-1">{law}</span>
                  ))}
                </div>
                {complianceData.issues.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-[#9090a0] font-medium">Issues found:</p>
                    {complianceData.issues.map((issue, i) => (
                      <div key={i} className="text-xs text-[#71717f] flex gap-2">
                        <span className="text-amber-400 shrink-0">⚠</span>
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
                {complianceData.issues.length === 0 && (
                  <p className="text-xs text-green-600">✓ No major compliance issues detected.</p>
                )}
                {complianceData.issues.length > 0 && (
                  <button onClick={() => { setShowCompliance(false); runGenerate(complianceData.buildPrompt); }}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity">
                    Auto-fix compliance issues →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clone URL modal */}
      {showCloneUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCloneUrl(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">🔍 Build inspired by a URL</h2>
              <button onClick={() => setShowCloneUrl(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-[#9090a0]">Paste any public URL — AI analyzes its structure and builds you something inspired by it (original design, no copyright issues).</p>
            <input value={cloneUrl} onChange={e => setCloneUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40" />
            {cloneError && <p className="text-xs text-red-400">{cloneError}</p>}
            <button onClick={handleCloneUrl} disabled={cloneLoading || !cloneUrl.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
              {cloneLoading ? "Analyzing…" : "Analyze & Build →"}
            </button>
          </div>
        </div>
      )}

      {/* App merge modal */}
      {showMerge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowMerge(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">⚡ Merge Another Project</h2>
              <button onClick={() => setShowMerge(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-[#9090a0]">Paste the project ID of another app you own. AI will merge both apps into one unified experience.</p>
            <input value={mergeProjectId} onChange={e => setMergeProjectId(e.target.value)}
              placeholder="Project ID (from the URL: /projects/abc123)"
              className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40 font-mono text-xs" />
            <textarea value={mergeGoal} onChange={e => setMergeGoal(e.target.value)}
              placeholder="Describe the merge goal (optional) — e.g. 'Add the blog section from my other app into this dashboard'"
              rows={3}
              className="w-full resize-none bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40" />
            <button onClick={handleMerge} disabled={mergeLoading || !mergeProjectId.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
              {mergeLoading ? "Analyzing both apps…" : "Merge Projects →"}
            </button>
          </div>
        </div>
      )}
      {/* Load test modal */}
      {showLoadTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowLoadTest(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">🏋️ AI Load Test</h2>
              <button onClick={() => setShowLoadTest(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            {loadTestLoading && <p className="text-xs text-[#9090a0]">Simulating 10,000 users across your app flows…</p>}
            {loadTestData && !loadTestLoading && (
              <div className="space-y-4">
                <p className="text-xs text-[#71717f]">⚠ Estimated crash point: <span className="text-red-300">{loadTestData.estimatedCrashPoint}</span></p>
                <div className="space-y-2">
                  {loadTestData.bottlenecks.map((b, i) => (
                    <div key={i} className={`rounded-xl border p-3 space-y-1 ${b.severity === "critical" ? "border-red-500/30 bg-red-500/5" : b.severity === "high" ? "border-amber-500/30 bg-amber-500/5" : "border-[#ececf1] bg-[#f0f0f5]"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium uppercase rounded px-1.5 py-0.5 ${b.severity === "critical" ? "bg-red-500/20 text-red-300" : b.severity === "high" ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-[#71717f]"}`}>{b.severity}</span>
                        <span className="text-xs text-[#3a3a4a]">{b.location}</span>
                      </div>
                      <p className="text-xs text-[#9090a0]">{b.issue}</p>
                      <p className="text-xs text-green-600">Fix: {b.fix}</p>
                    </div>
                  ))}
                </div>
                {loadTestData.bottlenecks.length > 0 && (
                  <button onClick={() => { setShowLoadTest(false); runGenerate(loadTestData.buildPrompt); }}
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity">
                    Fix all performance issues →
                  </button>
                )}
                {loadTestData.bottlenecks.length === 0 && <p className="text-xs text-green-600">✓ No major performance issues found.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Red team modal */}
      {showRedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowRedTeam(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">🔴 Adversarial Red Team</h2>
              <button onClick={() => setShowRedTeam(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            {redTeamLoading && <p className="text-xs text-[#9090a0]">AI is attempting to break your app like a real attacker…</p>}
            {redTeamData && !redTeamLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl font-bold ${redTeamData.securityScore >= 80 ? "text-green-600" : redTeamData.securityScore >= 60 ? "text-amber-400" : "text-red-400"}`}>{redTeamData.securityScore}/100</div>
                  <div>
                    <p className="text-xs text-[#3a3a4a] font-medium">Security Score</p>
                    <p className="text-[10px] text-[#9090a0]">{redTeamData.exploits.length} exploit{redTeamData.exploits.length !== 1 ? "s" : ""} found</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {redTeamData.exploits.map((e, i) => (
                    <div key={i} className={`rounded-xl border p-3 space-y-1 ${e.severity === "critical" ? "border-red-500/40 bg-red-500/5" : e.severity === "high" ? "border-orange-500/30 bg-orange-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-medium rounded px-1.5 py-0.5 ${e.severity === "critical" ? "bg-red-500/20 text-red-300" : "bg-orange-500/20 text-orange-300"}`}>{e.severity}</span>
                        <span className="text-xs text-[#3a3a4a] font-medium">{e.type}</span>
                      </div>
                      <p className="text-xs text-[#71717f]">{e.description}</p>
                      <p className="text-xs text-green-600">Fix: {e.fix}</p>
                    </div>
                  ))}
                </div>
                {redTeamData.passed.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-[#9090a0] font-medium">Passed checks</p>
                    {redTeamData.passed.map((p, i) => <p key={i} className="text-xs text-green-600">✓ {p}</p>)}
                  </div>
                )}
                {redTeamData.exploits.length > 0 && (
                  <button onClick={() => { setShowRedTeam(false); runGenerate(redTeamData.buildPrompt); }}
                    className="w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity">
                    Patch all vulnerabilities →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue model modal */}
      {showRevenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowRevenue(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">💰 Revenue Model</h2>
              <button onClick={() => setShowRevenue(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            {revenueLoading && <p className="text-xs text-[#9090a0]">Modeling revenue strategies for your app…</p>}
            {revenueData && !revenueLoading && (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 px-4 py-3">
                  <p className="text-xs text-emerald-300 font-medium">Recommended: {revenueData.recommended} at {revenueData.launchPrice}</p>
                  <p className="text-[10px] text-[#71717f] mt-1">{revenueData.willingness_to_pay_reasoning}</p>
                </div>
                <div className="space-y-2">
                  {revenueData.strategies?.map((s, i) => (
                    <div key={i} className={`rounded-xl border p-3 ${s.name === revenueData.recommended ? "border-emerald-400/30 bg-emerald-500/5" : "border-[#ececf1] bg-[#f0f0f5]"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white font-medium">{s.name}</span>
                        <span className="text-xs text-[#71717f]">{s.suggestedPrice}</span>
                      </div>
                      <p className="text-[10px] text-[#9090a0]">{s.estimatedMRR}</p>
                      <div className="mt-1.5 h-1 bg-[#f0f0f5] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${s.fit}%` }} />
                      </div>
                      <p className="text-[10px] text-[#9090a0] mt-0.5">{s.fit}% fit</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setShowRevenue(false); runGenerate(revenueData.buildPrompt); }}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity">
                  Add billing infrastructure →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Brand voice modal */}
      {showBrandVoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowBrandVoice(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">🎭 Brand Voice</h2>
              <button onClick={() => setShowBrandVoice(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-[#9090a0]">Define your product&apos;s personality once — AI applies it to every error message, empty state, and UI string across your entire app.</p>
            <div className="space-y-2">
              <input value={brandTone} onChange={e => setBrandTone(e.target.value)} placeholder="Tone (e.g. friendly and direct, professional and warm)"
                className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40" />
              <input value={brandValues} onChange={e => setBrandValues(e.target.value)} placeholder="Values (e.g. transparent, reliable, human)"
                className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40" />
              <input value={brandPersonality} onChange={e => setBrandPersonality(e.target.value)} placeholder='Personality (e.g. "like a knowledgeable friend, not a corporate bot")'
                className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40" />
              <textarea value={brandExamples} onChange={e => setBrandExamples(e.target.value)} placeholder={'Example phrases:\n"Oops, that page wandered off" instead of "404 Not Found"\n"Let\'s get you sorted" instead of "Error, please try again"'}
                rows={3} className="w-full resize-none bg-[#f0f0f5] border border-[#ececf1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/40" />
            </div>
            <button onClick={saveBrandVoice} disabled={brandLoading || !brandTone.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
              {brandLoading ? "Rewriting copy…" : "Apply brand voice to entire app →"}
            </button>
          </div>
        </div>
      )}

      {/* Sunset modal */}
      {showSunset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSunset(false)}>
          <div className="bg-white border border-[#ececf1] rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#17171c]">🌅 App Lifecycle</h2>
              <button onClick={() => setShowSunset(false)} className="text-[#9090a0] hover:text-white text-lg leading-none">×</button>
            </div>
            {sunsetLoading && <p className="text-xs text-[#9090a0]">Analyzing app usage and lifecycle status…</p>}
            {sunsetData && !sunsetLoading && (
              <div className="space-y-4">
                <div className={`rounded-xl border px-4 py-3 ${sunsetData.recommendation === "keep" ? "border-green-400/30 bg-green-500/10" : sunsetData.recommendation === "archive" ? "border-amber-400/30 bg-amber-500/10" : "border-red-400/30 bg-red-500/10"}`}>
                  <p className="text-sm font-semibold text-[#17171c] capitalize">{sunsetData.recommendation === "keep" ? "✓ Keep active" : sunsetData.recommendation === "archive" ? "⚠ Consider archiving" : "Archive this app"}</p>
                  <p className="text-xs text-[#71717f] mt-0.5">{sunsetData.reason}</p>
                  <p className="text-[10px] text-[#9090a0] mt-1">Last updated {sunsetData.daysSinceUpdate} days ago</p>
                </div>
                {sunsetData.unusedFeatures.length > 0 && (
                  <div>
                    <p className="text-xs text-[#9090a0] font-medium mb-1.5">Possibly unused features</p>
                    {sunsetData.unusedFeatures.map((f, i) => <p key={i} className="text-xs text-[#9090a0]">· {f}</p>)}
                  </div>
                )}
                {sunsetData.cleanupActions.length > 0 && (
                  <div>
                    <p className="text-xs text-[#9090a0] font-medium mb-1.5">Cleanup checklist</p>
                    {sunsetData.cleanupActions.map((a, i) => <p key={i} className="text-xs text-[#9090a0]">☐ {a}</p>)}
                  </div>
                )}
                {sunsetData.recommendation !== "keep" && (
                  <button onClick={() => { setShowSunset(false); runGenerate(sunsetData.archivePrompt); }}
                    className="w-full rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity">
                    Add graceful shutdown page →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur transition-all ${
          toast.type === "info"
            ? "border-indigo-400/30 bg-indigo-950/90 text-indigo-200"
            : "border-green-400/30 bg-green-950/90 text-green-200"
        }`}>
          <span>{toast.type === "info" ? "⬇️" : "✓"}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── DNS Verify Modal ───────────────────────────────────────────────────────────
function DnsVerifyModal({ dnsInfo, onClose }: { dnsInfo: { domain: string; cname: string }; onClose: () => void }) {
  const [status, setStatus] = useState<"waiting" | "verified">("waiting");
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let secs = 0;
    async function check() {
      try {
        const r = await fetch(`/api/check-dns?domain=${encodeURIComponent(dnsInfo.domain)}`);
        const d = await r.json();
        if (d.verified) {
          setStatus("verified");
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch { /* ignore */ }
    }
    check();
    intervalRef.current = setInterval(() => {
      secs += 5;
      setElapsed(secs);
      check();
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [dnsInfo.domain]);

  const isApex = dnsInfo.domain.split(".").length === 2;
  const recordName = isApex ? "@" : (dnsInfo.domain.split(".").slice(0, -2).join(".") || "@");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={status === "verified" ? onClose : undefined}>
      <div className="rounded-2xl border border-[#ececf1] bg-white p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>

        {status === "verified" ? (
          <>
            <div className="text-4xl mb-3 text-center">🎉</div>
            <h2 className="text-base font-semibold text-[#17171c] mb-1 text-center">You&apos;re live!</h2>
            <p className="text-xs text-[#71717f] mb-5 text-center">
              <strong className="text-white">{dnsInfo.domain}</strong> is now pointing to your app.
            </p>
            <a href={`https://${dnsInfo.domain}`} target="_blank" rel="noreferrer"
              className="block w-full text-center rounded-xl bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white py-2.5 text-sm font-medium hover:opacity-90 transition-opacity mb-2">
              Visit {dnsInfo.domain} ↗
            </a>
            <button onClick={onClose} className="w-full text-center text-xs text-[#9090a0] hover:text-[#71717f] transition-colors py-1">
              Close
            </button>
          </>
        ) : (
          <>
            <div className="text-2xl mb-3">🌐</div>
            <h2 className="text-base font-semibold text-[#17171c] mb-1">One last step</h2>
            <p className="text-xs text-[#71717f] mb-4">
              Log into wherever you bought <strong className="text-white">{dnsInfo.domain.split(".").slice(-2).join(".")}</strong> (GoDaddy, Namecheap, Cloudflare, etc.) → find <strong className="text-white">"DNS Records"</strong> → add this:
            </p>

            <div className="rounded-xl bg-black/30 border border-[#ececf1] p-4 space-y-2.5 font-mono text-xs mb-4">
              {dnsInfo.cname === "76.76.21.21" ? (
                <>
                  <div className="flex justify-between"><span className="text-[#9090a0]">Type</span><span className="text-white">A</span></div>
                  <div className="flex justify-between"><span className="text-[#9090a0]">Name</span><span className="text-[#6a1ff7]">@</span></div>
                  <div className="flex justify-between"><span className="text-[#9090a0]">Value</span><span className="text-[#6a1ff7]">76.76.21.21</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-[#9090a0]">Type</span><span className="text-white">CNAME</span></div>
                  <div className="flex justify-between"><span className="text-[#9090a0]">Name</span><span className="text-[#6a1ff7]">{recordName}</span></div>
                  <div className="flex justify-between"><span className="text-[#9090a0]">Value</span><span className="text-[#6a1ff7]">{dnsInfo.cname}</span></div>
                </>
              )}
            </div>

            {/* Live polling status */}
            <div className="rounded-xl bg-white border border-[#ececf1] p-3 mb-4 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
              <div className="text-[11px] text-[#9090a0]">
                <span className="text-[#3a3a4a]">Checking your DNS automatically…</span>
                {elapsed > 0 && <span className="ml-1">(checked {Math.floor(elapsed / 5)}x)</span>}
                <div className="mt-0.5">This page will update the moment it&apos;s live — no need to refresh.</div>
              </div>
            </div>

            <button onClick={onClose} className="w-full text-center text-xs text-[#9090a0] hover:text-[#71717f] transition-colors py-1">
              I&apos;ll do this later
            </button>
          </>
        )}
      </div>
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
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{ issues: Array<{ severity: string; title: string; description: string; fix: string }>; score: number } | null>(null);

  async function runScan() {
    setScanLoading(true);
    setScanResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/security-scan`, { method: "POST" });
      const data = await res.json();
      setScanResult(data);
    } catch { /* ignore */ }
    setScanLoading(false);
  }

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
      <div className="rounded-2xl border border-[#ececf1] bg-white p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-[#17171c] mb-1">Publish your app</h2>
        <p className="text-xs text-[#9090a0] mb-5">Choose your subdomain on thatcode.dev</p>

        <div className="flex items-center rounded-xl border border-[#ececf1] bg-[#f0f0f5] focus-within:border-fuchsia-400/40 transition-colors overflow-hidden">
          <span className="pl-3 pr-1 text-[#9090a0] text-sm shrink-0 select-none">thatcode.dev/</span>
          <input
            value={slug}
            onChange={e => onChange(e.target.value)}
            placeholder="your-app-name"
            className="flex-1 bg-transparent py-2.5 pr-3 text-sm text-white focus:outline-none font-mono"
            autoFocus
          />
          <span className="pr-3 text-xs shrink-0">
            {checking && <span className="text-[#9090a0]">…</span>}
            {!checking && availability === "available" && <span className="text-green-600">✓</span>}
            {!checking && availability === "taken" && <span className="text-red-400">✗</span>}
          </span>
        </div>

        {availability === "taken" && <p className="mt-1.5 text-xs text-red-400">That name is already taken. Try something else.</p>}
        {availability === "available" && <p className="mt-1.5 text-xs text-green-600">Available! Your app will be at <strong>{slug}.thatcode.dev</strong></p>}
        {publishError && <p className="mt-1.5 text-xs text-red-400">{publishError}</p>}

        <button onClick={() => setShowAdvanced(v => !v)} className="mt-4 text-xs text-[#9090a0] hover:text-[#17171c] transition-colors flex items-center gap-1">
          <span>{showAdvanced ? "▾" : "▸"}</span> Advanced options
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs text-[#71717f] mb-1.5 block">Custom domain <span className="text-[#9090a0]">(optional)</span></label>
              <input
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value.trim().toLowerCase().replace(/^https?:\/\//, ""))}
                placeholder="myapp.com or app.mysite.com"
                className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6a1ff7]/40 transition-colors font-mono"
              />
              {customDomain && (
                <div className="mt-2 rounded-xl bg-white border border-[#ececf1] p-3 space-y-2 text-[11px]">
                  <p className="text-[#3a3a4a] font-medium">After publishing, you'll need to do one quick step:</p>
                  <p className="text-[#9090a0]">Log into wherever you bought <strong className="text-[#3a3a4a]">{customDomain.split(".").slice(-2).join(".")}</strong> (GoDaddy, Namecheap, Cloudflare, etc.) and add this DNS record:</p>
                  <div className="rounded-lg bg-black/30 border border-[#ececf1] p-2.5 space-y-1.5 font-mono">
                    <div className="flex justify-between gap-4">
                      <span className="text-[#9090a0]">Type</span>
                      <span className="text-white">CNAME</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#9090a0]">Name</span>
                      <span className="text-[#6a1ff7]">{customDomain.split(".").slice(0, -2).join(".") || "@"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#9090a0]">Value</span>
                      <span className="text-[#6a1ff7]">domains.thatcode.dev</span>
                    </div>
                  </div>
                  <p className="text-[#9090a0]">Usually takes 5–10 minutes to go live.</p>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-[#71717f] mb-1 block">Password protect (optional)</label>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank for public access"
                type="password"
                className="w-full bg-[#f0f0f5] border border-[#ececf1] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6a1ff7]/40 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Security scan */}
        <div className="mt-4 rounded-xl border border-[#ececf1] bg-[#fbfbfc] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#17171c]">🔒 Security Scan</p>
              <p className="text-[10px] text-[#9090a0]">Check for vulnerabilities before going live</p>
            </div>
            <button onClick={runScan} disabled={scanLoading}
              className="text-xs rounded-lg border border-[#ececf1] bg-[#f0f0f5] text-[#71717f] px-2.5 py-1 hover:bg-white/10 transition-colors disabled:opacity-40">
              {scanLoading ? "Scanning…" : scanResult ? "Re-scan" : "Scan"}
            </button>
          </div>
          {scanResult && (
            <div className="space-y-1.5">
              <div className={`flex items-center gap-2 text-xs ${scanResult.score >= 80 ? "text-green-600" : scanResult.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                <span>Score: {scanResult.score}/100</span>
                {scanResult.issues.length === 0 && <span className="text-green-600">✓ No issues found</span>}
              </div>
              {scanResult.issues.map((issue, i) => (
                <div key={i} className={`rounded-lg p-2 text-[10px] space-y-0.5 ${issue.severity === "high" ? "bg-red-500/10 border border-red-500/20" : issue.severity === "medium" ? "bg-amber-500/10 border border-amber-500/20" : "bg-[#f0f0f5] border border-[#ececf1]"}`}>
                  <p className={`font-medium ${issue.severity === "high" ? "text-red-300" : issue.severity === "medium" ? "text-amber-300" : "text-[#3a3a4a]"}`}>{issue.severity.toUpperCase()} — {issue.title}</p>
                  <p className="text-[#9090a0]">{issue.description}</p>
                  <p className="text-[#9090a0]">Fix: {issue.fix}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={() => onPublish(slug, customDomain || undefined, password || undefined)} disabled={!canPublish}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
            {publishing ? "Publishing…" : "Publish →"}
          </button>
          <button onClick={onClose} className="rounded-xl border border-[#ececf1] bg-[#f0f0f5] text-[#71717f] px-4 py-2.5 text-sm hover:bg-white/10 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
