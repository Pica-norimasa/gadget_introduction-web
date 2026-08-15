"use client";

import { useEffect, useRef, useState } from "react";
import { POST_TYPE_META, type Post, type ReactionKey, type Work } from "@/app/lib/mock-data";
import { latestPostFor } from "@/app/lib/post-helpers";
import { PLATFORM_META } from "@/app/lib/platform-meta";
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

function formatRelativeHours(hoursAgo: number): string {
  if (hoursAgo < 24) return `${hoursAgo}時間前`;
  return `${Math.round(hoursAgo / 24)}日前`;
}

function Slide({
  work,
  posts,
  myReactions,
  onNavigate,
}: {
  work: Work;
  posts: Post[];
  myReactions: Record<string, ReactionKey[]>;
  onNavigate: () => void;
}) {
  const latestPost = latestPostFor(work.id, posts);

  return (
    <section className="relative h-full w-full snap-start overflow-hidden">
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: `linear-gradient(160deg, hsl(${work.hue} 35% 24%), hsl(${work.hue} 50% 9%))` }}
      >
        {work.glyph ? (
          <span className="text-[120px] leading-none" aria-hidden>
            {work.glyph}
          </span>
        ) : (
          <p className="max-w-xs px-8 text-center text-2xl font-bold leading-snug text-white/90">
            <span className="mr-1 opacity-50" aria-hidden>
              ❝
            </span>
            {work.catch}
          </p>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pb-8 pt-28 text-white">
        <p className="text-[12px] text-white/70">
          {work.stage} ・{" "}
          {work.tool === "self" ? "AIを使わず自作" : work.tool ? `${work.tool}で制作` : "アイデアのみ"} ・{" "}
          {work.platforms.map((p) => PLATFORM_META[p].icon).join(" ")}
        </p>
        <h2 className="text-xl font-bold leading-snug">{work.title}</h2>
        <p className="text-[14px] leading-relaxed text-white/85">{work.catch}</p>
        {latestPost && (
          <p className="text-[12px] text-white/60">
            {POST_TYPE_META[latestPost.type].icon}
            {formatRelativeHours(latestPost.hoursAgo)}・{POST_TYPE_META[latestPost.type].label}・
            {latestPost.body}
          </p>
        )}
        <div className="mt-1 flex items-center justify-between gap-3">
          <ReactionBar
            workId={work.id}
            reactions={work.reactions}
            myReactions={myReactions[work.id] ?? []}
            variant="dark"
          />
          <span className="shrink-0 text-[12px] text-white/70">by {work.author}</span>
        </div>
        <a
          href={`#work-${work.id}`}
          onClick={onNavigate}
          className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-black"
        >
          フィードで見る →
        </a>
      </div>
    </section>
  );
}

export function ImmersiveViewer({
  works,
  posts,
  myReactions,
  onClose,
}: {
  works: Work[];
  posts: Post[];
  myReactions: Record<string, ReactionKey[]>;
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
          <Slide key={`${w.id}-${i}`} work={w} posts={posts} myReactions={myReactions} onNavigate={onClose} />
        ))}
        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  );
}
