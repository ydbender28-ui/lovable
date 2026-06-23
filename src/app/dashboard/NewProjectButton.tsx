"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectButton() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit() {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: trimmed }),
    });
    const project = await res.json();
    router.push(`/projects/${project.id}?prompt=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="w-full rounded-2xl border border-[#ececf1] bg-white focus-within:border-fuchsia-400/40 transition-colors">
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        placeholder="Describe the app you want to build…"
        rows={3}
        className="w-full resize-none bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none"
      />
      <div className="flex items-center justify-between px-3 pb-3">
        <span className="text-[10px] text-gray-600">⏎ to create · Shift+⏎ newline</span>
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || loading}
          className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? "Creating..." : "Build →"}
        </button>
      </div>
    </div>
  );
}
