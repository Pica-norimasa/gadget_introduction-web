"use client";

import { useActionState } from "react";
import { addProjectMember, removeProjectMember, type ProjectMemberActionState } from "@/app/lib/project-member-actions";
import { AuthorAvatar } from "./AuthorAvatar";

type Member = {
  id: string;
  name: string;
  displayName: string;
  image?: string;
};

const initialState: ProjectMemberActionState = {};

export function ProjectMembersEditor({ projectId, members }: { projectId: string; members: Member[] }) {
  const [addState, addAction, addPending] = useActionState(addProjectMember, initialState);
  const [removeState, removeAction, removePending] = useActionState(removeProjectMember, initialState);

  return (
    <section className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-[var(--ink)]">参加メンバー</h2>
        <p className="mt-1 text-[12.5px] leading-6 text-[var(--ink-faint)]">
          追加されたユーザーは、この作品の制作タイムラインに投稿できます。作品の編集・削除はオーナーのみです。
        </p>
      </div>

      {members.length > 0 ? (
        <div className="mb-4 flex flex-col gap-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-sunken)]/35 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <AuthorAvatar name={member.displayName} image={member.image} size={32} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[var(--ink)]">{member.displayName}</p>
                  <p className="truncate text-[11.5px] text-[var(--ink-faint)]">@{member.name}</p>
                </div>
              </div>
              <form action={removeAction}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="memberUserId" value={member.id} />
                <button
                  type="submit"
                  disabled={removePending}
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--accent)] disabled:opacity-40"
                >
                  外す
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-4 rounded-2xl border border-dashed border-[var(--line)] px-3 py-3 text-[12.5px] text-[var(--ink-faint)]">
          まだ参加メンバーはいません。
        </p>
      )}

      <form action={addAction} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="projectId" value={projectId} />
        <input
          type="text"
          name="memberHandle"
          placeholder="@ユーザーID または Xユーザー名"
          className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)] px-3 py-2 text-[14px] text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={addPending}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-[var(--accent-ink)] disabled:opacity-40"
        >
          {addPending ? "追加中…" : "追加する"}
        </button>
      </form>

      {(addState.error || removeState.error) && (
        <p className="mt-3 text-[12.5px] text-[var(--accent)]">{addState.error ?? removeState.error}</p>
      )}
      {(addState.message || removeState.message) && (
        <p className="mt-3 text-[12.5px] text-[var(--teal)]">{addState.message ?? removeState.message}</p>
      )}
    </section>
  );
}
