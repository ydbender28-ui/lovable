import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ThatCode — Build apps with AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d0e18 0%, #13102a 50%, #0d0e18 100%)",
          position: "relative",
        }}
      >
        {/* Grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(109,95,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(109,95,255,0.06) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700,
            height: 400,
            background: "radial-gradient(ellipse, rgba(109,95,255,0.18) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "linear-gradient(145deg, #1e1b3a, #0e0c1a)",
            border: "1.5px solid rgba(139,113,255,0.45)",
            boxShadow: "0 0 60px rgba(109,95,255,0.35)",
            marginBottom: 32,
          }}
        >
          <svg width="48" height="60" viewBox="0 0 16 20" fill="none">
            <defs>
              <linearGradient id="b" x1="0" y1="0" x2="16" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#c4b5fd" />
                <stop offset="55%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            <path d="M10 0L1 11H7L5 20L15 9H9L10 0Z" fill="url(#b)" />
          </svg>
        </div>

        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 72, fontWeight: 800, letterSpacing: "-3px", color: "#eef0f6", lineHeight: 1 }}>
            That
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: "-3px",
              lineHeight: 1,
              background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #60a5fa 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Code
          </span>
        </div>

        <p style={{ fontSize: 26, color: "#94a3b8", letterSpacing: "-0.5px", margin: 0, textAlign: "center", maxWidth: 600 }}>
          Build apps with AI — describe it, see it live
        </p>

        {/* Bottom badge */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(109,95,255,0.12)",
            border: "1px solid rgba(109,95,255,0.25)",
            borderRadius: 999,
            padding: "8px 20px",
          }}
        >
          <span style={{ fontSize: 16, color: "#a78bfa" }}>thatcode.dev</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
