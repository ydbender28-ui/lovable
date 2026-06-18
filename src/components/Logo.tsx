export default function Logo({ size = "sm" }: { size?: "sm" | "md" }) {
  const s = size === "md" ? 28 : 22;
  return (
    <div className="flex items-center gap-2">
      <svg width={s} height={s} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="7" fill="url(#tc-grad)" />
        {/* Code brackets */}
        <path d="M9 10L5.5 14L9 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 10L22.5 14L19 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Slash */}
        <path d="M16 9L12 19" stroke="#e879f9" strokeWidth="2" strokeLinecap="round"/>
        <defs>
          <linearGradient id="tc-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a855f7"/>
            <stop offset="1" stopColor="#6366f1"/>
          </linearGradient>
        </defs>
      </svg>
      <span className={`font-bold tracking-tight text-white ${size === "md" ? "text-lg" : "text-sm"}`}>
        That<span className="text-fuchsia-400">Code</span>
      </span>
    </div>
  );
}
