"use client";

import { useEffect, useState } from "react";
import type { Post, ReactionKey, Work } from "@/app/lib/mock-data";
import type { InspirationSignalView, RepostView, StandalonePostView } from "@/app/lib/queries";
import { FeedSection } from "./FeedSection";
import { MurmurStrip } from "./MurmurStrip";

type HomeTab = "products" | "murmurs";

const TABS: { id: HomeTab; label: string; description: string }[] = [
  { id: "products", label: "作品一覧", description: "作品・サービス・アプリを探す" },
  { id: "murmurs", label: "つぶやきタイムライン", description: "作品に紐づかない気軽な投稿を見る" },
];

export function HomeContentTabs({
  works,
  posts,
  myReactions,
  currentUserId,
  reposts,
  inspirations,
  discoveryWorks,
  standalonePosts,
  likedPostIds,
}: {
  works: Work[];
  posts: Post[];
  myReactions: Record<string, ReactionKey[]>;
  currentUserId: string | null;
  reposts: RepostView[];
  inspirations: InspirationSignalView[];
  discoveryWorks: Work[];
  standalonePosts: StandalonePostView[];
  likedPostIds: string[];
}) {
  const [tab, setTab] = useState<HomeTab>("products");
  const [pendingMurmurPostId, setPendingMurmurPostId] = useState<string | null>(null);

  useEffect(() => {
    function handleShowProducts() {
      setTab("products");
      requestAnimationFrame(() => {
        document.getElementById("feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    function handleShowMurmurs(event: Event) {
      const detail = (event as CustomEvent<{ postId?: string }>).detail;
      setTab("murmurs");
      setPendingMurmurPostId(detail?.postId ?? null);
    }

    window.addEventListener("draftly:show-products", handleShowProducts);
    window.addEventListener("draftly:show-murmurs", handleShowMurmurs);
    return () => {
      window.removeEventListener("draftly:show-products", handleShowProducts);
      window.removeEventListener("draftly:show-murmurs", handleShowMurmurs);
    };
  }, []);

  useEffect(() => {
    if (tab !== "murmurs" || !pendingMurmurPostId) return;

    let cancelled = false;
    let tries = 0;

    function scrollToPost() {
      if (cancelled) return;
      const target = document.getElementById(`murmur-${pendingMurmurPostId}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setPendingMurmurPostId(null);
        return;
      }
      tries += 1;
      if (tries < 8) {
        window.setTimeout(scrollToPost, 80);
        return;
      }
      document.getElementById("murmurs")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setPendingMurmurPostId(null);
    }

    requestAnimationFrame(scrollToPost);
    return () => {
      cancelled = true;
    };
  }, [tab, pendingMurmurPostId]);

  return (
    <section id="feed" className="scroll-mt-24">
      <div className="mb-6 rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)]/55 p-2">
        <div className="grid grid-cols-2 gap-1.5">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                className={`rounded-2xl px-3 py-3 text-left transition-colors ${
                  active
                    ? "bg-[var(--bg)] text-[var(--ink)] shadow-[0_1px_2px_var(--shadow)]"
                    : "text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)]/45 hover:text-[var(--ink-soft)]"
                }`}
              >
                <span className="block text-[13.5px] font-bold">{t.label}</span>
                <span
                  className={`mt-1 hidden text-[11px] leading-snug sm:block ${
                    active ? "text-[var(--ink-faint)]" : "text-[var(--ink-muted)]"
                  }`}
                >
                  {t.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === "products" ? (
        <FeedSection
          works={works}
          posts={posts}
          myReactions={myReactions}
          currentUserId={currentUserId}
          reposts={reposts}
          inspirations={inspirations}
          discoveryWorks={discoveryWorks}
        />
      ) : (
        <MurmurStrip posts={standalonePosts} likedPostIds={likedPostIds} embedded />
      )}
    </section>
  );
}
