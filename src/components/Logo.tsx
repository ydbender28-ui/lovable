export default function Logo({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "lg" ? 40 : size === "md" ? 32 : 24;
  const textClass = size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-sm";

  return (
    <div className="flex items-center gap-2">
      <svg width={iconSize} height={iconSize} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0f0f13"/>
        <rect width="40" height="40" rx="10" fill="url(#logo-border)" opacity="0.15"/>
        {/* Stylized < > brackets */}
        <path d="M11 20L17 14" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round"/>
        <path d="M11 20L17 26" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round"/>
        <path d="M29 20L23 14" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round"/>
        <path d="M29 20L23 26" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round"/>
        {/* Center dot — accent */}
        <circle cx="20" cy="20" r="2.5" fill="url(#logo-dot)"/>
        <defs>
          <linearGradient id="logo-border" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"/>
            <stop offset="1" stopColor="#fff" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="logo-dot" x1="17.5" y1="17.5" x2="22.5" y2="22.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a78bfa"/>
            <stop offset="1" stopColor="#38bdf8"/>
          </linearGradient>
        </defs>
      </svg>
      <span className={`font-semibold tracking-tight text-white ${textClass}`} style={{ letterSpacing: "-0.02em" }}>
        that<span style={{ color: "#a78bfa" }}>code</span>
      </span>
    </div>
  );
}
