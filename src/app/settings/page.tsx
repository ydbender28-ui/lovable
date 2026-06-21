"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

type LabsFeature = { key: string; name: string; description: string };
type WorkspaceMember = { id: string; role: string; user: { id: string; name: string | null; email: string } };
type Workspace = { id: string; name: string; members: WorkspaceMember[]; _count: { projects: number } };

export default function SettingsPage() {
  const [tab, setTab] = useState<"labs" | "workspace" | "account">("labs");

  // Labs
  const [labsEnabled, setLabsEnabled] = useState<string[]>([]);
  const [labsFeatures, setLabsFeatures] = useState<LabsFeature[]>([]);
  const [labsSaving, setLabsSaving] = useState(false);

  // Workspace
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [workspaceMsg, setWorkspaceMsg] = useState("");

  useEffect(() => {
    fetch("/api/user/labs").then(r => r.json()).then(d => {
      setLabsEnabled(d.enabled ?? []);
      setLabsFeatures(d.features ?? []);
    });
    fetch("/api/workspaces").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setWorkspaces(d);
    });
  }, []);

  async function saveLabs(enabled: string[]) {
    setLabsEnabled(enabled);
    setLabsSaving(true);
    await fetch("/api/user/labs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
    setLabsSaving(false);
  }

  async function createWorkspace() {
    if (!newWorkspaceName.trim()) return;
    const res = await fetch("/api/workspaces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newWorkspaceName }) });
    const w = await res.json();
    setWorkspaces(prev => [w, ...prev]);
    setNewWorkspaceName("");
  }

  async function inviteMember() {
    if (!inviteEmail.trim() || !inviteWorkspaceId) return;
    const res = await fetch(`/api/workspaces/${inviteWorkspaceId}/members`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    const d = await res.json();
    if (d.error) { setWorkspaceMsg(`Error: ${d.error}`); return; }
    setWorkspaceMsg(`✓ ${inviteEmail} added as ${inviteRole}`);
    setInviteEmail("");
    fetch("/api/workspaces").then(r => r.json()).then(d => { if (Array.isArray(d)) setWorkspaces(d); });
  }

  const tabs = [
    { key: "labs", label: "🧪 Labs" },
    { key: "workspace", label: "👥 Workspace" },
    { key: "account", label: "👤 Account" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white">
      <header className="border-b border-white/7 bg-[#0a0b0e]/90 backdrop-blur px-6 py-3 flex items-center gap-4">
        <Link href="/dashboard"><Logo size="sm" /></Link>
        <span className="text-gray-600">/</span>
        <span className="text-sm text-gray-300">Settings</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 mb-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${tab === t.key ? "border-fuchsia-400 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Labs */}
        {tab === "labs" && (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-white mb-1">Experimental Features</h2>
              <p className="text-xs text-gray-500">Try features before they&apos;re fully shipped. These may change or be removed.</p>
            </div>
            {labsFeatures.map(f => (
              <div key={f.key} className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div>
                  <p className="text-sm font-medium text-white">{f.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
                </div>
                <button
                  onClick={() => saveLabs(labsEnabled.includes(f.key) ? labsEnabled.filter(k => k !== f.key) : [...labsEnabled, f.key])}
                  className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${labsEnabled.includes(f.key) ? "bg-fuchsia-500" : "bg-white/10"}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${labsEnabled.includes(f.key) ? "left-5" : "left-1"}`} />
                </button>
              </div>
            ))}
            {labsSaving && <p className="text-xs text-gray-600">Saving…</p>}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-sm text-gray-300">Have feedback or a feature request?</p>
              <a href="https://feedback.thatcode.dev" target="_blank" rel="noreferrer"
                className="inline-block mt-2 text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                Submit feedback or vote on ideas →
              </a>
            </div>
          </div>
        )}

        {/* Workspace */}
        {tab === "workspace" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-white mb-1">Your Workspaces</h2>
              <p className="text-xs text-gray-500 mb-4">Collaborate with others. Pro users can invite unlimited collaborators — they use your credits.</p>
              {workspaces.length === 0 ? (
                <p className="text-xs text-gray-600">No workspaces yet.</p>
              ) : workspaces.map(w => (
                <div key={w.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{w.name}</p>
                      <p className="text-xs text-gray-500">{w._count.projects} projects · {w.members.length} members</p>
                    </div>
                    <button onClick={() => { setInviteWorkspaceId(w.id); }}
                      className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                      Invite member
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {w.members.map(m => (
                      <div key={m.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">{m.user.name ?? m.user.email}</span>
                        <span className="text-gray-600 capitalize">{m.role}</span>
                      </div>
                    ))}
                  </div>
                  {inviteWorkspaceId === w.id && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
                      <div className="flex gap-2">
                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none">
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={inviteMember}
                          className="flex-1 bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300 rounded-lg text-xs py-2 hover:bg-fuchsia-500/30 transition-colors">
                          Send invite
                        </button>
                      </div>
                      {workspaceMsg && <p className="text-xs text-green-400">{workspaceMsg}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400">Create workspace</p>
              <div className="flex gap-2">
                <input value={newWorkspaceName} onChange={e => setNewWorkspaceName(e.target.value)}
                  placeholder="Workspace name"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/40" />
                <button onClick={createWorkspace}
                  className="bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300 rounded-lg px-4 py-2 text-sm hover:bg-fuchsia-500/30 transition-colors">
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account */}
        {tab === "account" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <p className="text-xs text-gray-500">Need help or want to report an issue?</p>
              <a href="https://feedback.thatcode.dev" target="_blank" rel="noreferrer"
                className="block text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                📣 Feedback & feature requests →
              </a>
              <a href="mailto:support@thatcode.dev"
                className="block text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                ✉️ support@thatcode.dev →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
