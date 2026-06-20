export default function Logo({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? 40 : size === "md" ? 34 : 28;
  const text = size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-base";

  return (
    <div className="flex items-center gap-2.5" style={{ userSelect: "none" }}>
      {/* Icon mark */}
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e1b4b"/>
            <stop offset="100%" stopColor="#0f172a"/>
          </linearGradient>
          <linearGradient id="spark-g" x1="20" y1="5" x2="20" y2="37" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a78bfa"/>
            <stop offset="60%" stopColor="#7c6af7"/>
            <stop offset="100%" stopColor="#4f46e5"/>
          </linearGradient>
          <linearGradient id="dot-g" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop stopColor="#f0abfc"/>
            <stop offset="1" stopColor="#818cf8"/>
          </linearGradient>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Background pill */}
        <rect width="40" height="40" rx="10" fill="url(#bg-g)"/>
        <rect width="40" height="40" rx="10" fill="white" opacity="0.03"/>
        {/* Lightning bolt */}
        <path
          d="M23 6L12 22h8.5L17 34l13-18H21L23 6z"
          fill="url(#spark-g)"
          filter="url(#glow)"
        />
      </svg>

      {/* Wordmark */}
      <span className={`font-bold tracking-tight ${text}`} style={{ letterSpacing: "-0.03em" }}>
        <span style={{ color: "#f0f4ff" }}>That</span>
        <span style={{
          backgroundImage: "linear-gradient(135deg, #a78bfa 0%, #7c6af7 50%, #6366f1 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>Code</span>
      </span>
    </div>
  );
}
