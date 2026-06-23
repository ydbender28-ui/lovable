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
            background: "linear-gradient(135deg, #6a1ff7, #0a8ff0)",
            boxShadow: "0 10px 40px rgba(106,31,247,0.30)",
          }}
        >
          Start building free →
        </Link>
        <button
          onClick={() => setShowDemo(true)}
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-medium transition-all hover:bg-[#f0f0f5]"
          style={{
            background: "#ffffff",
            border: "1px solid #ececf1",
            color: "#17171c",
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
