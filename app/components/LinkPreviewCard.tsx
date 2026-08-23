"use client";

import { useEffect, useState } from "react";
import { trackClick } from "@/app/lib/analytics-actions";

type PreviewData = {
  title: string;
  description: string | null;
  image: string | null;
  siteName: string;
  url: string;
};

type State = { status: "loading" } | { status: "error" } | { status: "ready"; data: PreviewData };

// Xのリンクカードと同じく、本文中の最初のURLだけをプレビューする
// (/api/link-preview参照)。OGPを持たないページ・取得に失敗したページも
// 多いため、loading/error中は何も表示しない(壊れた見た目のカードで
// 投稿を汚さないため。GitHubCard.tsxは明示的にリンクした結果なので
// エラー時も枠を出すが、これは自動検出なので沈黙する)。
export function LinkPreviewCard({
  url,
  onResult,
}: {
  url: string;
  // カード取得の成否を呼び出し元に伝えるコールバック(任意)。
  // 呼び出し元(PostEditor.tsx)が「カードが出せたなら本文側の生URL表記は
  // 消す」という判断をするために使う。二重fetchを避けるため、成否の
  // 判定はこのコンポーネント内のfetch結果をそのまま流用する。
  onResult?: (success: boolean) => void;
}) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((res) => (res.ok ? (res.json() as Promise<PreviewData>) : Promise.reject(res)))
      .then((data) => {
        if (cancelled) return;
        setState({ status: "ready", data });
        onResult?.(true);
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: "error" });
        onResult?.(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onResultは呼び出し元でinline関数になりがちで、依存に含めると不要な再fetchを招くため意図的に外す
  }, [url]);

  if (state.status !== "ready") return null;
  const { data } = state;

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => void trackClick("external_link_preview", window.location.pathname, data.url)}
      className="mt-2 block overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] transition-colors hover:border-[var(--ink-faint)]"
    >
      {data.image && (
        // eslint-disable-next-line @next/next/no-img-element -- 相手先ドメインの画像なのでnext/imageのドメイン設定は不要な簡易表示
        <img src={data.image} alt="" className="aspect-[1.91/1] w-full object-cover" />
      )}
      <div className="p-3">
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          {data.siteName}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[13.5px] font-semibold text-[var(--ink)]">{data.title}</p>
        {data.description && (
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[var(--ink-faint)]">{data.description}</p>
        )}
      </div>
    </a>
  );
}
