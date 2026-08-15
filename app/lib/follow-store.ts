"use client";

// バックエンドが無いので、フォロー状態はブラウザのメモリ上だけで完結する
// 最小限のグローバルストア。useSyncExternalStoreで複数コンポーネント
// (カード・作品ページ・StoriesStrip・サイドバー)から同じ状態を購読する。
// 既存のモック(StoriesStrip/サイドバーの「フォロー中のビルドログ」)が
// 想定していた4人を初期値にして、見た目が変わらないところから始める。

import { useSyncExternalStore } from "react";

type Listener = () => void;

let followed = new Set<string>(["みかん", "sora", "kaede_p", "ao"]);
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function toggleFollow(author: string) {
  const next = new Set(followed);
  if (next.has(author)) next.delete(author);
  else next.add(author);
  followed = next;
  emitChange();
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
