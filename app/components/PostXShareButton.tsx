"use client";

import { useEffect, useState } from "react";

// ShareButtons.tsxと同じ「Xの投稿画面を開くだけ」のintentリンク方式。
// Draftly側からAPI経由で自動投稿するわけではなく、本文とURLを差し込んだ
// Xの投稿画面をユーザーが開いて内容を確認してから自分でポストする。
export function PostXShareButton({ text }: { text: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ShareButtons.tsxと同じ理由(SSRとの不整合回避)
    setUrl(window.location.href);
  }, []);

  const xHref = url ? `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` : undefined;

  return (
    <a
      href={xHref}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--bg)]"
    >
      Xにもポスト
    </a>
  );
}
