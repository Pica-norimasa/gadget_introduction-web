"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { extractYouTubeVideoId, youtubeEmbedUrl, youtubeThumbnailUrl } from "@/app/lib/youtube";

// YouTubeのサムネイルは動画IDさえ分かれば固定URLで常に公開されているため、
// GitHubCard.tsxと違って外部APIフェッチは不要(サーバー/クライアント
// どちらからでも直接<img>で埋め込める)。
//
// linked=falseは、既に外側が投稿詳細への<Link>になっている場所
// (MurmurStrip/StandalonePostCard)向け。<a>/<button>のネストはHTML的に
// 無効(IdentityBadge.tsxで同種の問題に対処した時と同じ理由)なので、その
// 場合は同じ見た目のままdivをボタン化して再生し、外側のLinkへのクリック
// 伝播だけstopPropagationで止める。
export function YouTubeCard({
  youtubeUrl,
  className = "",
  linked = true,
  aspect = "aspect-video",
}: {
  youtubeUrl: string;
  className?: string;
  linked?: boolean;
  // WorkCard.tsxのサムネイル枠(正方形/4:3)に合わせて差し替えられるように。
  // 単独のプレビューカードとして出す場所(投稿詳細等)は動画本来の16:9のまま。
  aspect?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractYouTubeVideoId(youtubeUrl);

  // Xのようにその場で再生する。埋め込みiframeはクリックされるまで作らない
  // (最初から埋め込むとページ内の動画数だけ無駄にリクエストが飛ぶため)。
  if (videoId && playing) {
    return (
      <div className={`relative overflow-hidden rounded-xl border border-[var(--line)] bg-black ${aspect} ${className}`}>
        <iframe
          src={youtubeEmbedUrl(videoId)}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  const content = !videoId ? (
    <>
      <span aria-hidden className="text-[20px]">
        ▶️
      </span>
      <p className="line-clamp-1 max-w-full break-all font-mono text-[11px] text-[var(--ink-faint)] underline">
        {youtubeUrl.replace("https://", "")}
      </p>
    </>
  ) : (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- 外部YouTubeサムネイル、next/imageのドメイン設定なしで済ませる */}
      <img src={youtubeThumbnailUrl(videoId)} alt="" className="h-full w-full object-cover" />
      <span className="absolute inset-0 flex items-center justify-center bg-black/15">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-black/65 text-[18px] text-white">▶</span>
      </span>
    </>
  );

  const cls = !videoId
    ? `flex ${aspect} flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-sunken)] p-4 text-center ${className}`
    : `relative block ${aspect} overflow-hidden rounded-xl border border-[var(--line)] bg-black ${className}`;

  if (videoId) {
    const handleClick = (e: MouseEvent) => {
      // 外側がLinkの場合(linked=false)、伝播を止めるだけでは足りない
      // (Linkのonclickが呼ばれなくなる結果、素の<a href>のネイティブな
      // 遷移が代わりに走ってしまう)。preventDefaultも合わせて呼ぶ。
      e.preventDefault();
      e.stopPropagation();
      setPlaying(true);
    };

    if (linked) {
      return (
        <button type="button" onClick={handleClick} className={cls}>
          {content}
        </button>
      );
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      e.stopPropagation();
      setPlaying(true);
    };
    return (
      <div role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown} className={cls}>
        {content}
      </div>
    );
  }

  if (linked) {
    return (
      <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className={cls}>
        {content}
      </a>
    );
  }
  return <div className={cls}>{content}</div>;
}
