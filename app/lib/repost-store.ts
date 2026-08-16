"use client";

// follow-store.tsと同じ考え方: リポスト状態はDB(Repost行)に永続化するが、
// 同じページ内の複数コンポーネント(カード・作品ページ)が同じ最新状態を
// 即座に共有できるよう、クライアント側にもuseSyncExternalStoreによる
// 薄いキャッシュを持つ。初期値はapp/layout.tsxがDBから取得した一覧を
// RepostHydrator経由で流し込む。

import { useSyncExternalStore } from "react";
import { toggleRepost as toggleRepostAction } from "@/app/lib/repost-actions";

type Listener = () => void;

let reposted = new Set<string>();
let hydrated = false;
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

// app/components/RepostHydrator.tsxからマウント時に一度だけ呼ばれる。
export function hydrateReposted(projectIds: string[]) {
  if (hydrated) return;
  hydrated = true;
  reposted = new Set(projectIds);
  emitChange();
}

export function toggleRepost(projectId: string) {
  const next = new Set(reposted);
  if (next.has(projectId)) next.delete(projectId);
  else next.add(projectId);
  reposted = next;
  emitChange();

  void toggleRepostAction(projectId);
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return reposted;
}

const EMPTY_SET: ReadonlySet<string> = new Set();
function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY_SET;
}

export function useRepostedProjects(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useHasReposted(projectId: string): boolean {
  return useRepostedProjects().has(projectId);
}
