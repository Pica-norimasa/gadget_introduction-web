"use client";

import { useState } from "react";
import type { Work } from "@/app/lib/mock-data";

export function DiceButton({ works }: { works: Work[] }) {
  const [spinning, setSpinning] = useState(false);

  function handleClick() {
    const pick = works[Math.floor(Math.random() * works.length)];
    setSpinning(true);
    window.setTimeout(() => setSpinning(false), 500);

    const el = document.getElementById(`work-${pick.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="ランダムに1作品を見つける"
      title="ランダムに見つける"
      className={`fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-[var(--accent)] text-2xl text-[var(--accent-ink)] shadow-lg shadow-[var(--shadow)] transition-transform hover:scale-105 active:scale-95 ${
        spinning ? "animate-spin" : ""
      }`}
    >
      🎲
    </button>
  );
}
