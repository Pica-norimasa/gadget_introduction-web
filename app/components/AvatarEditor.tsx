"use client";

import { useActionState, useRef } from "react";
import { updateAvatar, type UpdateAvatarState } from "@/app/lib/session-actions";
import { AuthorAvatar } from "./AuthorAvatar";

const initialState: UpdateAvatarState = {};

// プロフィールページで自分のアバターを表示・アップロード変更する。
// 選択したその場でフォーム送信する(BioEditor/IdentityBadgeのような
// 表示⇔編集トグルは不要、画像選択自体が既に「変更する」意思表示のため)。
export function AvatarEditor({ name, image, size = 56 }: { name: string; image: string | null; size?: number }) {
  const [state, formAction, pending] = useActionState(updateAvatar, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="relative shrink-0">
      <div style={{ opacity: pending ? 0.5 : 1 }}>
        <AuthorAvatar name={name} image={image} size={size} />
      </div>
      <label
        title="アイコンを変更"
        className="absolute -right-1 -bottom-1 grid h-6 w-6 cursor-pointer place-items-center rounded-full border-2 border-[var(--bg)] bg-[var(--ink)] text-[11px] text-[var(--bg)] hover:opacity-80"
      >
        <span aria-hidden>📷</span>
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/gif,image/webp"
          disabled={pending}
          onChange={() => formRef.current?.requestSubmit()}
          className="hidden"
        />
      </label>
      {state.error && (
        <p className="absolute top-full left-0 mt-1 w-max max-w-40 text-[11px] text-[var(--accent)]">
          {state.error}
        </p>
      )}
    </form>
  );
}
