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
    if (!confirm) {
      setConfirm(true);
      return;
    }
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
      className="absolute right-3 top-3 z-10 rounded-lg px-2 py-1 text-[11px] font-medium opacity-0 transition-all group-hover:opacity-100"
      style={
        confirm
          ? {
              background: "rgba(244,63,94,0.18)",
              border: "1px solid rgba(244,63,94,0.45)",
              color: "#fb7185",
              opacity: 1,
            }
          : {
              background: "rgba(0,0,0,0.04)",
              border: "1px solid #ececf1",
              color: "#71717f",
            }
      }
    >
      {deleting ? "…" : confirm ? "Confirm?" : "Delete"}
    </button>
  );
}
