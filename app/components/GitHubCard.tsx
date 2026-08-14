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
};

type State = { status: "loading" } | { status: "error" } | { status: "ready"; data: RepoData };

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
        <span className="text-xl" aria-hidden>
          🔗
        </span>
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
      className={`flex flex-col justify-between gap-2 rounded-xl p-4 text-left ${shape}`}
      style={{ background: "#161b22" }}
    >
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
      </div>
    </a>
  );
}
