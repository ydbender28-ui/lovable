interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export default function Logo({ size = "md" }: LogoProps) {
  const dim = size === "sm" ? 30 : size === "lg" ? 46 : 36;
  const fs = size === "sm" ? 14 : size === "lg" ? 20 : 16;
  const gap = size === "sm" ? 8 : 10;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap }}>
      {/* Mark */}
      <div
        style={{
          width: dim,
          height: dim,
          borderRadius: Math.round(dim * 0.30),
          background: "linear-gradient(145deg, #f0edff 0%, #e8e4ff 100%)",
          border: "1px solid rgba(106,31,247,0.25)",
          boxShadow:
            "0 0 0 1px rgba(106,31,247,0.06), 0 4px 16px rgba(106,31,247,0.10), inset 0 1px 0 rgba(255,255,255,0.60)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width={Math.round(dim * 0.50)}
          height={Math.round(dim * 0.60)}
          viewBox="0 0 16 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="tc-bolt" x1="0" y1="0" x2="16" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="55%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <path d="M10 0L1 11H7L5 20L15 9H9L10 0Z" fill="url(#tc-bolt)" />
        </svg>
      </div>

      {/* Wordmark */}
      <span
        style={{
          fontSize: fs,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        <span style={{ color: "#17171c" }}>That</span>
        <span
          style={{
            background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #60a5fa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Code
        </span>
      </span>
    </div>
  );
}
