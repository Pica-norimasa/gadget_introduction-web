"use client";

import { useState } from "react";

const PREVIEW_LENGTH = 60;

export function ExpandableText({ text, className = "" }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > PREVIEW_LENGTH;
  const shown = expanded || !isLong ? text : text.slice(0, PREVIEW_LENGTH).trimEnd() + "…";

  return (
    <p className={`text-[13.5px] leading-relaxed text-[var(--ink-soft)] ${className}`}>
      {shown}
      {isLong && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ml-1 font-medium text-[var(--teal)] hover:underline"
        >
          続きを読む
        </button>
      )}
    </p>
  );
}
