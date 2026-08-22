"use client";

// フォロー状態はDB(Follow行)に永続化するが、同じページ内の複数コンポーネント
// (カード・作品ページ・StoriesStrip・サイドバー)が同じ最新状態を即座に共有できる
// よう、クライアント側にもuseSyncExternalStoreによる薄いキャッシュを持つ。
// 初期値はapp/layout.tsxがDBから取得した一覧をFollowHydrator経由で流し込む。
// トグル操作はこのローカルキャッシュを楽観的に更新しつつ、Server Action
// (follow-actions.ts)でバックグラウンド永続化する。

import { useSyncExternalStore } from "react";
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

// 自分自身のフォローはfollow-actions.ts側でid比較して弾く(このモジュールは
// 表示名が動的になったため「自分の名前」を安く判定できず、クライアント側では
// 素通しにしている。自分のカードで押した場合、見た目だけ一瞬「フォロー中」に
// なり次回リロードで戻る)。
export function toggleFollow(author: string) {
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
