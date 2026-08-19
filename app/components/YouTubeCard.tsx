import { extractYouTubeVideoId, youtubeThumbnailUrl } from "@/app/lib/youtube";

// YouTubeのサムネイルは動画IDさえ分かれば固定URLで常に公開されているため、
// GitHubCard.tsxと違って外部APIフェッチは不要(サーバー/クライアント
// どちらからでも直接<img>で埋め込める)。
//
// linked=falseは、既に外側が投稿詳細への<Link>になっている場所
// (MurmurStrip/StandalonePostCard)向け。<a>のネストはHTML的に無効
// (IdentityBadge.tsxで同種の問題に対処した時と同じ理由)なので、その
// 場合は同じ見た目のまま<div>で描画し、実際のYouTubeへのリンクは投稿
// 詳細ページ側(post/[id]/page.tsx)の独立した<a>に任せる。
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
  const videoId = extractYouTubeVideoId(youtubeUrl);

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

  if (linked) {
    return (
      <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className={cls}>
        {content}
      </a>
    );
  }
  return <div className={cls}>{content}</div>;
}
