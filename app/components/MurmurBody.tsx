"use client";

import { useState } from "react";

// つぶやきタイムライン(MurmurStrip.tsx)のカード本文用。カード全体が
// <Link>で包まれているため(WorkCard.tsxのような別要素の重ね張りではなく
// 本物の親子関係)、ボタンをクリックしてもリンク遷移してしまわないよう
// preventDefault/stopPropagationで止める必要がある。
// 文字数を切り詰めるのではなく、閉じた状態だけline-clampを外す方式にして
// いるため、文中のURLやハッシュタグが変な位置で分断される心配が無い。
const LONG_THRESHOLD = 110;

export function MurmurBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = body.length > LONG_THRESHOLD;

  return (
    <div>
      <p
        className={`whitespace-pre-line text-[13.5px] leading-7 text-[var(--ink)] ${
          expanded ? "" : "line-clamp-4"
        }`}
      >
        {body}
      </p>
      {isLong && !expanded && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(true);
          }}
          className="mt-0.5 font-medium text-[var(--teal)] hover:underline"
        >
          続きを読む
        </button>
      )}
    </div>
  );
}
