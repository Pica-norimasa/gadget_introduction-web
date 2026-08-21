"use client";

import { useActionState, useEffect, useState } from "react";
import { updateBio, type UpdateBioState } from "@/app/lib/session-actions";

const initialState: UpdateBioState = {};

// プロフィールページで自分の自己紹介文を表示・編集する。IdentityBadge
// (ヘッダーの表示名編集)と同じ、表示⇔編集のトグルパターン。
export function BioEditor({ bio }: { bio: string | null }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateBio, initialState);

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Server Actionの成功を受けて編集モードを閉じる
      setEditing(false);
    }
  }, [state.success]);

  if (!editing) {
    return (
      <div className="mt-1">
        <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          {bio || "自己紹介はまだありません"}
        </p>
        {/* ヘッダー右上の⚙️(設定)と横位置を揃えるため、このブロック
            (アイコン・名前・自己紹介が入る flex-1 の列)の右端に寄せる。 */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-1 inline-flex items-center gap-1 text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink)]"
          >
            <span aria-hidden>✏️</span>
            編集
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-1 flex flex-col gap-2">
      <textarea
        name="bio"
        defaultValue={bio ?? ""}
        maxLength={160}
        rows={3}
        autoFocus
        placeholder="自己紹介を書く(160文字まで)"
        className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-2.5 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-[var(--accent)]">{state.error}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--accent)] px-3 py-1 text-[12px] font-medium text-[var(--accent-ink)] disabled:opacity-40"
          >
            {pending ? "…" : "保存"}
          </button>
        </div>
      </div>
    </form>
  );
}
