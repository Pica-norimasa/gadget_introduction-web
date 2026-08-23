"use client";

import Link from "next/link";
import { useState } from "react";
import type { CommentThread as CommentThreadType, CommentView } from "@/app/lib/queries";
import { AI_BOT_NAME } from "@/app/lib/ai-bot-name";
import { formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "./AuthorAvatar";
import { CommentForm } from "./CommentForm";
import { DeleteCommentButton } from "./DeleteCommentButton";
import { LinkifiedText } from "./LinkifiedText";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { ShareCommentButton } from "./ShareCommentButton";
import { VerifiedBadge } from "./VerifiedBadge";

// コメントは最大500文字(post/postの280文字より長い)まで許容しているため、
// 長文コメント1件でスレッド全体の見た目がかさばらないよう、Xのように
// 一定文字数で折りたたみ、「続きを読む」で全文展開する。ExpandableText.tsx
// (WorkCardの説明文用、60文字・ハッシュタグのみ対応)とは用途が違うため
// 使い回さず、URLリンクにも対応した専用の実装にしている。
const COMMENT_PREVIEW_LENGTH = 220;

function CommentRow({
  comment,
  currentUserId,
  target,
  contentAuthorId,
}: {
  comment: CommentView;
  currentUserId: string | null;
  target: { type: "project" | "post"; id: string };
  // このコメントが付いている作品/投稿そのものの作者ID。作者本人のコメントを
  // 「作者」バッジで目立たせる(Product Huntの「Maker」表示に相当。作者の
  // 反応が埋もれていて気付きにくいという指摘を受けて追加)。
  contentAuthorId: string;
}) {
  // bot(応援コメント)はミュート・ブロック・通報のいずれも対象として
  // 意味を持たない(個人ではなく共有のシステムアカウントのため)ので、
  // 「⋯」メニュー自体を出さない。
  const isBot = comment.authorHandle === AI_BOT_NAME;
  const isContentAuthor = comment.authorId === contentAuthorId;
  const [expanded, setExpanded] = useState(false);
  const isLong = comment.body.length > COMMENT_PREVIEW_LENGTH;
  const shownBody = expanded || !isLong ? comment.body : `${comment.body.slice(0, COMMENT_PREVIEW_LENGTH).trimEnd()}…`;

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3.5">
      <div className="flex items-start gap-2.5">
        <Link href={`/u/${encodeURIComponent(comment.authorHandle)}`} className="shrink-0">
          <AuthorAvatar name={comment.authorName} image={comment.authorImage} size={28} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[12px] text-[var(--ink-faint)]">
              <Link
                href={`/u/${encodeURIComponent(comment.authorHandle)}`}
                className="font-medium text-[var(--ink-soft)] hover:underline"
              >
                {comment.authorName}
              </Link>
              {comment.authorVerified && <VerifiedBadge className="ml-1 inline-block align-[-1px]" />}
              {isContentAuthor && (
                <span className="ml-1 rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                  作者
                </span>
              )}
              {comment.authorSocialHandle && (
                <span className="text-[var(--ink-faint)]"> @{comment.authorSocialHandle}</span>
              )}{" "}
              ・ {formatRelativeHours(comment.hoursAgo)}
            </p>
            {comment.authorId === currentUserId ? (
              <DeleteCommentButton commentId={comment.id} />
            ) : (
              !isBot && (
                <MoreActionsMenu
                  reportTarget={{ type: "comment", id: comment.id }}
                  author={{ id: comment.authorId, name: comment.authorName }}
                />
              )
            )}
          </div>
          {comment.body && (
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-[var(--ink)]">
              <LinkifiedText text={shownBody} />
              {isLong && !expanded && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="ml-1 font-medium text-[var(--teal)] hover:underline"
                >
                  続きを読む
                </button>
              )}
            </p>
          )}
          {comment.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- ローカルアップロードのパスなのでnext/imageの最適化対象外
            <img
              src={comment.imageUrl}
              alt=""
              className="mt-2 max-h-64 max-w-full rounded-xl border border-[var(--line)] object-contain"
            />
          )}
          {/* 自分のコメントだけ、後から「つぶやきとしてもシェア」できるように
              する。他人のコメントの引用防止と、単独投稿にはinspiredByの
              紐付け先が無い(Post.inspiredByProjectIdはプロジェクト限定)
              ためprojectのコメントのみに絞っている。 */}
          {comment.authorId === currentUserId && comment.body && target.type === "project" && (
            <ShareCommentButton commentId={comment.id} />
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
  guestCommentCount,
  contentAuthorId,
}: {
  thread: CommentThreadType;
  target: { type: "project" | "post"; id: string };
  currentUserId: string | null;
  isLoggedIn: boolean;
  guestCommentCount: number;
  contentAuthorId: string;
}) {
  const [replying, setReplying] = useState(false);
  // bot(応援コメント)には返信しても反応が返らないため、返信する導線
  // 自体を出さない(ai-comment.ts参照)。
  const isBot = thread.authorHandle === AI_BOT_NAME;

  return (
    <div className="flex flex-col gap-2.5">
      <CommentRow comment={thread} currentUserId={currentUserId} target={target} contentAuthorId={contentAuthorId} />

      {!isBot && (
        <button
          type="button"
          onClick={() => setReplying((v) => !v)}
          className="ml-9 self-start text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          {replying ? "キャンセル" : "返信する"}
        </button>
      )}

      {thread.replies.length > 0 && (
        <div className="ml-9 flex flex-col gap-2 border-l-2 border-[var(--line)] pl-3">
          {thread.replies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              target={target}
              contentAuthorId={contentAuthorId}
            />
          ))}
        </div>
      )}

      {replying && (
        <div className="ml-9">
          <CommentForm
            target={target}
            parentId={thread.id}
            isLoggedIn={isLoggedIn}
            guestCommentCount={guestCommentCount}
            onDone={() => setReplying(false)}
          />
        </div>
      )}
    </div>
  );
}
