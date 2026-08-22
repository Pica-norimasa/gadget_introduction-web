"use client";

import { useState } from "react";
import { HashtagSegment } from "./LinkifiedText";

const PREVIEW_LENGTH = 60;

export function ExpandableText({ text, className = "" }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > PREVIEW_LENGTH;
  const shown = expanded || !isLong ? text : text.slice(0, PREVIEW_LENGTH).trimEnd() + "…";

  return (
    <p className={`text-[13.5px] leading-relaxed text-[var(--ink-soft)] ${className}`}>
      {/* WorkCardではカード全体がリンクになっているため(WorkCard.tsxの
          コメント参照)、#タグのリンクも「続きを読む」ボタンと同じく
          relative z-20で上に重ねてクリックを奪う必要がある。 */}
      <HashtagSegment text={shown} linkClassName="relative z-20 text-[var(--accent)] hover:underline" />
      {isLong && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="relative z-20 ml-1 font-medium text-[var(--teal)] hover:underline"
        >
          続きを読む
        </button>
      )}
    </p>
  );
}
