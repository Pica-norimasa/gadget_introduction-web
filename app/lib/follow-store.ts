"use client";

// フォロー状態はDB(Follow行)に永続化するが、同じページ内の複数コンポーネント
// (カード・作品ページ・StoriesStrip・サイドバー)が同じ最新状態を即座に共有できる
// よう、クライアント側にもuseSyncExternalStoreによる薄いキャッシュを持つ。
// 初期値はapp/layout.tsxがDBから取得した一覧をFollowHydrator経由で流し込む。
// トグル操作はこのローカルキャッシュを楽観的に更新しつつ、Server Action
// (follow-actions.ts)でバックグラウンド永続化する。

import { useSyncExternalStore } from "react";
import { GUEST_USER_NAME } from "@/app/lib/guest-user";
import { toggleFollowAction } from "@/app/lib/follow-actions";

type Listener = () => void;

let followed = new Set<string>();
let hydrated = false;
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

// app/components/FollowHydrator.tsxからマウント時に一度だけ呼ばれる。
export function hydrateFollowed(names: string[]) {
  if (hydrated) return;
  hydrated = true;
  followed = new Set(names);
  emitChange();
}

export function toggleFollow(author: string) {
  if (author === GUEST_USER_NAME) return; // 自分自身はフォローできない

  const next = new Set(followed);
  if (next.has(author)) next.delete(author);
  else next.add(author);
  followed = next;
  emitChange();

  void toggleFollowAction(author);
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return followed;
}

const EMPTY_SET: ReadonlySet<string> = new Set();
function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY_SET;
}

export function useFollowedAuthors(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsFollowing(author: string): boolean {
  return useFollowedAuthors().has(author);
}
