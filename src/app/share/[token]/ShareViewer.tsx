"use client";

import { useEffect, useRef, useState } from "react";

export default function ShareViewer({ filesJson, expiresAt }: { filesJson: string; expiresAt: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    const files: Record<string, string> = JSON.parse(filesJson);
    fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files, projectName: "Shared Project" }),
    }).then(r => r.text()).then(html => {
      if (!iframeRef.current) return;
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
      const blob = new Blob([html], { type: "text/html" });
      blobRef.current = URL.createObjectURL(blob);
      iframeRef.current.src = blobRef.current;
    });
    return () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); };
  }, [filesJson]);

  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#0a0a0f" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#0d0d14", flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: "#f5f5f5", fontWeight: 600 }}>ThatCode — Shared Preview</span>
        <span style={{ fontSize: 11, color: "#6b7280" }}>View only · expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}</span>
      </div>
      {!ready && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: 13 }}>
          Loading preview…
        </div>
      )}
      <iframe
        ref={iframeRef}
        onLoad={() => setReady(true)}
        sandbox="allow-scripts allow-same-origin"
        style={{ flex: 1, border: "none", display: ready ? "block" : "none" }}
      />
    </div>
  );
}
