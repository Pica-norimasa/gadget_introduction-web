"use client";

import { useState } from "react";
import type { Post, ReactionKey, Work } from "@/app/lib/mock-data";
import { ImmersiveViewer } from "./ImmersiveViewer";

export function ImmersiveEntry({
  works,
  posts,
  myReactions,
  currentUserId,
}: {
  works: Work[];
  posts: Post[];
  myReactions: Record<string, ReactionKey[]>;
  currentUserId: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 投稿ボタン(ComposerFab、右下固定)と対になる位置に、左下固定の
          円形ボタンとして配置する。 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="スワイプで発見"
        title="スワイプで発見"
        className="mobile-floating-action-left fixed z-40 grid h-14 w-14 place-items-center rounded-full bg-[var(--ink)] text-2xl text-[var(--bg)] shadow-lg shadow-[var(--shadow)] transition-transform hover:scale-105 active:scale-95"
      >
        🎬
      </button>

      {open && (
        <ImmersiveViewer
          works={works}
          posts={posts}
          myReactions={myReactions}
          currentUserId={currentUserId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
