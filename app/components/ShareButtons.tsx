"use client";

import { useEffect, useState } from "react";
import { trackClick } from "@/app/lib/analytics-actions";
import type { Stage } from "@/app/lib/mock-data";
import { STAGE_EMOJI } from "@/app/lib/stage-progress";
import { withShareTracking } from "@/app/lib/share-tracking";

export function ShareButtons({
  title,
  stage,
  daysAgo,
  latestUpdate,
}: {
  title: string;
  // 未指定(プロフィール等、作品に紐づかない文脈での共有)なら従来通りの
  // 一言だけの文言にフォールバックする。
  stage?: Stage;
  daysAgo?: number;
  latestUpdate?: string;
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 共有URLは実行中のオリジンからでないと組み立てられない(サーバー側では
    // 値を持てない)。SSR時の出力とは一致させたまま、マウント後にここで
    // 実際のURLへ更新する、ハイドレーション不整合を避けるための意図的なパターン。
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 上記の理由でマウント後の設定が必要
    setUrl(window.location.href);
  }, []);

  // stage/daysAgoが渡された(=作品詳細ページからの共有)場合だけ、進捗の
  // 「今どのくらい進んでいるか」が一目で伝わる開発記録っぽい文言にする。
  const xText =
    stage && daysAgo !== undefined
      ? [
          `${STAGE_EMOJI[stage]} ${title} Day ${daysAgo + 1}`,
          latestUpdate ? latestUpdate.slice(0, 60) : null,
          "開発過程はこちら👇",
        ]
          .filter(Boolean)
          .join("\n")
      : `Draftlyで見つけた作品「${title}」\n作りかけや進捗も見られます`;
  const lineHref = url
    ? `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    : undefined;
  const xHref = url
    ? `https://twitter.com/intent/tweet?url=${encodeURIComponent(withShareTracking(url))}&text=${encodeURIComponent(xText)}`
    : undefined;

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
      void trackClick("share_copy_link", window.location.pathname, url);
    } catch {
      // クリップボードAPIが使えない環境では何もしない(アドレスバーから手動コピー可能)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <a
        href={lineHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => void trackClick("share_line", window.location.pathname, url)}
        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-[#06C755] px-3 py-1.5 text-center text-[12.5px] font-medium text-white"
      >
        LINEで送る
      </a>
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => void trackClick("share_x", window.location.pathname, url)}
        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-[var(--ink)] px-3 py-1.5 text-center text-[12.5px] font-medium text-[var(--bg)]"
      >
        Xでポスト
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="col-span-2 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1.5 text-center text-[12.5px] font-medium text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
      >
        {copied ? "コピーしました" : "🔗 リンクをコピー"}
      </button>
    </div>
  );
}
