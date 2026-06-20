interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { icon: 26, font: 16, radius: 7 },
  md: { icon: 32, font: 19, radius: 9 },
  lg: { icon: 40, font: 24, radius: 11 },
};

export default function Logo({ size = "md" }: LogoProps) {
  const s = SIZES[size];
  const gid = `tc-bolt-${size}`;

  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: s.icon * 0.32, userSelect: "none" }}
    >
      {/* Icon: dark rounded square with a two-triangle lightning bolt */}
      <span
        style={{
          width: s.icon,
          height: s.icon,
          borderRadius: s.radius,
          background: "linear-gradient(160deg, #1a1d24 0%, #0c0d11 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            "0 2px 12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        <svg
          width={s.icon * 0.58}
          height={s.icon * 0.58}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id={gid}
              x1="5"
              y1="1"
              x2="19"
              y2="23"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#9a82ff" />
              <stop offset="0.5" stopColor="#6d5fff" />
              <stop offset="1" stopColor="#3da9ff" />
            </linearGradient>
          </defs>
          {/* upper triangular shard */}
          <path d="M13.4 1.5 L5 13.2 L11.2 12.3 Z" fill={`url(#${gid})`} />
          {/* lower triangular shard, overlapping */}
          <path
            d="M10.6 22.5 L19 10.8 L12.8 11.7 Z"
            fill={`url(#${gid})`}
            opacity="0.92"
          />
        </svg>
      </span>

      {/* Wordmark */}
      <span
        style={{
          fontSize: s.font,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: "#eef0f6" }}>That</span>
        <span
          style={{
            backgroundImage: "linear-gradient(120deg, #6d5fff 0%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Code
        </span>
      </span>
    </span>
  );
}
