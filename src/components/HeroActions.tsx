"use client";

import { useState } from "react";
import Link from "next/link";
import DemoModal from "./DemoModal";

export default function HeroActions({ startHref }: { startHref: string }) {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <div className="animate-fade-slide-up mt-9 flex flex-col items-center gap-3 sm:flex-row" style={{ animationDelay: "0.15s" }}>
        <Link
          href={startHref}
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #7b6dff, #5b4ee0)",
            boxShadow: "0 10px 40px rgba(109,95,255,0.40)",
          }}
        >
          Start building free →
        </Link>
        <button
          onClick={() => setShowDemo(true)}
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-medium transition-all hover:bg-white/[0.06]"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#c4cad6",
          }}
        >
          <span style={{ fontSize: 15 }}>▶</span>
          See how it works
        </button>
      </div>

      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
    </>
  );
}
