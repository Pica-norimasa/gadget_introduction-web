"use client";

import { useEffect, useState } from "react";
import { languageColor } from "@/app/lib/language-colors";

type RepoData = {
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  ownerAvatar: string | null;
  htmlUrl: string;
  contributorsCount: number | null;
};

type State = { status: "loading" } | { status: "error" } | { status: "ready"; data: RepoData };

// GitHub公式のOcticon "mark-github"のパス。単色SVGとして埋め込むことで、
// 背景色に関わらず「これはGitHubの情報です」と一目で分かるようにする
// (色のトーンだけでGitHubらしさを出そうとしていた従来のカードは、単なる
// 暗い箱に見えてしまっていたため)。
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden className={className}>
      <path d="M8 0c-4.42 0-8 3.58-8 8 0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function GitHubCard({ githubUrl, size = "md" }: { githubUrl: string; size?: "md" | "lg" }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const shape = size === "lg" ? "aspect-[4/3]" : "aspect-square";

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/github-preview?url=${encodeURIComponent(githubUrl)}`)
      .then((res) => (res.ok ? (res.json() as Promise<RepoData>) : Promise.reject(res)))
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [githubUrl]);

  if (state.status === "loading") {
    return (
      <div className={`animate-pulse rounded-xl p-4 ${shape}`} style={{ background: "#161b22" }}>
        <div className="flex h-full flex-col justify-end gap-2">
          <div className="h-3 w-2/3 rounded bg-white/10" />
          <div className="h-2.5 w-full rounded bg-white/10" />
          <div className="h-2.5 w-1/2 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-sunken)] p-4 text-center ${shape}`}
      >
        <GitHubMark className="text-[var(--ink-faint)]" />
        <p className="text-[11px] text-[var(--ink-faint)]">プレビューを取得できませんでした</p>
        <p className="line-clamp-1 max-w-full break-all font-mono text-[11px] text-[var(--ink-faint)] underline">
          {githubUrl.replace("https://", "")}
        </p>
      </a>
    );
  }

  const { data } = state;
  return (
    <a
      href={data.htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex flex-col justify-between gap-2 rounded-xl border border-white/10 p-4 text-left ${shape}`}
      style={{ background: "#161b22" }}
    >
      <div className="flex items-center gap-1.5 text-[#8b949e]">
        <GitHubMark />
        <span className="font-mono text-[10px] uppercase tracking-[0.1em]">GitHub</span>
      </div>

      <div className="flex items-center gap-2">
        {data.ownerAvatar && (
          // eslint-disable-next-line @next/next/no-img-element -- external GitHub avatar, no next/image domain config needed for a demo card
          <img src={data.ownerAvatar} alt="" className="h-5 w-5 rounded-full" />
        )}
        <span className="truncate font-mono text-[12px] text-[#c9d1d9]">{data.fullName}</span>
      </div>

      {data.description && (
        <p
          className={`text-[12.5px] leading-relaxed text-[#8b949e] ${
            size === "lg" ? "line-clamp-4" : "line-clamp-3"
          }`}
        >
          {data.description}
        </p>
      )}

      <div className="flex items-center gap-3 text-[11px] text-[#8b949e]">
        {data.language && (
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: languageColor(data.language) }} />
            {data.language}
          </span>
        )}
        <span>⭐ {data.stars.toLocaleString()}</span>
        {data.contributorsCount !== null && <span>👥 {data.contributorsCount.toLocaleString()}</span>}
      </div>
    </a>
  );
}
