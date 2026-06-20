"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    router.refresh();
  }

  function handleBlur() {
    setTimeout(() => setConfirm(false), 200);
  }

  return (
    <button
      onClick={handleDelete}
      onBlur={handleBlur}
      className={`absolute top-3 right-3 z-10 rounded-lg px-2 py-1 text-[11px] font-medium transition-all opacity-0 group-hover:opacity-100 ${
        confirm
          ? "bg-red-500/20 border border-red-500/40 text-red-400 opacity-100"
          : "bg-white/5 border border-white/10 text-gray-500 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
      }`}
    >
      {deleting ? "…" : confirm ? "Confirm?" : "Delete"}
    </button>
  );
}
