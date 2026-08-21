"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { updateDisplayName, type UpdateNameState } from "@/app/lib/session-actions";

const initialState: UpdateNameState = {};

export function IdentityBadge({
  name,
  handle,
  image,
}: {
  name: string | null;
  // /u/[name]プロフィールへのリンク先。ハンドル(User.name)が無い
  // (=まだUser行が存在しない初回訪問者)場合はリンク自体を出さない。
  handle: string | null;
  image?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateDisplayName, initialState);

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Server Actionの成功を受けて編集モードを閉じる
      setEditing(false);
    }
  }, [state.success]);

  if (!editing) {
    // プロフィールへの遷移(Link)と表示名の編集(button)は役割が違うので、
    // WorkCard等と同じく<a>の入れ子を避けて兄弟要素として分けている。
    const avatar = image ? (
      // eslint-disable-next-line @next/next/no-img-element -- GitHubのアバター画像、next/imageのドメイン設定不要な簡易表示
      <img src={image} alt="" className="h-4 w-4 shrink-0 rounded-full" />
    ) : (
      // 絵文字はフォントによって行内での縦位置がまちまちで、img版(h-4 w-4)
      // と揃えないとモバイル(アイコンのみ表示)で中央からずれて見える。
      // 画像と同じ箱サイズにしてgridで中央寄せすることで揃える。
      <span aria-hidden className="grid h-4 w-4 shrink-0 place-items-center leading-none">
        👤
      </span>
    );

    return (
      <div className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--line)] pl-2.5 pr-1 py-1 sm:pl-3">
        {handle ? (
          <Link
            href={`/u/${encodeURIComponent(handle)}`}
            title="自分のプロフィール"
            className="flex items-center gap-1.5 text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)]"
          >
            {avatar}
            <span className="max-w-[84px] truncate sm:max-w-none">{name ?? "ゲスト"}</span>
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 text-[13px] text-[var(--ink-soft)]">
            {avatar}
            <span className="max-w-[84px] truncate sm:max-w-none">{name ?? "ゲスト"}</span>
          </span>
        )}
        {/* 表示名の変更ボタンは頻度の低い操作なので、幅の厳しいモバイルでは
            隠す(プロフィールページの自己紹介編集等、他の導線に任せる)。 */}
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="表示名を変更"
          aria-label="表示名を変更"
          className="hidden shrink-0 rounded-full p-1 text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink-soft)] sm:block"
        >
          <span aria-hidden>✏️</span>
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input
        type="text"
        name="name"
        defaultValue={name ?? ""}
        maxLength={20}
        autoFocus
        placeholder="表示名"
        className="w-24 rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-1.5 text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] sm:w-28"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-[12px] font-medium text-[var(--accent-ink)] disabled:opacity-40"
      >
        {pending ? "…" : "保存"}
      </button>
      {state.error && <span className="text-[11px] text-[var(--accent)]">{state.error}</span>}
    </form>
  );
}
