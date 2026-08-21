"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { POST_TYPE_META, type Post, type ReactionKey, type Work } from "@/app/lib/mock-data";
import { latestPostFor } from "@/app/lib/post-helpers";
import { PLATFORM_META } from "@/app/lib/platform-meta";
import { toolLabel } from "@/app/lib/tool-meta";
import { formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "./AuthorAvatar";
import { FollowButton } from "./FollowButton";
import { ReactionBar } from "./ReactionBar";

const BATCH_SIZE = 5;
const MAX_ITEMS = 60;

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function Slide({
  work,
  posts,
  myReactions,
  currentUserId,
  onNavigate,
}: {
  work: Work;
  posts: Post[];
  myReactions: Record<string, ReactionKey[]>;
  currentUserId: string | null;
  onNavigate: () => void;
}) {
  const latestPost = latestPostFor(work.id, posts);

  return (
    <section className="relative h-full w-full snap-start overflow-hidden">
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: `linear-gradient(160deg, hsl(${work.hue} 35% 24%), hsl(${work.hue} 50% 9%))` }}
      >
        {work.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- ローカルアップロードのパスなのでnext/imageの最適化対象外
          <img src={work.coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : work.glyph ? (
          <span className="text-[120px] leading-none" aria-hidden>
            {work.glyph}
          </span>
        ) : (
          // キャッチコピーは下の情報パネルにも出るので、ここで同じ文言を
          // 大きく重ねて表示すると二重に見えてしまう(視覚アセット無しの
          // 作品で発生していた不具合)。装飾の引用符だけに留める。
          <span className="text-[160px] leading-none text-white/10" aria-hidden>
            ❝
          </span>
        )}
      </div>

      {/* 作者情報は画面下部の情報パネルに埋もれて目立たなかったので、
          Instagram/TikTokのストーリー形式に倣い画面上部に固定表示する。 */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-gradient-to-b from-black/70 to-transparent p-4 pb-10 text-white">
        <Link
          href={`/u/${encodeURIComponent(work.authorHandle ?? work.author)}`}
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2"
        >
          <AuthorAvatar name={work.author} image={work.authorImage} size={32} />
          <span className="truncate text-[14px] font-semibold drop-shadow-sm">{work.author}</span>
        </Link>
        {work.authorId !== currentUserId && (
          <FollowButton author={work.authorHandle ?? work.author} variant="dark" />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pb-12 pt-28 text-white">
        <div className="flex w-full max-w-[480px] flex-col gap-2">
          <p className="flex flex-wrap items-center gap-1 text-[12px] text-white/70">
            {work.stage} ・ {toolLabel(work.tool)} ・
            <span className="inline-flex items-center gap-1">
              {work.platforms.map((p) => {
                const { Icon } = PLATFORM_META[p];
                return <Icon key={p} className="h-3 w-3" />;
              })}
            </span>
          </p>
          <h2 className="text-xl font-bold leading-snug">{work.title}</h2>
          <p className="text-[14px] leading-relaxed text-white/85">{work.catch}</p>
          {latestPost && (
            <a
              href={`#work-${work.id}`}
              onClick={onNavigate}
              className="line-clamp-2 text-[12px] text-white/60 hover:underline"
            >
              {POST_TYPE_META[latestPost.type].icon}
              {formatRelativeHours(latestPost.hoursAgo)}・{POST_TYPE_META[latestPost.type].label}・
              {latestPost.body}
            </a>
          )}
          <div className="mt-1">
            <ReactionBar
              workId={work.id}
              reactions={work.reactions}
              myReactions={myReactions[work.id] ?? []}
              variant="dark"
            />
          </div>
          <a
            href={`#work-${work.id}`}
            onClick={onNavigate}
            className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-black"
          >
            フィードで見る →
          </a>
        </div>
      </div>
    </section>
  );
}

export function ImmersiveViewer({
  works,
  posts,
  myReactions,
  currentUserId,
  onClose,
}: {
  works: Work[];
  posts: Post[];
  myReactions: Record<string, ReactionKey[]>;
  currentUserId: string | null;
  onClose: () => void;
}) {
  const [feed] = useState(() => {
    const list: Work[] = [];
    while (list.length < MAX_ITEMS) list.push(...shuffled(works));
    return list.slice(0, MAX_ITEMS);
  });
  const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadedCount((c) => Math.min(c + BATCH_SIZE, MAX_ITEMS));
        }
      },
      { rootMargin: "800px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black" role="dialog" aria-modal="true" aria-label="没入ビュー">
      <button
        type="button"
        onClick={onClose}
        aria-label="閉じる"
        className="fixed right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-lg text-white backdrop-blur-sm"
      >
        ✕
      </button>

      <div className="h-full snap-y snap-mandatory overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {feed.slice(0, loadedCount).map((w, i) => (
          <Slide
            key={`${w.id}-${i}`}
            work={w}
            posts={posts}
            myReactions={myReactions}
            currentUserId={currentUserId}
            onNavigate={onClose}
          />
        ))}
        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  );
}
