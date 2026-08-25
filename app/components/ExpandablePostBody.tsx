"use client";

import { useState } from "react";
import { LinkifiedText } from "./LinkifiedText";

// ExperiencePostCard/DiscontinuedWorkCard向け。カード全体がstretched
// link(absolute inset-0)になっているため、MurmurBody.tsxと同じく
// ボタンクリックがリンク遷移してしまわないようpreventDefault/
// stopPropagationで止める。文字数を切り詰めるのではなく、閉じた状態
// だけline-clampを外す方式(MurmurBody.tsxと同じ)にすることで、URLや
// ハッシュタグが変な位置で分断されるのを防ぐ。
const LONG_THRESHOLD = 90;

export function ExpandablePostBody({
  text,
  clampClassName = "line-clamp-3",
}: {
  text: string;
  clampClassName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > LONG_THRESHOLD;

  return (
    <div>
      <p
        className={`relative z-20 whitespace-pre-line text-[13px] leading-relaxed text-[var(--ink)] ${
          expanded ? "" : clampClassName
        }`}
      >
        <LinkifiedText text={text} />
      </p>
      {isLong && !expanded && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(true);
          }}
          className="relative z-20 mt-0.5 text-[12px] font-medium text-[var(--teal)] hover:underline"
        >
          続きを読む
        </button>
      )}
    </div>
  );
}
