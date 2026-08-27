"use client";

import { useEffect, useRef, useState } from "react";
import { formatRelativeHours } from "@/app/lib/format";
import { GitHubMark } from "./BrandIcons";
import type { LatestCommit } from "./GitHubCard";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; commit: LatestCommit | null; hoursAgo: number | null };

// 制作タイムライン末尾に「最新コミット」を1件だけ添える。取得失敗や
// コミットが1件も無いリポジトリでは何も表示しない(せっかく整理した
// タイムラインの末尾を壊れた見た目のエントリで汚したくないため)。
export function LatestCommitEntry({ githubUrl }: { githubUrl: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const liRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/github-preview?url=${encodeURIComponent(githubUrl)}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ latestCommit: LatestCommit | null }>) : Promise.reject(res)))
      .then((data) => {
        if (!cancelled) {
          const hoursAgo = data.latestCommit?.date
            ? (Date.now() - new Date(data.latestCommit.date).getTime()) / (1000 * 60 * 60)
            : null;
          setState({ status: "ready", commit: data.latestCommit, hoursAgo });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [githubUrl]);

  useEffect(() => {
    // ProjectTimelineList側のマウント時オートスクロール(最下部へ)は、この
    // エントリが非同期で追加される前に一度だけ走ってしまう。追加分だけ
    // 見切れないようスクロール領域だけを最下部へ寄せる。
    // scrollIntoView()を使うとページ全体まで巻き込み、作品詳細を開いた
    // 直後に制作タイムライン付近へジャンプしてしまう。
    if (state.status === "ready" && state.commit) {
      const scrollContainer = liRef.current?.closest<HTMLElement>("[data-timeline-scroll-container]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [state]);

  if (state.status !== "ready" || !state.commit) return null;
  const { commit } = state;

  return (
    <li ref={liRef} className="relative mb-0">
      <span aria-hidden className="absolute -left-[23px] top-0.5 text-[var(--ink-faint)]">
        <GitHubMark className="h-4 w-4" />
      </span>
      <p className="mb-1.5 text-[11px] text-[var(--ink-faint)]">
        最新コミット{state.hoursAgo !== null && <> ・ {formatRelativeHours(state.hoursAgo)}</>}
      </p>
      <a
        href={commit.htmlUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2.5 text-[13px] hover:border-[var(--ink-faint)]"
      >
        {commit.authorAvatar && (
          // eslint-disable-next-line @next/next/no-img-element -- 外部GitHubアバター、next/imageのドメイン設定は不要な簡易表示
          <img src={commit.authorAvatar} alt="" className="mt-0.5 h-5 w-5 shrink-0 rounded-full" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[var(--ink)]">{commit.message}</span>
          <span className="mt-0.5 block font-mono text-[11px] text-[var(--ink-faint)]">
            {commit.authorName ?? commit.authorLogin ?? "unknown"} ・ {commit.sha}
          </span>
        </span>
      </a>
    </li>
  );
}
