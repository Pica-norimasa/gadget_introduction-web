"use client";

import Link from "next/link";
import { useState } from "react";
import type { CommentThread as CommentThreadType, CommentView } from "@/app/lib/queries";
import { formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "./AuthorAvatar";
import { CommentForm } from "./CommentForm";
import { DeleteCommentButton } from "./DeleteCommentButton";
import { MoreActionsMenu } from "./MoreActionsMenu";

function CommentRow({ comment, currentUserId }: { comment: CommentView; currentUserId: string | null }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3">
      <div className="flex items-start gap-2">
        <Link href={`/u/${encodeURIComponent(comment.authorHandle)}`} className="shrink-0">
          <AuthorAvatar name={comment.authorName} image={comment.authorImage} size={28} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[12px] text-[var(--ink-faint)]">
              <Link
                href={`/u/${encodeURIComponent(comment.authorHandle)}`}
                className="font-medium text-[var(--ink-soft)] hover:underline"
              >
                {comment.authorName}
              </Link>
              <span className="text-[var(--ink-faint)]"> @{comment.authorHandle}</span>{" "}
              ・ {formatRelativeHours(comment.hoursAgo)}
            </p>
            {comment.authorId === currentUserId ? (
              <DeleteCommentButton commentId={comment.id} />
            ) : (
              <MoreActionsMenu
                reportTarget={{ type: "comment", id: comment.id }}
                author={{ id: comment.authorId, name: comment.authorName }}
              />
            )}
          </div>
          {comment.body && <p className="text-[14px] leading-relaxed text-[var(--ink)]">{comment.body}</p>}
          {comment.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- ローカルアップロードのパスなのでnext/imageの最適化対象外
            <img
              src={comment.imageUrl}
              alt=""
              className="mt-2 max-h-64 max-w-full rounded-xl border border-[var(--line)] object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// トップレベルコメント1件+その返信一覧+返信フォームをまとめて描画する。
// 「返信への返信」はボタンを出さないことで防いでいる(Xと同じ1階層のみの
// フラットなスレッド、詳しくはComment.parentIdのスキーマコメント参照)。
export function CommentThread({
  thread,
  target,
  currentUserId,
  isLoggedIn,
}: {
  thread: CommentThreadType;
  target: { type: "project" | "post"; id: string };
  currentUserId: string | null;
  isLoggedIn: boolean;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <CommentRow comment={thread} currentUserId={currentUserId} />

      <button
        type="button"
        onClick={() => setReplying((v) => !v)}
        className="ml-9 self-start text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
      >
        {replying ? "キャンセル" : "返信する"}
      </button>

      {thread.replies.length > 0 && (
        <div className="ml-9 flex flex-col gap-2 border-l-2 border-[var(--line)] pl-3">
          {thread.replies.map((reply) => (
            <CommentRow key={reply.id} comment={reply} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      {replying && (
        <div className="ml-9">
          <CommentForm
            target={target}
            parentId={thread.id}
            isLoggedIn={isLoggedIn}
            onDone={() => setReplying(false)}
          />
        </div>
      )}
    </div>
  );
}
