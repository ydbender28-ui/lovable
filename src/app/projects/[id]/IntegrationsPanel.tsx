"use client";

import { useState } from "react";

export interface EnvVars {
  [key: string]: string;
}

interface Integration {
  id: string;
  name: string;
  icon: string;
  category: string;
  desc: string;
  docsUrl: string;
  keys: {
    key: string;
    label: string;
    hint: string;
    hintUrl: string;
    placeholder: string;
    secret?: boolean;
  }[];
  autoPrompt: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "stripe",
    name: "Stripe",
    icon: "💳",
    category: "Payments",
    desc: "Accept credit cards, subscriptions, and one-time payments.",
    docsUrl: "https://stripe.com/docs",
    keys: [
      {
        key: "STRIPE_PUBLISHABLE_KEY",
        label: "Publishable Key",
        hint: "stripe.com → Developers → API Keys",
        hintUrl: "https://dashboard.stripe.com/apikeys",
        placeholder: "pk_live_...",
      },
    ],
    autoPrompt: "Add Stripe payment integration. Use Stripe.js loaded from https://js.stripe.com/v3/ via a script tag. Initialize with the publishable key from window.ENV.STRIPE_PUBLISHABLE_KEY. Create a clean checkout flow with a payment form, card element mounting, and confirmation state.",
  },
  {
    id: "supabase",
    name: "Supabase",
    icon: "🔋",
    category: "Database",
    desc: "PostgreSQL database with realtime, auth, and storage.",
    docsUrl: "https://supabase.com/docs",
    keys: [
      {
        key: "SUPABASE_URL",
        label: "Project URL",
        hint: "supabase.com → Project Settings → API",
        hintUrl: "https://app.supabase.com",
        placeholder: "https://xyz.supabase.co",
      },
      {
        key: "SUPABASE_ANON_KEY",
        label: "Anon Public Key",
        hint: "supabase.com → Project Settings → API",
        hintUrl: "https://app.supabase.com",
        placeholder: "eyJhbGci...",
      },
    ],
    autoPrompt: "Connect to Supabase using the JS client loaded from https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js. Initialize with window.ENV.SUPABASE_URL and window.ENV.SUPABASE_ANON_KEY. Replace all mock data with real database queries. Show loading and error states.",
  },
  {
    id: "firebase",
    name: "Firebase",
    icon: "🔥",
    category: "Database",
    desc: "Realtime database, authentication, and cloud storage.",
    docsUrl: "https://firebase.google.com/docs",
    keys: [
      {
        key: "FIREBASE_API_KEY",
        label: "API Key",
        hint: "Firebase Console → Project Settings → Your apps",
        hintUrl: "https://console.firebase.google.com",
        placeholder: "AIza...",
      },
      {
        key: "FIREBASE_PROJECT_ID",
        label: "Project ID",
        hint: "Firebase Console → Project Settings",
        hintUrl: "https://console.firebase.google.com",
        placeholder: "my-project-abc",
      },
    ],
    autoPrompt: "Connect to Firebase Firestore using the CDN SDK. Load from https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js and firestore-compat.js. Use window.ENV.FIREBASE_API_KEY and window.ENV.FIREBASE_PROJECT_ID. Replace local state with real Firestore reads/writes.",
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: "🤖",
    category: "AI",
    desc: "GPT-4, DALL-E, and Whisper for AI-powered features.",
    docsUrl: "https://platform.openai.com/docs",
    keys: [
      {
        key: "OPENAI_API_KEY",
        label: "API Key",
        hint: "platform.openai.com → API keys",
        hintUrl: "https://platform.openai.com/api-keys",
        placeholder: "sk-...",
        secret: true,
      },
    ],
    autoPrompt: "Add OpenAI GPT-4o integration. Use the Fetch API to call https://api.openai.com/v1/chat/completions with the key from window.ENV.OPENAI_API_KEY. Add a real AI chat or completion feature relevant to this app. Show streaming if possible.",
  },
  {
    id: "resend",
    name: "Resend",
    icon: "📧",
    category: "Email",
    desc: "Send transactional emails with a clean developer API.",
    docsUrl: "https://resend.com/docs",
    keys: [
      {
        key: "RESEND_API_KEY",
        label: "API Key",
        hint: "resend.com → API Keys",
        hintUrl: "https://resend.com/api-keys",
        placeholder: "re_...",
        secret: true,
      },
    ],
    autoPrompt: "Add an email sending feature using Resend. Use fetch to POST to https://api.resend.com/emails with Authorization: Bearer from window.ENV.RESEND_API_KEY. Build a contact form or notification trigger that actually sends emails.",
  },
  {
    id: "maps",
    name: "Google Maps",
    icon: "🗺️",
    category: "Maps",
    desc: "Interactive maps, geocoding, and directions.",
    docsUrl: "https://developers.google.com/maps",
    keys: [
      {
        key: "GOOGLE_MAPS_API_KEY",
        label: "Maps API Key",
        hint: "Google Cloud Console → APIs → Maps JavaScript API",
        hintUrl: "https://console.cloud.google.com",
        placeholder: "AIza...",
      },
    ],
    autoPrompt: "Add an interactive Google Maps embed using the Maps JavaScript API. Load the script with window.ENV.GOOGLE_MAPS_API_KEY. Display a map relevant to this app — store locations, delivery tracking, or event venues.",
  },
  {
    id: "mapbox",
    name: "Mapbox",
    icon: "📍",
    category: "Maps",
    desc: "Beautiful customizable maps and navigation.",
    docsUrl: "https://docs.mapbox.com",
    keys: [
      {
        key: "MAPBOX_TOKEN",
        label: "Access Token",
        hint: "account.mapbox.com → Access Tokens",
        hintUrl: "https://account.mapbox.com/access-tokens",
        placeholder: "pk.eyJ1...",
      },
    ],
    autoPrompt: "Add a Mapbox GL JS map using the CDN. Load mapbox-gl from cdn.jsdelivr.net. Set the access token from window.ENV.MAPBOX_TOKEN. Show a styled map relevant to this app with markers or popups.",
  },
  {
    id: "twilio",
    name: "Twilio",
    icon: "💬",
    category: "Messaging",
    desc: "SMS, WhatsApp, and voice for your app.",
    docsUrl: "https://www.twilio.com/docs",
    keys: [
      {
        key: "TWILIO_ACCOUNT_SID",
        label: "Account SID",
        hint: "console.twilio.com → Account Info",
        hintUrl: "https://console.twilio.com",
        placeholder: "AC...",
        secret: true,
      },
    ],
    autoPrompt: "Add SMS notification functionality using Twilio. Use the Twilio API to send messages. Build a form to trigger SMS notifications relevant to this app.",
  },
  {
    id: "airtable",
    name: "Airtable",
    icon: "📊",
    category: "Database",
    desc: "Use Airtable as a database for your app.",
    docsUrl: "https://airtable.com/developers/web/api/introduction",
    keys: [
      {
        key: "AIRTABLE_API_KEY",
        label: "Personal Access Token",
        hint: "airtable.com → Account → API",
        hintUrl: "https://airtable.com/create/tokens",
        placeholder: "pat...",
        secret: true,
      },
      {
        key: "AIRTABLE_BASE_ID",
        label: "Base ID",
        hint: "airtable.com/[baseId] — from the URL of your base",
        hintUrl: "https://airtable.com",
        placeholder: "app...",
      },
    ],
    autoPrompt: "Connect to Airtable using the REST API and window.ENV.AIRTABLE_API_KEY + window.ENV.AIRTABLE_BASE_ID. Fetch real records from the first table and display them. Support creating and updating records.",
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    icon: "🖼️",
    category: "Media",
    desc: "Image and video uploads, transformations, and CDN.",
    docsUrl: "https://cloudinary.com/documentation",
    keys: [
      {
        key: "CLOUDINARY_CLOUD_NAME",
        label: "Cloud Name",
        hint: "cloudinary.com/console → Dashboard",
        hintUrl: "https://cloudinary.com/console",
        placeholder: "my-cloud",
      },
      {
        key: "CLOUDINARY_UPLOAD_PRESET",
        label: "Upload Preset (unsigned)",
        hint: "cloudinary.com/console → Settings → Upload → Upload presets",
        hintUrl: "https://cloudinary.com/console/upload_presets",
        placeholder: "my_preset",
      },
    ],
    autoPrompt: "Add image upload functionality using Cloudinary. Use the unsigned upload API: POST to https://api.cloudinary.com/v1_1/[CLOUDINARY_CLOUD_NAME]/image/upload with upload_preset from window.ENV. Show upload progress, display uploaded images with Cloudinary URLs.",
  },
  {
    id: "clerk",
    name: "Clerk",
    icon: "🔐",
    category: "Auth",
    desc: "Drop-in authentication with social logins, MFA, and user management.",
    docsUrl: "https://clerk.com/docs",
    keys: [
      {
        key: "CLERK_PUBLISHABLE_KEY",
        label: "Publishable Key",
        hint: "clerk.com/dashboard → API Keys",
        hintUrl: "https://dashboard.clerk.com",
        placeholder: "pk_live_...",
      },
    ],
    autoPrompt: "Add Clerk authentication. Load the Clerk JS SDK from the CDN using window.ENV.CLERK_PUBLISHABLE_KEY. Add sign-in, sign-up flows and protect authenticated routes. Show user profile and sign-out button when logged in.",
  },
  {
    id: "pusher",
    name: "Pusher",
    icon: "⚡",
    category: "Realtime",
    desc: "Realtime WebSockets for live updates and collaboration.",
    docsUrl: "https://pusher.com/docs",
    keys: [
      {
        key: "PUSHER_APP_KEY",
        label: "App Key",
        hint: "dashboard.pusher.com → App → Keys",
        hintUrl: "https://dashboard.pusher.com",
        placeholder: "abc123...",
      },
      {
        key: "PUSHER_CLUSTER",
        label: "Cluster",
        hint: "dashboard.pusher.com → App → Keys",
        hintUrl: "https://dashboard.pusher.com",
        placeholder: "us2",
      },
    ],
    autoPrompt: "Add Pusher for realtime updates. Load pusher-js from CDN. Connect using window.ENV.PUSHER_APP_KEY and window.ENV.PUSHER_CLUSTER. Subscribe to relevant channels and show live updates in the UI.",
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(INTEGRATIONS.map((i) => i.category)))];

interface Props {
  envVars: EnvVars;
  onSaveEnv: (vars: EnvVars) => Promise<void>;
  onAutoPrompt: (prompt: string, env: EnvVars) => void;
  onClose: () => void;
}

export default function IntegrationsPanel({ envVars, onSaveEnv, onAutoPrompt, onClose }: Props) {
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const filtered = category === "All" ? INTEGRATIONS : INTEGRATIONS.filter((i) => i.category === category);

  function isConnected(integration: Integration) {
    return integration.keys.every((k) => !!envVars[k.key]);
  }

  async function handleConnect(integration: Integration) {
    const newKeys: EnvVars = {};
    for (const k of integration.keys) {
      const val = values[k.key] ?? envVars[k.key] ?? "";
      if (val) newKeys[k.key] = val;
    }
    if (Object.keys(newKeys).length === 0) return;
    setSaving(true);
    const merged = { ...envVars, ...newKeys };
    await onSaveEnv(merged);
    setSaving(false);
    setSaved(integration.id);
    setTimeout(() => setSaved(null), 2000);
    setValues({});
  }

  async function handleConnectAndBuild(integration: Integration) {
    const newKeys: EnvVars = {};
    for (const k of integration.keys) {
      const val = values[k.key] ?? envVars[k.key] ?? "";
      if (val) newKeys[k.key] = val;
    }
    const merged = { ...envVars, ...newKeys };
    if (Object.keys(newKeys).length > 0) {
      await onSaveEnv(merged);
    }
    onAutoPrompt(integration.autoPrompt, merged);
    onClose();
  }

  function handleDisconnect(integration: Integration) {
    const updated = { ...envVars };
    for (const k of integration.keys) delete updated[k.key];
    onSaveEnv(updated);
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative ml-auto flex h-full w-full max-w-lg flex-col"
        style={{ background: "#0d0e14", borderLeft: "1px solid rgba(255,255,255,0.09)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ececf1] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Integrations</h2>
            <p className="mt-0.5 text-xs" style={{ color: "#71717f" }}>
              Connect services — keys are stored securely per project
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors hover:bg-white/10"
            style={{ color: "#71717f" }}
          >
            ✕
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto px-5 py-3" style={{ borderBottom: "1px solid #ececf1" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all"
              style={
                category === c
                  ? { background: "rgba(106,31,247,0.22)", color: "#a78bfa", border: "1px solid rgba(106,31,247,0.35)" }
                  : { background: "rgba(0,0,0,0.03)", color: "#71717f", border: "1px solid #ececf1" }
              }
            >
              {c}
            </button>
          ))}
        </div>

        {/* Integration list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {filtered.map((integration) => {
            const connected = isConnected(integration);
            const open = openId === integration.id;

            return (
              <div
                key={integration.id}
                className="overflow-hidden rounded-xl transition-all"
                style={{
                  background: "#ffffff",
                  border: connected
                    ? "1px solid rgba(34,197,94,0.30)"
                    : open
                    ? "1px solid rgba(106,31,247,0.35)"
                    : "1px solid #ececf1",
                }}
              >
                {/* Row */}
                <button
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white"
                  onClick={() => setOpenId(open ? null : integration.id)}
                >
                  <span className="text-xl shrink-0">{integration.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{integration.name}</span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                        style={{ background: "#ececf1", color: "#71717f" }}
                      >
                        {integration.category}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs" style={{ color: "#71717f" }}>
                      {integration.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {connected && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
                        Connected
                      </span>
                    )}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ color: "#4b5263", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {/* Expanded form */}
                {open && (
                  <div className="px-4 pb-4 space-y-4" style={{ borderTop: "1px solid #ececf1" }}>
                    <div className="pt-3 space-y-3">
                      {integration.keys.map((k) => (
                        <div key={k.key}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="text-[11px] font-medium" style={{ color: "#c4cad6" }}>
                              {k.label}
                            </label>
                            <a
                              href={k.hintUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] transition-colors hover:opacity-80"
                              style={{ color: "#6d5fff" }}
                            >
                              {k.hint} ↗
                            </a>
                          </div>
                          <input
                            type={k.secret ? "password" : "text"}
                            value={values[k.key] ?? envVars[k.key] ?? ""}
                            onChange={(e) => setValues((v) => ({ ...v, [k.key]: e.target.value }))}
                            placeholder={k.placeholder}
                            className="w-full rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-gray-600 focus:outline-none"
                            style={{
                              background: "rgba(0,0,0,0.03)",
                              border: "1px solid #ececf1",
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "rgba(106,31,247,0.5)")}
                            onBlur={(e) => (e.target.style.borderColor = "#ececf1")}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleConnectAndBuild(integration)}
                        disabled={saving}
                        className="flex-1 rounded-lg py-2 text-xs font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-50"
                        style={{
                          background: "linear-gradient(135deg,#6d5fff,#5b4ee0)",
                          boxShadow: "0 4px 16px rgba(106,31,247,0.30)",
                        }}
                      >
                        {saved === integration.id ? "Saved ✓" : "Save & Add to App →"}
                      </button>
                      <button
                        onClick={() => handleConnect(integration)}
                        disabled={saving}
                        className="rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-white/10"
                        style={{ background: "rgba(255,255,255,0.05)", color: "#c4cad6", border: "1px solid rgba(255,255,255,0.09)" }}
                      >
                        Save only
                      </button>
                      {connected && (
                        <button
                          onClick={() => handleDisconnect(integration)}
                          className="rounded-lg px-2.5 py-2 text-[11px] transition-colors hover:bg-red-500/10"
                          style={{ color: "#71717f" }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 text-xs"
          style={{ borderTop: "1px solid #ececf1", color: "#4b5263" }}
        >
          Keys are encrypted and stored per project. They are injected into your app at build time — never exposed publicly.
        </div>
      </div>
    </div>
  );
}
