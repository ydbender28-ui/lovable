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
  const [iframeReady, setIframeReady] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setPreviewHtml(null);
    setIframeReady(false);
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
    setIframeReady(false);
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
        background: "#0a0a0f",
      }}>
        {isMobile && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 110, height: 28, background: "#374151", borderRadius: "0 0 20px 20px", zIndex: 10 }} />}
        {/* Loading skeleton shown until iframe fires onLoad */}
        {!iframeReady && (
          <div style={{ position: "absolute", inset: 0, background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, border: "2px solid rgba(139,92,246,0.3)", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 12, color: "#4b5563" }}>Loading preview…</span>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          onLoad={() => setIframeReady(true)}
          style={{ width: "100%", height: "100%", border: "none", background: "#0a0a0f", display: "block", opacity: iframeReady ? 1 : 0, transition: "opacity 0.2s" }}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("# ")) elements.push(<h1 key={i} style={{ fontSize: 22, fontWeight: 700, color: "#f5f5f5", marginBottom: 8, marginTop: 16 }}>{line.slice(2)}</h1>);
    else if (line.startsWith("## ")) elements.push(<h2 key={i} style={{ fontSize: 17, fontWeight: 600, color: "#e5e5e5", marginBottom: 6, marginTop: 14 }}>{line.slice(3)}</h2>);
    else if (line.startsWith("### ")) elements.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 600, color: "#d4d4d4", marginBottom: 4, marginTop: 12 }}>{line.slice(4)}</h3>);
    else if (line.startsWith("- ") || line.startsWith("* ")) elements.push(<li key={i} style={{ fontSize: 13, color: "#a3a3a3", marginLeft: 16, marginBottom: 2 }}>{line.slice(2)}</li>);
    else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      elements.push(<pre key={i} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, padding: "10px 14px", fontSize: 12, color: "#86efac", overflowX: "auto", marginTop: 8, marginBottom: 8 }}>{codeLines.join("\n")}</pre>);
    } else if (line.trim() === "") elements.push(<div key={i} style={{ height: 8 }} />);
    else elements.push(<p key={i} style={{ fontSize: 13, color: "#a3a3a3", lineHeight: 1.6, marginBottom: 4 }}>{line}</p>);
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
      <div className="w-48 shrink-0 border-r border-white/10 bg-[#0c0c12] overflow-y-auto p-2 space-y-0.5">
        {fileKeys.map((f) => (
          <button key={f} onClick={() => { setActiveFile(f); setEditedContent(null); setMdPreview(false); }}
            className={`w-full text-left text-xs px-2 py-1.5 rounded truncate transition-colors ${activeFile === f ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
            {f.split("/").pop()}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-[#0c0c12] shrink-0">
          <span className="text-[10px] text-gray-500 font-mono truncate">{activeFile}</span>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {isMd && (
              <button onClick={() => setMdPreview(v => !v)} className={`text-[11px] px-2 py-0.5 rounded transition-colors ${mdPreview ? "bg-purple-500/20 text-purple-300" : "text-gray-500 hover:text-white hover:bg-white/10"}`}>
                {mdPreview ? "Source" : "Preview"}
              </button>
            )}
            {devMode && isDirty && (
              <button onClick={saveEdits} className="text-[11px] bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300 px-2 py-0.5 rounded hover:bg-fuchsia-500/30 transition-colors">
                Save
              </button>
            )}
            {saved && <span className="text-[11px] text-green-400">✓ Saved</span>}
            <button onClick={copyFile} className="text-[11px] text-gray-500 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/10">
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
            className="flex-1 overflow-auto p-4 text-xs text-gray-300 font-mono leading-relaxed bg-[#0d0d14] resize-none focus:outline-none w-full"
          />
        ) : (
          <div className="flex-1 overflow-auto bg-[#0d0d14]">
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 400 }}>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="group hover:bg-white/[0.02]">
                    <td
                      onClick={() => onLineRef?.(`${activeFile}:${idx + 1}`)}
                      className="select-none text-right pr-3 pl-3 text-[10px] text-gray-700 group-hover:text-fuchsia-400 cursor-pointer w-10 shrink-0 align-top pt-0.5"
                      style={{ userSelect: "none", verticalAlign: "top" }}
                    >
                      {idx + 1}
                    </td>
                    <td className="pl-1 pr-4 text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap break-all align-top">
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
    | { type: "architect"; pendingPrompt: string; plan: ArchitectPlan };
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

  // Fire queued prompt once loading finishes
  useEffect(() => {
    if (!loading && queuedPrompt) {
      const p = queuedPrompt;
      setQueuedPrompt(null);
      runGenerate(p);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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

  function toggleVisualEdit() {
    const next = !visualEditMode;
    setVisualEditMode(next);
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach(f => { try { f.contentWindow?.postMessage({ type: "TC_VISUAL_EDIT", enabled: next }, "*"); } catch { /**/ } });
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
      const fixPrompt = liveError
        ? `There is a JS runtime error. Fix ONLY the broken code — do not change any functionality, layout, or features. Return every file in ===FILE: path=== format. Error: ${liveError}`
        : `Fix all JavaScript errors in the current code. Common issue: CSS property names like 'uppercase', 'lowercase', 'capitalize' used as bare JS identifiers — replace each with the correct inline style e.g. textTransform:'uppercase'. Return all files in the ===FILE: path=== format.`;
      setIframeError(null);
      runGenerate(fixPrompt, undefined, "claude-sonnet-4-6", true);
      return;
    }

    // If last assistant message was asking for admin password, treat reply as password setting
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && lastMsg.content.includes("admin panel") && lastMsg.content.includes("password")) {
      const pw = trimmed.replace(/^[`'"]+|[`'"]+$/g, "").trim();
      if (pw && !pw.includes(" ")) {
        runGenerate(`Set the admin panel password to "${pw}". Update only the password check in the code, keep everything else exactly the same.`);
        return;
      }
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

      // Show design directions for visually-open prompts (landing pages, portfolios, marketing sites)
      const visualKeywords = ["landing page", "portfolio", "marketing", "homepage", "website", "blog", "agency"];
      const isVisual = visualKeywords.some(kw => trimmed.toLowerCase().includes(kw));
      if (isVisual) {
        setLoadingStatus("Generating design directions…");
        setLoading(true);
        try {
          const res = await fetch(`/api/projects/${projectId}/design-directions`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: trimmed }),
          });
          const data = await res.json();
          if (data.directions?.length > 0) {
            setLoading(false);
            setFlow({ type: "designpick", pendingPrompt: trimmed, directions: data.directions });
            return;
          }
        } catch { /* ignore */ }
        setLoading(false);
      }
    }
    // Architect mode: show plan before building (only for first build or complex edits)
    if (architectMode && messages.length === 0) {
      setLoading(true);
      setLoadingStatus("Creating implementation plan…");
      try {
        const res = await fetch(`/api/projects/${projectId}/architect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

    runGenerate(trimmed);
  }

  async function runGenerate(text: string, extraEnv?: EnvVars, forceModel?: string, silent?: boolean) {
    setFlow({ type: "idle" });
    setSuggestions([]);
    setShowUndo(false);

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
        body: JSON.stringify({ prompt: fullText, envVars: mergedEnv, forceModel, ...imgPayload }),
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
              // Auto preview switching based on prompt keywords
              const pl = text.toLowerCase();
              if (/mobile app|phone app|ios app|android app|smartphone/.test(pl)) setPreviewMode("mobile");
              else if (/tablet|ipad/.test(pl)) setPreviewMode("tablet");
              else if (/dashboard|admin panel|analytics|desktop/.test(pl)) setPreviewMode("desktop");
              const meta = payload.modelUsed
                ? `\n\n_${payload.modelUsed} · ${payload.complexity ?? ""} · $${(payload.estimatedCostUsd ?? 0).toFixed(4)}_`
                : "";
              const liveNote = payload.liveUpdated ? "\n\n✓ Live site updated automatically." : "";
              const summary = silent
                ? "✓ Error fixed automatically." + (payload.liveUpdated ? "\n\n✓ Live site updated." : "")
                : (payload.summary ?? "Done! Check the preview.") + meta + liveNote;
              setMessages((prev) => {
                const msgs: typeof prev = [...prev, {
                  id: payload.tempMessageId ?? `msg-${Date.now()}`,
                  role: "assistant",
                  content: summary,
                }];
                // If the app has an admin panel and no password was specified, ask inline
                const htmlContent = Object.values(payload.files as Record<string, string>).join("\n");
                const hasAdmin = /admin\s*(login|panel|view|password|auth)|password.*===|===.*password|checkPass|verifyPass|adminPw|adminPass|isAdmin.*state|setIsAdmin|Admin Login/i.test(htmlContent);
                const userSpecifiedPassword = /password[:\s"']+\w{3,}|pass(word)?[:\s"']+\w{3,}/i.test(text);
                if (hasAdmin && !userSpecifiedPassword && !silent) {
                  msgs.push({
                    id: `msg-adminpw-${Date.now()}`,
                    role: "assistant",
                    content: "🔑 Your app has an admin panel. What password do you want to use? (Reply with just the password, e.g. `MySecret123`)",
                  });
                }
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
              // Load proactive AI suggestions asynchronously
              setProactiveSuggestions([]);
              setProactiveLoading(true);
              fetch(`/api/projects/${projectId}/proactive-plan`, { method: "POST" })
                .then(r => r.json())
                .then(d => { if (d.suggestions?.length) { setProactiveSuggestions(d.suggestions); setProactiveAppType(d.appType ?? null); } })
                .catch(() => {})
                .finally(() => setProactiveLoading(false));
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
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <p className="text-xs font-medium text-white">Choose a design direction</p>
        <div className="space-y-2">
          {f.directions.map((d, i) => (
            <button key={i} onClick={() => {
              setFlow({ type: "idle" });
              runGenerate(`${f.pendingPrompt}\n\nDesign direction: ${d.name} — ${d.description}. Use this color palette: background ${d.bg}, accent ${d.accent}, text ${d.text}. Style: ${d.style}.`);
            }}
              className="w-full text-left rounded-xl border border-white/10 hover:border-fuchsia-400/30 bg-white/[0.02] hover:bg-fuchsia-500/5 p-3 transition-all group">
              <div className="flex items-start gap-3">
                <div className="flex gap-1 shrink-0 mt-0.5">
                  {[d.bg, d.accent, d.text].map((c, j) => (
                    <div key={j} className="h-4 w-4 rounded-full border border-white/10" style={{ background: c }} />
                  ))}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white group-hover:text-fuchsia-200">{d.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{d.style}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{d.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => { setFlow({ type: "idle" }); runGenerate(f.pendingPrompt); }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Skip — let AI choose →
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
          <p className="text-sm font-medium text-white">{plan.title}</p>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{plan.overview}</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Components", items: plan.components },
            { label: "Data models", items: plan.dataModels },
            { label: "Features", items: plan.features },
            { label: "Considerations", items: plan.considerations },
          ].filter(s => s.items?.length > 0).map(section => (
            <div key={section.label} className="rounded-lg bg-white/[0.03] border border-white/10 p-2.5 space-y-1">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{section.label}</p>
              {section.items.map((item, i) => (
                <p key={i} className="text-[11px] text-gray-300">· {item}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => { setFlow({ type: "idle" }); runGenerate(pendingPrompt); }}
            className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-semibold py-2 hover:opacity-90 transition-opacity">
            Build this plan →
          </button>
          <button onClick={() => setFlow({ type: "idle" })}
            className="text-xs text-gray-500 hover:text-gray-300 px-2 transition-colors">
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

  // ── Knowledge panel ────────────────────────────────────────────────────────────
  const knowledgePanel = showKnowledge && (
    <div className="absolute inset-0 z-20 bg-[#0c0c12] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <span className="text-sm font-medium text-white">📚 Custom Knowledge</span>
        <button onClick={() => setShowKnowledge(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-xs text-gray-500">Add context the AI should always remember — brand colors, tech stack preferences, coding conventions, business rules.</p>
        {knowledge.map(k => (
          <div key={k.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white">{k.title}</span>
              <div className="flex gap-2">
                <button onClick={() => setKnowledgeDraft(k)} className="text-xs text-gray-500 hover:text-fuchsia-300">Edit</button>
                <button onClick={() => saveKnowledge(knowledge.filter(x => x.id !== k.id))} className="text-xs text-gray-500 hover:text-red-400">Delete</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">{k.content}</p>
          </div>
        ))}
        {knowledgeDraft ? (
          <div className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/5 p-3 space-y-2">
            <input
              value={knowledgeDraft.title}
              onChange={e => setKnowledgeDraft({ ...knowledgeDraft, title: e.target.value })}
              placeholder="Title (e.g. Brand Colors, Tech Stack)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40"
            />
            <textarea
              value={knowledgeDraft.content}
              onChange={e => setKnowledgeDraft({ ...knowledgeDraft, content: e.target.value })}
              placeholder="Describe the convention, rule, or context..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => {
                const existing = knowledge.find(x => x.id === knowledgeDraft.id);
                const updated = existing
                  ? knowledge.map(x => x.id === knowledgeDraft.id ? knowledgeDraft : x)
                  : [...knowledge, knowledgeDraft];
                saveKnowledge(updated);
                setKnowledgeDraft(null);
              }} className="text-xs bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300 px-3 py-1.5 rounded-lg hover:bg-fuchsia-500/30 transition-colors">Save</button>
              <button onClick={() => setKnowledgeDraft(null)} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setKnowledgeDraft({ id: `k-${Date.now()}`, title: "", content: "" })}
            className="w-full text-xs rounded-xl border border-dashed border-white/10 text-gray-500 hover:border-fuchsia-400/30 hover:text-fuchsia-300 py-3 transition-colors">
            + Add knowledge
          </button>
        )}
      </div>
    </div>
  );

  // ── Chat panel ─────────────────────────────────────────────────────────────────
  const chatPanel = (
    <div className="flex flex-col h-full bg-[#0c0c12] relative">
      {knowledgePanel}
      {/* Mode toggle */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 shrink-0">
        <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-[11px]">
          <button onClick={() => setChatMode(false)}
            className={`px-3 py-1 rounded-md transition-colors ${!chatMode ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>
            Build
          </button>
          <button onClick={() => setChatMode(true)}
            className={`px-3 py-1 rounded-md transition-colors ${chatMode ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>
            Chat
          </button>
        </div>
        <button onClick={() => setArchitectMode(v => !v)} title="Architect mode: AI plans before building"
          className={`text-xs rounded-lg border px-2 py-1 transition-colors ${architectMode ? "border-purple-400/40 bg-purple-500/10 text-purple-300" : "border-white/10 bg-white/[0.03] text-gray-500 hover:text-purple-300 hover:border-purple-400/30"}`}>
          🏗️
        </button>
        <button onClick={() => setSelfVerify(v => !v)} title="Self-verify: auto-test and fix after each build"
          className={`text-xs rounded-lg border px-2 py-1 transition-colors ${selfVerify ? "border-green-400/40 bg-green-500/10 text-green-300" : "border-white/10 bg-white/[0.03] text-gray-500 hover:text-green-300 hover:border-green-400/30"}`}>
          🔬
        </button>
        <button onClick={() => { setShowAnalytics(true); loadAnalytics(); }} title="Analytics — pageviews, rage-clicks, engagement"
          className="text-xs rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 hover:text-blue-300 hover:border-blue-400/30 px-2 py-1 transition-colors">
          📊
        </button>
        <button onClick={() => { setShowCompliance(true); runCompliance(); }} title="Legal compliance — GDPR, HIPAA, CCPA"
          className="text-xs rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 hover:text-amber-300 hover:border-amber-400/30 px-2 py-1 transition-colors">
          ⚖️
        </button>
        <button onClick={() => { setShowCloneUrl(true); setCloneError(null); }} title="Build inspired by a URL"
          className="text-xs rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 hover:text-cyan-300 hover:border-cyan-400/30 px-2 py-1 transition-colors">
          🔍
        </button>
        <button onClick={() => setShowMerge(true)} title="Merge another project into this one"
          className="text-xs rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 hover:text-orange-300 hover:border-orange-400/30 px-2 py-1 transition-colors">
          ⚡
        </button>
        <button onClick={() => { setShowLoadTest(true); runLoadTest(); }} title="AI load test — find performance bottlenecks"
          className="text-xs rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 hover:text-indigo-300 hover:border-indigo-400/30 px-2 py-1 transition-colors">
          🏋️
        </button>
        <button onClick={() => { setShowRedTeam(true); runRedTeam(); }} title="Adversarial red team — AI security hacker"
          className="text-xs rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 hover:text-red-300 hover:border-red-400/30 px-2 py-1 transition-colors">
          🔴
        </button>
        <button onClick={() => { setShowRevenue(true); runRevenueModel(); }} title="Revenue model — monetization strategy"
          className="text-xs rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 hover:text-emerald-300 hover:border-emerald-400/30 px-2 py-1 transition-colors">
          💰
        </button>
        <button onClick={() => setShowBrandVoice(true)} title="Brand voice — consistent copy tone"
          className="text-xs rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 hover:text-pink-300 hover:border-pink-400/30 px-2 py-1 transition-colors">
          🎭
        </button>
        <button onClick={() => { setShowSunset(true); runSunset(); }} title="App lifecycle — sunset analysis"
          className="text-xs rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 hover:text-gray-300 hover:border-gray-400/30 px-2 py-1 transition-colors">
          🌅
        </button>
        <button onClick={() => setShowKnowledge(true)} title="Custom knowledge"
          className="ml-auto text-xs rounded-lg border border-white/10 bg-white/[0.03] text-gray-500 hover:text-fuchsia-300 hover:border-fuchsia-400/30 px-2 py-1 transition-colors">
          📚 {knowledge.length > 0 ? knowledge.length : ""}
        </button>
      </div>
      {chatMode && (
        <div className="px-3 pb-1 shrink-0">
          <p className="text-[10px] text-gray-600">Chat mode — discuss your app without generating code</p>
        </div>
      )}
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

        <DesignPickCard />
        <ArchitectCard />
        <ClarifyCard />
        <ApiKeyCard />

        {/* Proactive AI suggestions */}
        {proactiveSuggestions.length > 0 && !loading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-purple-400 font-medium">🧠 What you&apos;ll need next</span>
              {proactiveAppType && <span className="text-[10px] text-gray-600">· {proactiveAppType}</span>}
            </div>
            {proactiveSuggestions.map((s, i) => (
              <button key={i} onClick={() => { setProactiveSuggestions([]); runGenerate(s.prompt); }}
                className="w-full text-left rounded-xl border border-purple-400/15 bg-purple-500/5 hover:border-purple-400/30 hover:bg-purple-500/10 p-3 transition-colors">
                <p className="text-xs font-medium text-purple-200">{s.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.description}</p>
              </button>
            ))}
          </div>
        )}
        {proactiveLoading && (
          <div className="flex items-center gap-2 text-[10px] text-purple-500/60">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            Analyzing what you&apos;ll need next…
          </div>
        )}
        {verifying && (
          <div className="flex items-center gap-2 text-[10px] text-green-500/80">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Running automated UX verification…
          </div>
        )}

        {chatStreaming && (
          <div className="rounded-2xl rounded-bl-sm bg-white/5 border border-white/10 px-3.5 py-2.5 max-w-[92%]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="h-4 w-4 rounded bg-gradient-to-br from-fuchsia-500 to-indigo-500 shrink-0" />
              <span className="text-xs font-medium text-fuchsia-300">AI</span>
            </div>
            <span className="text-xs text-gray-200 whitespace-pre-wrap">{chatStreamContent || "..."}</span>
          </div>
        )}
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
            <button onClick={() => setRefUrl("")} className="text-gray-600 hover:text-gray-400 ml-auto">×</button>
          </div>
        </div>
      )}

      {/* Line reference */}
      {lineRef && (
        <div className="px-3 pt-1 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-purple-400 bg-purple-500/10 border border-purple-400/20 rounded-lg px-2.5 py-1">
            <span>📍 {lineRef}</span>
            <button onClick={() => setLineRef(null)} className="text-gray-600 hover:text-gray-400 ml-auto">×</button>
          </div>
        </div>
      )}

      {/* CSV data indicator */}
      {csvData && (
        <div className="px-3 pt-1 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-green-400 bg-green-500/10 border border-green-400/20 rounded-lg px-2.5 py-1">
            <span>📊 CSV data ready ({csvData.split("\n").length} rows)</span>
            <button onClick={() => setCsvData(null)} className="text-gray-600 hover:text-gray-400 ml-auto">×</button>
          </div>
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
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chatMode ? handleChatSend() : handleSend(); } }}
            onPaste={handleImagePaste}
            placeholder="Describe what to build or change… paste a screenshot too"
            rows={3}
            className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
          />
          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <div className="flex items-center gap-0.5">
              <button onClick={() => csvInputRef.current?.click()} title="Import CSV data — AI builds around your real data"
                className="text-gray-500 hover:text-green-300 transition-colors p-1.5 rounded-lg hover:bg-white/5 text-xs font-medium">
                CSV
              </button>
              <button onClick={() => fileInputRef.current?.click()} title="Upload screenshot or image"
                className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-white/5 text-sm">
                📎
              </button>
              <button onClick={() => { setShowImageGen(true); setImageGenResult(null); setImageGenError(null); }} title="Generate an image with AI"
                className="text-gray-500 hover:text-fuchsia-300 transition-colors p-1.5 rounded-lg hover:bg-white/5 text-sm">
                🎨
              </button>
              <button onClick={() => { setShowFigma(true); setFigmaError(null); }} title="Import from Figma"
                className="text-gray-500 hover:text-fuchsia-300 transition-colors p-1.5 rounded-lg hover:bg-white/5 text-xs font-medium">
                Fig
              </button>
              <button onClick={async () => {
                const text = await navigator.clipboard.readText().catch(() => "");
                if (text.startsWith("http")) setRefUrl(text);
                else { const u = window.prompt("Paste a URL to use as reference:"); if (u?.startsWith("http")) setRefUrl(u); }
              }} title="Add URL as reference (paste URL from clipboard)"
                className="text-gray-500 hover:text-blue-300 transition-colors p-1.5 rounded-lg hover:bg-white/5 text-xs font-medium">
                🔗
              </button>
              <button onClick={handleEnhancePrompt} disabled={!prompt.trim() || enhancing} title="AI improves your prompt">
                <span className={`text-sm p-1.5 rounded-lg block transition-colors ${!prompt.trim() || enhancing ? "text-gray-700" : "text-gray-500 hover:text-fuchsia-300 hover:bg-white/5"}`}>
                  {enhancing ? "⏳" : "✨"}
                </span>
              </button>
              <button onClick={toggleVoice} title={voiceActive ? "Stop voice input" : "Voice input"}
                className={`transition-colors p-1.5 rounded-lg text-sm ${voiceActive ? "text-red-400 bg-red-500/10 animate-pulse" : "text-gray-500 hover:text-fuchsia-300 hover:bg-white/5"}`}>
                🎤
              </button>
              {lastPrompt && !loading && (
                <button onClick={() => runGenerate(lastPrompt)} title="Regenerate last prompt"
                  className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-white/5 text-sm">
                  ↺
                </button>
              )}
              <span className="text-[10px] text-gray-700 pl-1 hidden sm:block">⌘K</span>
            </div>
            <button onClick={chatMode ? handleChatSend : handleSend} disabled={(chatMode ? chatStreaming : loading) || !prompt.trim()}
              className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
              {chatMode ? (chatStreaming ? "Thinking..." : "Send") : (loading ? "Generating..." : "Send")}
            </button>
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
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 bg-[#0d0d14] shrink-0">
        {(["preview", "code"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>
            {tab === "preview" ? "Preview" : "Code"}
          </button>
        ))}
        {activeTab === "code" && (
          <button onClick={() => setDevModeEnabled(v => !v)} title="Dev Mode — edit code directly"
            className={`ml-1 text-xs rounded-lg border px-2.5 py-1 transition-colors ${devModeEnabled ? "border-amber-400/40 bg-amber-500/10 text-amber-300" : "border-white/10 bg-white/[0.03] text-gray-500 hover:text-gray-300"}`}>
            {devModeEnabled ? "✏️ Editing" : "✏️ Dev Mode"}
          </button>
        )}

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

        {hasFiles && activeTab === "preview" && (
          <button onClick={toggleVisualEdit} title="Click any element to edit it"
            className={`ml-2 text-xs rounded-lg border px-2.5 py-1 transition-colors flex items-center gap-1.5 ${visualEditMode ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-300" : "border-white/10 bg-white/[0.03] text-gray-500 hover:text-gray-300"}`}>
            <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086zM11.189 6.25 9.75 4.81l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.249.249 0 0 0 .108-.064l6.286-6.286z"/></svg>
            {visualEditMode ? "Click element…" : "Visual Edit"}
          </button>
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
            : <CodeViewer files={files} devMode={devModeEnabled} onSaveFiles={(updated) => { setFiles(updated); }} onLineRef={(ref) => { setLineRef(ref); setActiveTab("preview"); setMobileTab("chat"); setTimeout(() => textareaRef.current?.focus(), 100); }} />
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
            onClick={() => { setShowSupabase(true); loadSupabaseStatus(); }}
            title="Built-in database & auth"
            className={`text-xs rounded-lg border px-2.5 py-1.5 transition-colors hidden sm:flex items-center gap-1.5 ${supabaseStatus?.enabled ? "border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20" : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"}`}>
            🗄️ {supabaseStatus?.enabled ? "Database ✓" : "Database"}
          </button>
          <button
            onClick={() => setShowIntegrations(true)}
            title="Integrations"
            className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-400 px-2.5 py-1.5 hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1.5">
            🔌 Integrations
          </button>
          <button
            onClick={() => { setShowHistory(true); handleLoadVersions(true); }}
            title="Version history"
            className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-400 px-2.5 py-1.5 hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1">
            ⏱ History
          </button>

          {hasFiles && (
            <button onClick={() => { setShowUserTest(true); setUserTestResult(null); }} title="Run synthetic user testing"
              className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-400 px-2.5 py-1.5 hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1">
              🧪 Test
            </button>
          )}
          {hasFiles && (
            <button onClick={() => { setShowMonetize(true); setMonetizePlan(null); }} title="One-prompt monetization"
              className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-400 px-2.5 py-1.5 hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1">
              💰 Monetize
            </button>
          )}
          {hasFiles && (
            <button onClick={() => { setShowShareModal(true); setShareLink(null); }} title="Share preview link (7 days, public)"
              className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-400 px-2.5 py-1.5 hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1">
              🔗 Share
            </button>
          )}
          {publishUrl ? (
            <div className="flex items-center gap-1.5">
              <button onClick={() => handlePublish(publishSlug ?? undefined)} disabled={!hasFiles || publishing}
                className="text-xs rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300 px-3 py-1.5 hover:bg-fuchsia-500/20 transition-colors disabled:opacity-40 flex items-center gap-1.5">
                {publishing ? <><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse" />Updating...</>
                  : publishedFilesHash && hashFiles(files) !== publishedFilesHash
                    ? <><span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />Update</>
                    : liveUpdated ? "Updated ✓" : "Update"}
              </button>
              <a href={publishUrl} target="_blank" rel="noreferrer"
                className="text-xs rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 px-3 py-1.5 hover:bg-green-500/20 transition-colors">Live ↗</a>
              <button onClick={() => navigator.clipboard.writeText(publishUrl ?? "")}
                className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-300 px-2 py-1.5 hover:bg-white/10 hidden sm:block">Copy</button>
              <button onClick={handleUnpublish} className="text-xs text-gray-500 hover:text-red-400 px-1 py-1.5 transition-colors">×</button>
            </div>
          ) : (
            <button onClick={() => setShowPublishDialog(true)} disabled={!hasFiles || publishing}
              className="text-xs rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300 px-3 py-1.5 hover:bg-fuchsia-500/20 transition-colors disabled:opacity-40 flex items-center gap-1.5 relative">
              {publishing ? <><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse" />Publishing...</> : <>Publish {hasFiles && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />}</>}
            </button>
          )}
          <button onClick={exportHtml} disabled={!hasFiles}
            className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-300 px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-40 hidden sm:block">
            HTML
          </button>
          <button onClick={() => { setShowGithub(true); setGithubResult(null); }} disabled={!hasFiles}
            className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-300 px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-40 hidden sm:flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
            GitHub
          </button>
          <a href={hasFiles ? `/api/projects/${projectId}/export-app` : undefined}
            download
            className={`text-xs rounded-lg border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 px-3 py-1.5 hover:bg-indigo-500/20 transition-colors hidden sm:block ${!hasFiles ? "pointer-events-none opacity-40" : ""}`}>
            📱 Export App
          </a>
          <Link href="/settings" title="Settings & Labs"
            className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-400 px-2.5 py-1.5 hover:bg-white/10 transition-colors hidden sm:flex items-center">
            ⚙️
          </Link>
        </div>
      </header>

      {/* Desktop */}
      <div className="hidden sm:flex flex-1 overflow-hidden">
        <div className="w-[340px] flex flex-col border-r border-white/10 shrink-0">{chatPanel}</div>
        <div className="flex-1 overflow-hidden">{previewPanel}</div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden flex flex-col overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
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
      {dnsInfo && <DnsVerifyModal dnsInfo={dnsInfo} onClose={() => setDnsInfo(null)} />}

      {/* User testing modal */}
      {showUserTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowUserTest(false)}>
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">🧪 Synthetic User Testing</h2>
              <button onClick={() => setShowUserTest(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-gray-500">AI simulates real users clicking through your app and reports back issues — before any real user sees it.</p>
            {!userTestResult && (
              <button onClick={handleUserTest} disabled={userTestLoading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
                {userTestLoading ? "Testing… (15-20s)" : "Run User Test →"}
              </button>
            )}
            {userTestResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl font-bold ${userTestResult.overallScore >= 80 ? "text-green-400" : userTestResult.overallScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
                    {userTestResult.overallScore}/100
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Usability Score</p>
                    <p className="text-xs text-gray-500">{userTestResult.testers.filter(t => t.verdict === "passed").length}/{userTestResult.testers.length} testers completed their goal</p>
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
                    <p className="text-xs font-semibold text-green-400">Quick wins</p>
                    {userTestResult.quickWins.map((win, i) => (
                      <p key={i} className="text-xs text-green-300/80">· {win}</p>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  {userTestResult.testers.map((t, i) => (
                    <div key={i} className={`rounded-xl border p-3 space-y-2 ${t.verdict === "passed" ? "border-green-500/20 bg-green-500/5" : t.verdict === "confused" ? "border-amber-500/20 bg-amber-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-white">{t.persona}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${t.verdict === "passed" ? "bg-green-500/20 text-green-300" : t.verdict === "confused" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>
                          {t.verdict}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">Goal: {t.goal}</p>
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
                    className="flex-1 text-xs rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300 py-2 hover:bg-fuchsia-500/30 transition-colors">
                    Fix all issues →
                  </button>
                  <button onClick={handleUserTest} disabled={userTestLoading}
                    className="text-xs rounded-xl border border-white/10 bg-white/5 text-gray-400 px-3 py-2 hover:bg-white/10 transition-colors">
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
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">💰 One-Prompt Monetization</h2>
              <button onClick={() => setShowMonetize(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-gray-500">Describe your pricing model and we&apos;ll wire up Stripe — pricing page, checkout, trials, webhooks — all from one sentence.</p>
            <textarea
              value={monetizeDesc}
              onChange={e => setMonetizeDesc(e.target.value)}
              placeholder='e.g. "Charge $19/month, 14-day free trial. Team plan $49/month for up to 5 users. Annual gets 20% off."'
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40 resize-none"
            />
            {monetizePlan ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3">
                  <p className="text-xs text-green-300">✓ {monetizePlan.summary}</p>
                </div>
                <button onClick={() => { setShowMonetize(false); runGenerate(monetizePlan.buildPrompt); }}
                  className="w-full text-sm rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-semibold py-2.5 hover:opacity-90 transition-opacity">
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
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">🔗 Share Preview</h2>
              <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-gray-500">Create a public view-only link to your current build. Valid for 7 days, no login required.</p>
            {shareLink ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-green-300 font-mono break-all">{shareLink}</div>
                <p className="text-[10px] text-green-500">✓ Copied to clipboard</p>
                <button onClick={() => navigator.clipboard.writeText(shareLink)} className="w-full text-xs rounded-xl border border-white/10 bg-white/5 text-gray-300 py-2 hover:bg-white/10 transition-colors">
                  Copy again
                </button>
              </div>
            ) : (
              <button onClick={handleCreateShareLink} disabled={shareLoading}
                className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
                {shareLoading ? "Creating link…" : "Create share link →"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Figma import modal */}
      {showFigma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowFigma(false)}>
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Import from Figma</h2>
              <button onClick={() => setShowFigma(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-gray-500">Paste a Figma file link and your personal access token to build from your design.</p>
            <div className="space-y-2">
              <input value={figmaUrl} onChange={e => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/file/..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
              <input type="password" value={figmaToken} onChange={e => setFigmaToken(e.target.value)}
                placeholder="Figma personal access token (figd_...)"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40 font-mono" />
              <p className="text-[10px] text-gray-600">Get your token: figma.com → Account → Personal access tokens</p>
            </div>
            {figmaError && <p className="text-xs text-red-400">{figmaError}</p>}
            <button onClick={handleFigmaImport} disabled={figmaLoading || !figmaUrl.trim() || !figmaToken.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
              {figmaLoading ? "Reading design…" : "Import & Build →"}
            </button>
          </div>
        </div>
      )}

      {/* Supabase database modal */}
      {showSupabase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSupabase(false)}>
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">🗄️ Built-in Database</h2>
              <button onClick={() => setShowSupabase(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            {supabaseStatus?.enabled ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3 text-sm">
                  ✓ Database is active
                </div>
                <p className="text-xs text-gray-500">Your app has a real Postgres database with authentication. Credentials are already injected into your project — just ask the AI to use Supabase for data storage.</p>
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">URL</span>
                    <button onClick={() => navigator.clipboard.writeText(supabaseStatus.url ?? "")} className="text-[10px] text-gray-500 hover:text-gray-300">Copy</button>
                  </div>
                  <p className="text-xs text-gray-300 font-mono truncate">{supabaseStatus.url}</p>
                </div>
                <button onClick={() => runGenerate("Add Supabase database integration. The SUPABASE_URL and SUPABASE_ANON_KEY are already available in window.ENV. Use the Supabase JS client (import from CDN: https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm) to replace localStorage with real database storage for all data. Add Supabase auth if the app has user accounts.")}
                  className="w-full text-xs rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300 py-2.5 hover:bg-fuchsia-500/30 transition-colors">
                  Connect database to app →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 leading-relaxed">Enable a real Postgres database with authentication for your app. No setup required — we provision it automatically.</p>
                <div className="space-y-2 text-xs text-gray-500">
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
                <p className="text-[10px] text-gray-600 text-center">Free tier • No credit card required</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image generation modal */}
      {showImageGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowImageGen(false)}>
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">🎨 Generate Image</h2>
              <button onClick={() => setShowImageGen(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-gray-500">Describe the image you need. It will be generated and added to your app.</p>
            <textarea
              value={imageGenPrompt}
              onChange={e => setImageGenPrompt(e.target.value)}
              placeholder="A minimalist product photo of wireless headphones on a white background..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40 resize-none"
            />
            {imageGenResult && (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageGenResult} alt="Generated" className="w-full rounded-xl border border-white/10" />
                <button onClick={() => {
                  runGenerate(`Add this image to the app. Use this URL as an <img> src: ${imageGenResult}`);
                  setShowImageGen(false);
                }}
                  className="w-full text-xs rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300 py-2 hover:bg-fuchsia-500/30 transition-colors">
                  Add to app →
                </button>
                <button onClick={() => { navigator.clipboard.writeText(imageGenResult); }}
                  className="w-full text-xs rounded-xl border border-white/10 text-gray-400 py-2 hover:bg-white/5 transition-colors">
                  Copy URL
                </button>
              </div>
            )}
            {imageGenError && <p className="text-xs text-red-400">{imageGenError}</p>}
            <button onClick={handleGenerateImage} disabled={imageGenLoading || !imageGenPrompt.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40">
              {imageGenLoading ? "Generating… (10-20s)" : "Generate →"}
            </button>
          </div>
        </div>
      )}

      {/* GitHub export modal */}
      {showGithub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowGithub(false)}>
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <svg viewBox="0 0 16 16" className="h-4 w-4 fill-white"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
                Export to GitHub
              </h2>
              <button onClick={() => setShowGithub(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            {githubResult?.repoUrl ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3 text-sm">
                  ✓ Exported successfully!
                </div>
                <a href={githubResult.repoUrl} target="_blank" rel="noreferrer"
                  className="block text-center text-sm text-fuchsia-300 hover:text-fuchsia-200 border border-fuchsia-400/30 rounded-xl py-2.5 hover:bg-fuchsia-500/5 transition-colors">
                  View on GitHub ↗
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Create a GitHub Personal Access Token with <code className="text-gray-400">repo</code> scope at github.com/settings/tokens</p>
                <div className="space-y-2">
                  <input type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)}
                    placeholder="GitHub token (ghp_...)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40 font-mono" />
                  <input value={githubRepo} onChange={e => setGithubRepo(e.target.value)}
                    placeholder="Repository name (e.g. my-app)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
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
                  <div key={v.id} className={`rounded-xl border p-3 space-y-2 ${v.bookmarked ? "border-amber-400/30 bg-amber-500/5" : "border-white/10 bg-white/[0.03]"}`}>
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full">Latest</span>}
                      <button onClick={() => toggleBookmark(v.id, !!v.bookmarked)} title={v.bookmarked ? "Remove bookmark" : "Bookmark"}
                        className={`text-sm leading-none transition-colors ${v.bookmarked ? "text-amber-400" : "text-gray-600 hover:text-amber-300"}`}>
                        {v.bookmarked ? "★" : "☆"}
                      </button>
                      <span className="text-[10px] text-gray-500 ml-auto">{new Date(v.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-[11px] text-gray-400">{v.modelUsed ?? "Unknown model"}</p>
                    {v.bookmarkNote && <p className="text-[10px] text-amber-300/70 italic">{v.bookmarkNote}</p>}
                    {i > 0 && (
                      <div className="space-y-1">
                        <button onClick={async () => {
                          const res = await fetch(`/api/projects/${projectId}/versions/${v.id}/explain`, { method: "POST" });
                          const data = await res.json();
                          if (data.explanation) alert(data.explanation);
                        }}
                          className="text-[11px] rounded-lg border border-white/10 bg-white/5 text-gray-500 px-2.5 py-1 hover:bg-white/10 transition-colors w-full">
                          What changed?
                        </button>
                        <button onClick={() => handleRestoreVersion(v.id)}
                          className="text-[11px] rounded-lg border border-white/10 bg-white/5 text-gray-300 px-2.5 py-1 hover:bg-white/10 transition-colors w-full">
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
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">📊 Analytics (last 7 days)</h2>
              <button onClick={() => setShowAnalytics(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            {analyticsLoading && <p className="text-xs text-gray-500">Loading…</p>}
            {analyticsData && !analyticsLoading && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Pageviews", value: analyticsData.pageviews, color: "text-blue-300" },
                    { label: "Clicks", value: analyticsData.clicks, color: "text-green-300" },
                    { label: "Rage-clicks", value: analyticsData.rageclicks, color: "text-red-300" },
                    { label: "Form Submits", value: analyticsData.formSubmits, color: "text-purple-300" },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                {analyticsData.topRageClicks.length > 0 && (
                  <div>
                    <p className="text-xs text-red-400 font-medium mb-2">🔥 Rage-click hotspots</p>
                    {analyticsData.topRageClicks.map(r => (
                      <div key={r.el} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                        <span className="text-gray-400 truncate">{r.el}</span>
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
                  <p className="text-xs text-gray-600">No data yet. Publish your app to start tracking visitors.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance modal */}
      {showCompliance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCompliance(false)}>
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">⚖️ Legal Compliance Check</h2>
              <button onClick={() => setShowCompliance(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            {complianceLoading && <p className="text-xs text-gray-500">Analyzing your app for compliance requirements…</p>}
            {complianceData && !complianceLoading && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {complianceData.applicableLaws.map(law => (
                    <span key={law} className="text-xs rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-300 px-2.5 py-1">{law}</span>
                  ))}
                </div>
                {complianceData.issues.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-500 font-medium">Issues found:</p>
                    {complianceData.issues.map((issue, i) => (
                      <div key={i} className="text-xs text-gray-400 flex gap-2">
                        <span className="text-amber-400 shrink-0">⚠</span>
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
                {complianceData.issues.length === 0 && (
                  <p className="text-xs text-green-400">✓ No major compliance issues detected.</p>
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
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">🔍 Build inspired by a URL</h2>
              <button onClick={() => setShowCloneUrl(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-gray-500">Paste any public URL — AI analyzes its structure and builds you something inspired by it (original design, no copyright issues).</p>
            <input value={cloneUrl} onChange={e => setCloneUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
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
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">⚡ Merge Another Project</h2>
              <button onClick={() => setShowMerge(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-gray-500">Paste the project ID of another app you own. AI will merge both apps into one unified experience.</p>
            <input value={mergeProjectId} onChange={e => setMergeProjectId(e.target.value)}
              placeholder="Project ID (from the URL: /projects/abc123)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40 font-mono text-xs" />
            <textarea value={mergeGoal} onChange={e => setMergeGoal(e.target.value)}
              placeholder="Describe the merge goal (optional) — e.g. 'Add the blog section from my other app into this dashboard'"
              rows={3}
              className="w-full resize-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
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
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">🏋️ AI Load Test</h2>
              <button onClick={() => setShowLoadTest(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            {loadTestLoading && <p className="text-xs text-gray-500">Simulating 10,000 users across your app flows…</p>}
            {loadTestData && !loadTestLoading && (
              <div className="space-y-4">
                <p className="text-xs text-gray-400">⚠ Estimated crash point: <span className="text-red-300">{loadTestData.estimatedCrashPoint}</span></p>
                <div className="space-y-2">
                  {loadTestData.bottlenecks.map((b, i) => (
                    <div key={i} className={`rounded-xl border p-3 space-y-1 ${b.severity === "critical" ? "border-red-500/30 bg-red-500/5" : b.severity === "high" ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-white/5"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium uppercase rounded px-1.5 py-0.5 ${b.severity === "critical" ? "bg-red-500/20 text-red-300" : b.severity === "high" ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-gray-400"}`}>{b.severity}</span>
                        <span className="text-xs text-gray-300">{b.location}</span>
                      </div>
                      <p className="text-xs text-gray-500">{b.issue}</p>
                      <p className="text-xs text-green-400">Fix: {b.fix}</p>
                    </div>
                  ))}
                </div>
                {loadTestData.bottlenecks.length > 0 && (
                  <button onClick={() => { setShowLoadTest(false); runGenerate(loadTestData.buildPrompt); }}
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity">
                    Fix all performance issues →
                  </button>
                )}
                {loadTestData.bottlenecks.length === 0 && <p className="text-xs text-green-400">✓ No major performance issues found.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Red team modal */}
      {showRedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowRedTeam(false)}>
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">🔴 Adversarial Red Team</h2>
              <button onClick={() => setShowRedTeam(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            {redTeamLoading && <p className="text-xs text-gray-500">AI is attempting to break your app like a real attacker…</p>}
            {redTeamData && !redTeamLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl font-bold ${redTeamData.securityScore >= 80 ? "text-green-400" : redTeamData.securityScore >= 60 ? "text-amber-400" : "text-red-400"}`}>{redTeamData.securityScore}/100</div>
                  <div>
                    <p className="text-xs text-gray-300 font-medium">Security Score</p>
                    <p className="text-[10px] text-gray-500">{redTeamData.exploits.length} exploit{redTeamData.exploits.length !== 1 ? "s" : ""} found</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {redTeamData.exploits.map((e, i) => (
                    <div key={i} className={`rounded-xl border p-3 space-y-1 ${e.severity === "critical" ? "border-red-500/40 bg-red-500/5" : e.severity === "high" ? "border-orange-500/30 bg-orange-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-medium rounded px-1.5 py-0.5 ${e.severity === "critical" ? "bg-red-500/20 text-red-300" : "bg-orange-500/20 text-orange-300"}`}>{e.severity}</span>
                        <span className="text-xs text-gray-300 font-medium">{e.type}</span>
                      </div>
                      <p className="text-xs text-gray-400">{e.description}</p>
                      <p className="text-xs text-green-400">Fix: {e.fix}</p>
                    </div>
                  ))}
                </div>
                {redTeamData.passed.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-600 font-medium">Passed checks</p>
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
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">💰 Revenue Model</h2>
              <button onClick={() => setShowRevenue(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            {revenueLoading && <p className="text-xs text-gray-500">Modeling revenue strategies for your app…</p>}
            {revenueData && !revenueLoading && (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 px-4 py-3">
                  <p className="text-xs text-emerald-300 font-medium">Recommended: {revenueData.recommended} at {revenueData.launchPrice}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{revenueData.willingness_to_pay_reasoning}</p>
                </div>
                <div className="space-y-2">
                  {revenueData.strategies?.map((s, i) => (
                    <div key={i} className={`rounded-xl border p-3 ${s.name === revenueData.recommended ? "border-emerald-400/30 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white font-medium">{s.name}</span>
                        <span className="text-xs text-gray-400">{s.suggestedPrice}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{s.estimatedMRR}</p>
                      <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${s.fit}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5">{s.fit}% fit</p>
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
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">🎭 Brand Voice</h2>
              <button onClick={() => setShowBrandVoice(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-gray-500">Define your product&apos;s personality once — AI applies it to every error message, empty state, and UI string across your entire app.</p>
            <div className="space-y-2">
              <input value={brandTone} onChange={e => setBrandTone(e.target.value)} placeholder="Tone (e.g. friendly and direct, professional and warm)"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
              <input value={brandValues} onChange={e => setBrandValues(e.target.value)} placeholder="Values (e.g. transparent, reliable, human)"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
              <input value={brandPersonality} onChange={e => setBrandPersonality(e.target.value)} placeholder='Personality (e.g. "like a knowledgeable friend, not a corporate bot")'
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
              <textarea value={brandExamples} onChange={e => setBrandExamples(e.target.value)} placeholder={'Example phrases:\n"Oops, that page wandered off" instead of "404 Not Found"\n"Let\'s get you sorted" instead of "Error, please try again"'}
                rows={3} className="w-full resize-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
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
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">🌅 App Lifecycle</h2>
              <button onClick={() => setShowSunset(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            {sunsetLoading && <p className="text-xs text-gray-500">Analyzing app usage and lifecycle status…</p>}
            {sunsetData && !sunsetLoading && (
              <div className="space-y-4">
                <div className={`rounded-xl border px-4 py-3 ${sunsetData.recommendation === "keep" ? "border-green-400/30 bg-green-500/10" : sunsetData.recommendation === "archive" ? "border-amber-400/30 bg-amber-500/10" : "border-red-400/30 bg-red-500/10"}`}>
                  <p className="text-sm font-semibold text-white capitalize">{sunsetData.recommendation === "keep" ? "✓ Keep active" : sunsetData.recommendation === "archive" ? "⚠ Consider archiving" : "Archive this app"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sunsetData.reason}</p>
                  <p className="text-[10px] text-gray-600 mt-1">Last updated {sunsetData.daysSinceUpdate} days ago</p>
                </div>
                {sunsetData.unusedFeatures.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1.5">Possibly unused features</p>
                    {sunsetData.unusedFeatures.map((f, i) => <p key={i} className="text-xs text-gray-600">· {f}</p>)}
                  </div>
                )}
                {sunsetData.cleanupActions.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1.5">Cleanup checklist</p>
                    {sunsetData.cleanupActions.map((a, i) => <p key={i} className="text-xs text-gray-600">☐ {a}</p>)}
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
      <div className="rounded-2xl border border-white/10 bg-[#141418] p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>

        {status === "verified" ? (
          <>
            <div className="text-4xl mb-3 text-center">🎉</div>
            <h2 className="text-base font-semibold text-white mb-1 text-center">You&apos;re live!</h2>
            <p className="text-xs text-gray-400 mb-5 text-center">
              <strong className="text-white">{dnsInfo.domain}</strong> is now pointing to your app.
            </p>
            <a href={`https://${dnsInfo.domain}`} target="_blank" rel="noreferrer"
              className="block w-full text-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white py-2.5 text-sm font-medium hover:opacity-90 transition-opacity mb-2">
              Visit {dnsInfo.domain} ↗
            </a>
            <button onClick={onClose} className="w-full text-center text-xs text-gray-600 hover:text-gray-400 transition-colors py-1">
              Close
            </button>
          </>
        ) : (
          <>
            <div className="text-2xl mb-3">🌐</div>
            <h2 className="text-base font-semibold text-white mb-1">One last step</h2>
            <p className="text-xs text-gray-400 mb-4">
              Log into wherever you bought <strong className="text-white">{dnsInfo.domain.split(".").slice(-2).join(".")}</strong> (GoDaddy, Namecheap, Cloudflare, etc.) → find <strong className="text-white">"DNS Records"</strong> → add this:
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
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-fuchsia-300">{recordName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Value</span><span className="text-fuchsia-300">{dnsInfo.cname}</span></div>
                </>
              )}
            </div>

            {/* Live polling status */}
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 mb-4 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
              <div className="text-[11px] text-gray-500">
                <span className="text-gray-300">Checking your DNS automatically…</span>
                {elapsed > 0 && <span className="ml-1">(checked {Math.floor(elapsed / 5)}x)</span>}
                <div className="mt-0.5">This page will update the moment it&apos;s live — no need to refresh.</div>
              </div>
            </div>

            <button onClick={onClose} className="w-full text-center text-xs text-gray-600 hover:text-gray-400 transition-colors py-1">
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

        {availability === "taken" && <p className="mt-1.5 text-xs text-red-400">That name is already taken. Try something else.</p>}
        {availability === "available" && <p className="mt-1.5 text-xs text-green-400">Available! Your app will be at <strong>{slug}.thatcode.dev</strong></p>}
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
                      <span className="text-fuchsia-300">domains.thatcode.dev</span>
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

        {/* Security scan */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white">🔒 Security Scan</p>
              <p className="text-[10px] text-gray-600">Check for vulnerabilities before going live</p>
            </div>
            <button onClick={runScan} disabled={scanLoading}
              className="text-xs rounded-lg border border-white/10 bg-white/5 text-gray-400 px-2.5 py-1 hover:bg-white/10 transition-colors disabled:opacity-40">
              {scanLoading ? "Scanning…" : scanResult ? "Re-scan" : "Scan"}
            </button>
          </div>
          {scanResult && (
            <div className="space-y-1.5">
              <div className={`flex items-center gap-2 text-xs ${scanResult.score >= 80 ? "text-green-400" : scanResult.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                <span>Score: {scanResult.score}/100</span>
                {scanResult.issues.length === 0 && <span className="text-green-400">✓ No issues found</span>}
              </div>
              {scanResult.issues.map((issue, i) => (
                <div key={i} className={`rounded-lg p-2 text-[10px] space-y-0.5 ${issue.severity === "high" ? "bg-red-500/10 border border-red-500/20" : issue.severity === "medium" ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/5 border border-white/10"}`}>
                  <p className={`font-medium ${issue.severity === "high" ? "text-red-300" : issue.severity === "medium" ? "text-amber-300" : "text-gray-300"}`}>{issue.severity.toUpperCase()} — {issue.title}</p>
                  <p className="text-gray-500">{issue.description}</p>
                  <p className="text-gray-600">Fix: {issue.fix}</p>
                </div>
              ))}
            </div>
          )}
        </div>

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
