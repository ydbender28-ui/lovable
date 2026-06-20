export default function Logo({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const scale = size === "lg" ? 1.5 : size === "md" ? 1.15 : 1;
  const iconW = Math.round(32 * scale);
  const iconH = Math.round(32 * scale);
  const textSize = size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm";

  return (
    <div className="flex items-center gap-2.5">
      <svg width={iconW} height={iconH} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background square with rounded corners */}
        <rect width="32" height="32" rx="8" fill="#0f0e17"/>
        {/* Subtle top shine */}
        <rect width="32" height="16" rx="8" fill="url(#shine)" opacity="0.06"/>
        {/* Left bracket */}
        <path d="M10 10L6 16L10 22" stroke="url(#bracketL)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Right bracket */}
        <path d="M22 10L26 16L22 22" stroke="url(#bracketR)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Center slash */}
        <path d="M19 9L13 23" stroke="url(#slash)" strokeWidth="2" strokeLinecap="round"/>
        <defs>
          <linearGradient id="bracketL" x1="6" y1="10" x2="10" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c084fc"/>
            <stop offset="1" stopColor="#818cf8"/>
          </linearGradient>
          <linearGradient id="bracketR" x1="22" y1="10" x2="26" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818cf8"/>
            <stop offset="1" stopColor="#c084fc"/>
          </linearGradient>
          <linearGradient id="slash" x1="19" y1="9" x2="13" y2="23" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f0abfc"/>
            <stop offset="1" stopColor="#a5b4fc"/>
          </linearGradient>
          <linearGradient id="shine" x1="0" y1="0" x2="32" y2="16" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff"/>
            <stop offset="1" stopColor="#fff" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>

      <span className={`font-bold tracking-tight text-white ${textSize}`} style={{ letterSpacing: "-0.025em" }}>
        That<span style={{ backgroundImage: "linear-gradient(135deg, #c084fc, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Code</span>
      </span>
    </div>
  );
}
