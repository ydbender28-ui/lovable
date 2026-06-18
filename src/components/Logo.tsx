export default function Logo({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "lg" ? 36 : size === "md" ? 28 : 22;
  const textClass = size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm";

  return (
    <div className="flex items-center gap-2.5">
      <svg width={iconSize} height={iconSize} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="9" fill="url(#tc-bg)" />
        {/* Terminal prompt > */}
        <path d="M9 13L15 18L9 23" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Underscore cursor */}
        <rect x="17" y="22" width="10" height="2.5" rx="1.25" fill="#e879f9"/>
        <defs>
          <linearGradient id="tc-bg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7c3aed"/>
            <stop offset="1" stopColor="#4f46e5"/>
          </linearGradient>
        </defs>
      </svg>
      <span className={`font-bold tracking-tight text-white ${textClass}`}>
        That<span className="text-fuchsia-400">Code</span>
      </span>
    </div>
  );
}
